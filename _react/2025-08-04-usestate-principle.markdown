---
layout: post
title: "useState"
date: 2025-08-04 00:00:00 +0900
categories: dev
---

**리액트 훅 시리즈** 첫 번째 — `useState`가 어떻게 동작하는지 정리한 글이다.

원본링크: https://velog.io/@wngns9807/%ED%95%A8%EC%88%98%ED%98%95-%EC%BB%B4%ED%8F%AC%EB%84%8C%ED%8A%B8-%EC%83%81%ED%83%9C-%EA%B4%80%EB%A6%AC%EC%9D%98-%EC%9B%90%EB%A6%ACuseState

---

## 왜 공부하게 되었나?

`useState`는 정말 자연스럽게, 마치 숨 쉬듯 사용해왔다. 간단한 상태 관리부터 복잡한 폼 처리까지, 하루에도 수십 번은 `const [state, setState] = useState()`를 타이핑했다.

하지만 **"useState는 어떻게 동작하는가?"**에 대해서는 깊이 생각해본 적이 없었다.

- "상태가 바뀌면 리렌더링이 된다"
- "함수형 컴포넌트에서 상태를 관리할 수 있게 해준다"
- "Hook이니까 최상위에서만 호출해야 한다"

정도의 **표면적인 지식**만 가지고 있었다.

그런데 **복잡한 상태 로직**을 다루면서 예상치 못한 버그가 생기기 시작했다. 상태 업데이트가 예상과 다르게 동작하거나, 성능 이슈가 나거나, **클로저** 때문에 오래된 상태 값을 참조하는 문제들이었다.

이런 문제를 해결하면서 깨달았다. useState를 **"그냥 쓸 줄 아는"** 것과 **"원리를 이해하고 쓰는"** 것 사이에는 차이가 크다는 것. React의 핵심 동작 원리를 이해하면 더 효율적이고 안정적인 코드를 쓸 수 있다는 확신이 들었다.

특히 다음과 같은 궁금증이 생겼다.

- 함수형 컴포넌트는 **매번 새로 실행**되는데, 어떻게 상태를 **기억**하고 있을까?
- `setState`를 **여러 번** 호출하면 리렌더링도 여러 번 일어날까?
- 왜 Hook은 **조건문 안**에서 호출하면 안 될까?
- React는 어떻게 **각 컴포넌트의 상태**를 구분해서 관리할까?

이런 질문에 답하기 위해 **useState의 내부 동작 원리**를 파헤쳐보기로 했다.

---

## 문제 상황

- **비동기적 상태 업데이트 이해 부족**  
  `setState` 호출이 즉시 상태를 바꾸지 않고 **비동기적으로** 처리된다는 점을 모를 때가 많다.  
  여러 번 연달아 업데이트할 때 **이전 상태값**이 아니라 **최신 상태값**을 기준으로 해야 하는 상황에서 실수하기 쉽다.

- **직접 상태 변경 시도 (불변성)**  
  배열·객체 상태를 **직접 변경**(예: `state.push()`)한 뒤 `setState`를 호출하는 실수.  
  **불변성**을 지켜야 리렌더링이 제대로 일어난다.

이런 문제를 겪으면서 깨달았다. useState를 "잘 쓴다"고 생각했지만, **내부 동작 원리**를 모르니까 예측할 수 없는 버그가 생긴다는 것.  
이제 useState가 어떻게 동작하는지, React가 상태를 어떻게 관리하는지 제대로 알아야겠다고 결심했다.

---

## 공부한 내용

### 1. useState 상태 관리의 두 가지 관점

#### 클래스 컴포넌트 (리액트 생명주기)

```tsx
class Test extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cnt: 0,
      name: "jh",
    };
  }

  handleIncrement = () => {
    this.setState({ cnt: this.state.cnt + 1 });
  };
}
```

- **컴포넌트 마운트** → 인스턴스 생성 및 상태 저장  
- **컴포넌트 언마운트** → 인스턴스·상태 삭제  

즉, **인스턴스가 살아 있는 동안**만 `state`가 유지된다.

#### 함수형 컴포넌트

```tsx
import { useState } from 'react';

function Test() {
  const [state, setState] = useState(0);
}
```

- 함수형 컴포넌트에서 상태를 다룰 수 있게 해주는 **React 내장 Hook**
- **배열 구조 분해**로  
  - **현재 상태값**을 가진 변수(`state`)  
  - **상태를 바꾸는 함수**(`setState`)  
  를 받는다.

여기서 의문이 생긴다.  
인스턴스가 없어서 **렌더링될 때마다 함수가 새로 실행**된다.  
함수가 재실행되면 변수는 다 초기화될 텐데, **useState는 어떻게 상태를 유지할까?**[^1]

---

### 2. 구현해 보기

#### (1) JS 클로저

```js
function outer() {
  let a = 1;
  let inner = () => {
    a += 1;
    return a;
  };
  return inner;
}

const fn = outer();
console.log(fn()); // 2
console.log(fn()); // 3
```

1. `const fn = outer()`가 실행되면 **렉시컬 환경**이 만들어진다.  
   전역 → `outer` 순으로 스코프가 이어지고, `fn`에는 `inner`가 들어간다.

![클로저 — outer 렉시컬 환경](/assets/img/19.png)

2. `fn()`을 실행하면 **inner 렉시컬 환경**이 만들어진다.  
   이때 **outer의 `a`**에 접근할 수 있다.

![클로저 — inner 실행 시 outer의 a 참조](/assets/img/20.png)

즉, **내부 함수가 외부 함수보다 더 오래 유지**되면,  
외부 함수 실행이 끝나도 **외부 함수의 변수**에 접근할 수 있다.

---

#### (2) state를 “함수 내부”에 두는 경우

```ts
const useState = (initialValue) => {
  let state = initialValue;

  const setState = (newState) => {
    state = newState;
  };

  return [state, setState];
};

function Test() {
  const [cnt, setCnt] = useState(0);
  console.log(cnt);
  setCnt(4);
}

Test(); // 0
Test(); // 0
```

1. `Test`가 실행되고 `useState`가 실행된다.  
   `useState` 실행이 끝나도 **setState가 `state`를 참조**하므로 `state`는 메모리에 남는다.

![useState 내부 — state가 클로저로 유지](/assets/img/21.png)

2. `setState(4)`로 **state**가 4로 바뀐다.

![setState로 state 변경](/assets/img/22.png)

3. `setState`가 끝나고 `Test`가 끝나면, 그 **함수 스코프**에 있던 `state`도 함께 정리된다.

4. 그래서 **Test를 다시 실행**하면 새로 만든 `useState`의 `state`를 쓰게 되고, **다시 0**이 나온다.

즉, `state`가 **useState 함수 안**에만 있으면, **상태 저장 위치가 “컴포넌트(함수) 내부”**처럼 동작한다.

하지만 [React 공식 문서](https://react.dev/learn/state-a-components-memory)에서는 이렇게 설명한다.  
state는 함수가 반환된 뒤 사라지는 **일반 변수**와 다르고, **React 자체에 있는 “함수 바깥 선반”**에 둔 것처럼 존재한다고.[^2]

---

#### (3) state를 “외부”에 두는 경우

```ts
const React = (() => {
  let state; // "외부 선반"

  let useState = (initState) => {
    if (state === undefined) state = initState;

    const setState = (newState) => {
      state = newState;
    };

    return [state, setState];
  };

  return { useState };
})();

function Test() {
  const [cnt, setCnt] = React.useState(0);
  console.log(cnt);
  setCnt(4);
}

Test(); // 0
Test(); // 4
```

1. **React**가 즉시 실행 함수로 한 번 실행된 뒤 끝나도, **setState가 `state`를 참조**하므로 `state`는 메모리에 유지된다.

![외부 state 유지](/assets/img/23.png)

2. `Test` 실행 → `useState` 실행 → `setCnt(4)` 실행 → **외부의 `state`**가 4로 바뀐다.

![setState로 외부 state 변경](/assets/img/24.png)

3. `setState`, `useState`, `Test`가 모두 끝나도 **메모리의 `state`**는 그대로다.

![Test 종료 후에도 state 유지](/assets/img/25.png)

4. **Test()를 다시 실행**해도, 같은 **외부 `state`**를 쓰기 때문에 **4**가 출력된다.

![다시 Test 실행 시 유지된 state 사용](/assets/img/26.png)

즉, **state를 React(모듈) 쪽에 두면**, 컴포넌트 실행이 끝나도 **상태가 유지**되고, **저장 위치가 “외부”**에 있는 것처럼 동작한다.

---

### 3. Hook 규칙

React는 **호출 순서**로 훅을 구분한다.  
훅 호출 순서에 따라 상태를 **배열**에 넣어 두기 때문에,  
**반복문·조건문 안**에서 훅을 호출하면 안 된다.  
매 렌더마다 **같은 순서**, **같은 개수**로 훅이 호출되어야 한다.

---

## 깨달은 점

- **실제 React의 useState**는 우리가 만든 예시보다 훨씬 복잡하다.
  - **컴포넌트별 상태 분리**: 컴포넌트 인스턴스(fiber 노드)마다 상태를 따로 관리한다.
  - **리렌더링**: 상태가 바뀌면 해당 컴포넌트를 다시 렌더링한다.
  - **배치 처리**: 여러 상태 변경을 한 번에 모아서 처리한다.

- **클로저와 “외부 선반”**  
  useState가 **클로저**를 이용해 값을 유지한다는 걸 이해하게 됐다.  
  React가 **컴포넌트 바깥**에서 상태를 관리하는 “외부 선반” 역할을 한다는 공식 문서 설명이 이해됐고,  
  함수형 컴포넌트가 매번 새로 실행돼도 **상태가 유지되는 이유**를 설명할 수 있게 됐다.

- **불변성**  
  React가 **상태 변경을 감지하는 방식**을 알고 나니,  
  왜 불변성을 지켜야 하는지 **근본적으로** 이해하게 됐다.  
  “규칙”이 아니라 **렌더링·최적화**와 연결된 원리라는 걸 깨달았다.
