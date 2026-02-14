---
layout: post
title: "useEffect"
date: 2025-08-06 00:00:00 +0900
categories: dev
---

**리액트 훅 시리즈** 두 번째 — `useEffect`로 부수 효과를 다루는 방법을 정리한 글이다.

원본링크: https://velog.io/@wngns9807/useEffect

---

## 왜 공부하게 되었나?

`useEffect`와 관련된 **예상치 못한 버그**를 자주 마주하게 됐다.

처음에는 "컴포넌트가 마운트될 때 API 호출하고, 언마운트될 때 정리하면 되겠지"라고만 생각했다.  
하지만 실제로는 **메모리 누수**, **무한 렌더링**, **의도하지 않은 중복 호출** 같은 문제가 계속 생겼다.  
특히 팀 코드 리뷰에서 **"useEffect의 실행 순서와 cleanup 타이밍을 제대로 이해하고 있나요?"**라고 물었을 때, 명확히 답하지 못한 게 계기가 됐다.

그래서 이번에 `useEffect`를 처음부터 다시 파헤쳐보기로 했다.

---

## 문제 상황

**부모–자식 컴포넌트** 구조에서 데이터 흐름을 다룰 때였다.  
부모에서 API를 호출해 데이터를 가져오고, 자식에서 그 데이터로 추가 처리를 하는 상황인데, **실행 순서**가 예상과 달라서 `undefined` 에러가 자주 났다.

특히 **부모의 데이터 로딩이 끝나기 전에** 자식에서 그 데이터에 접근하려다 **런타임 에러**가 나는 경우가 많았다.

---

## 공부한 내용

### 1. useEffect란?

함수형 컴포넌트에서 **상태와 UI의 일관성**을 지키기 위해 **부수 효과(Side Effect)**를 다루는 Hook이다.[^1]  
React에서는 컴포넌트 렌더링 로직이 **순수 함수**여야 하므로, DOM 조작·구독·API 호출 같은 부수 효과는 렌더링과 분리해 `useEffect`에서 처리한다.

```tsx
// 렌더링 중 부수 효과 발생 → 동작은 하지만 React가 권장하지 않음
function Test1() {
  document.title = "title";
  return <h1>title</h1>;
}

// 렌더링이 끝난 뒤 안전하게 실행
function Test2() {
  useEffect(() => {
    document.title = "title";
  }, []);
  return <h1>title</h1>;
}
```

---

### 2. 사용법

#### 첫 번째 인자 — Effect Callback

- 수행하고 싶은 **부수 효과** 코드를 넣는다.
- 이 콜백은 **컴포넌트가 화면에 반영된 뒤(커밋 단계 이후)** 실행되는 것이 보장된다.[^2]

```tsx
useEffect(() => {
  const fetchData = async () => {
    const userData = await fetch("/api/user");
    const user = await userData.json();
    setUser(user); // 상태를 바꾸는 부수 효과
  };
  fetchData();
}, []);
```

#### Effect Callback의 반환 함수 — Cleanup

- **선택적으로** 함수를 반환할 수 있고, 이 함수가 **cleanup**이다.
- **의존성 배열이 바뀌어 effect가 다시 실행될 때**와 **컴포넌트가 언마운트될 때** 실행된다.
- cleanup을 쓰지 않으면, 아래처럼 **이벤트 리스너가 계속 쌓여 메모리 누수**가 날 수 있다.

```tsx
function Test() {
  const [cnt, setCnt] = useState(0);

  useEffect(() => {
    const handleDocumentClick = () => {
      console.log("click!!");
    };

    document.addEventListener("click", handleDocumentClick);
    // cleanup 없음 → cnt가 바뀔 때마다 리스너가 하나씩 더 붙음
  }, [cnt]);

  return (
    <button onClick={() => setCnt((prev) => prev + 1)}>cnt 증가</button>
  );
}
```

![cleanup 없을 때 이벤트 리스너 중첩](/assets/img/27.png)

```tsx
useEffect(() => {
  const handleDocumentClick = () => {
    console.log("click!!");
  };

  document.addEventListener("click", handleDocumentClick);

  return () => {
    document.removeEventListener("click", handleDocumentClick);
  };
}, []);
```

---

#### 두 번째 인자 — 의존성 배열

- effect가 **언제 실행될지** 정하는 배열이다.
- React는 의존성 배열을 **이전 렌더와 비교**해, 하나라도 바뀌었으면 effect를 다시 실행한다.

```tsx
// React 내부 의존성 비교 로직 (단순화)
function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps == null || nextDeps.length !== prevDeps.length) {
    return false;
  }

  for (let i = 0; i < nextDeps.length; i++) {
    if (!Object.is(nextDeps[i], prevDeps[i])) {
      return false;
    }
  }
  return true;
}
```

- **첫 마운트**에는 `prevDeps`가 없으므로 항상 `false` → effect 실행.
- **Object.is()**로 각 항목을 비교해서, 하나라도 다르면 effect를 다시 실행한다.

---

### 3. 실행 순서

```tsx
function Parent() {
  const [_, reRender] = useState(false);

  useEffect(() => {
    console.log("부모 컴포넌트 Effect");
    return () => {
      console.log("부모 컴포넌트 Cleanup");
    };
  });

  return (
    <>
      <Child />
      <button onClick={() => reRender(true)}>리렌더링</button>
    </>
  );
}

function Child() {
  useEffect(() => {
    console.log("자식 컴포넌트 Effect");
    return () => {
      console.log("자식 컴포넌트 Cleanup");
    };
  });

  return null;
}
```

- React는 **렌더가 모두 끝난 뒤** 등록된 effect를 처리할 때 **자식 → 부모** 순서로 실행하고, **cleanup도 자식 → 부모** 순서로 실행한다.[^3]
- commit 단계에서 **depth-first traversal**로 effect를 처리하기 때문이다.

```bash
-----렌더링 시작-----
자식 컴포넌트 Effect
부모 컴포넌트 Effect
-----렌더링 종료-----
-----리렌더링 시작-----
자식 컴포넌트 Cleanup
부모 컴포넌트 Cleanup
-----리렌더링 종료-----
-----callback 시작-----
자식 컴포넌트 Effect
부모 컴포넌트 Effect
-----callback 종료-----
```

---

## 깨달은 점

- 처음에는 useEffect를 **"컴포넌트 생명주기를 대신하는 Hook"** 정도로만 생각했다.  
  **의존성 배열**과 **cleanup** 설계가 인상적이었다.  
  "이 effect는 어떤 값에 의존하는지", "정리할 때 무엇을 해야 하는지"를 **선언**하게 해서, 예측 가능하고 디버깅하기 쉬운 코드를 짤 수 있게 해준다.

- **실행 순서**를 이해하는 게 중요하다.  
  복잡한 컴포넌트 트리에서 데이터 흐름을 다룰 때, "부모 → 자식으로 데이터가 흐른다"는 것뿐 아니라 **effect·cleanup의 실행 순서(자식 → 부모)**까지 생각해야 한다.

이 포스트는 **리액트 훅 시리즈** 중 하나다. [useState 원리](/dev/2025-08-04-usestate-principle.html)에 이어 `useEffect`를 정리했다. 다음에는 `useRef`, `useCallback` 등으로 이어갈 예정이다.

---

[^1]: [React docs – You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect): 렌더링 중에 계산할 수 있는 값은 state로 두고, 이벤트 핸들러로 처리할 수 있는 건 effect 대신 이벤트에서 처리하는 게 좋다.
[^2]: [React docs – useEffect](https://react.dev/reference/react/useEffect): *"Effects run after the browser has painted the screen. This keeps your Effect from blocking the initial render."*
[^3]: [React docs – Lifecycle of Reactive Effects](https://react.dev/learn/lifecycle-of-reactive-effects): *"React runs the cleanup from the previous effect before running the next effect."* — 의존성이 바뀌면 이전 effect의 cleanup이 먼저 실행된 뒤 새 effect가 실행된다.
