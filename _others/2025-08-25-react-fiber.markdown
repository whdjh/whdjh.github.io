---
layout: post
title: "React Fiber"
date: 2025-08-25 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/React-Fiber

---

## 왜 공부하게 되었나?

리액트를 쓰다 보니 setState를 호출해도 상태가 바로 반영되지 않는 이유가 궁금해졌다.  
이벤트 핸들러 안에서 값을 출력하면 이전 값만 보이고, 렌더가 끝난 뒤에야 업데이트가 반영되는 현상이 반복됐기 때문이다.

또한 훅을 조건문 안에서 호출하면 에러가 나는 이유를 “규칙이니까”로만 받아들이기엔 부족했다.  
Fiber 구조와 훅의 내부 동작을 이해해야, 왜 이런 제약이 있는지 납득할 수 있을 것 같아서 공부하게 됐다.

---

## 문제 상황

### 1. setState 호출 후 상태가 즉시 반영되지 않음

Fiber의 updateQueue에 상태 업데이트가 쌓이고, 렌더링 주기가 끝날 때 일괄 처리(Batch) 되기 때문이다.

```tsx
const [cnt, setCnt] = useState(0);

const handleClick = () => {
  setCnt(cnt + 1);
  console.log(cnt); // 0
  setCnt(cnt + 1);
  console.log(cnt); // 0
};
```

### 2. 훅을 if문·함수 안에서 호출하면 안 됨

훅은 Fiber의 memoizedState에 연결 리스트 형태로 저장된다.  
호출 순서가 바뀌면 이전 렌더와 매칭이 깨져 상태가 꼬인다.

```tsx
if (condition) {
  const [state, setState] = useState(0); // ❌ 조건에 따라 호출 순서가 바뀜
}
```

---

## 공부 내용

### Fiber 재조정자(Reconciler)

- 렌더링 이전·이후의 가상 DOM을 비교해, 변경 사항을 실제 DOM에 반영하는 작업이다.
- 렌더링이란: 컴포넌트 함수가 호출되어 가상 DOM이 만들어지는 과정. 정확히는 렌더 단계에서 “다음 트리·다음 상태”를 계산하는 과정이다.
- React 16 이전에는 스택 재조정자라서, 작업을 잘게 나누어 일시 중단/재개할 수 없었고, 긴 작업이 메인 스레드를 오래 잡았다.
- React 16에서 Fiber 재조정자가 도입되어, 렌더링 작업을 작은 단위로 나누고 우선순위가 높은 작업을 먼저 처리할 수 있게 됐다.

### Fiber Node

- React 16.8 이전에는 함수형 컴포넌트가 상태를 가질 수 없었다. 훅으로 상태를 관리하게 되면서, 그 정보를 담을 구조가 필요해졌다.
- Fiber Node는 훅을 포함한 컴포넌트의 모든 상태를 담는 JS 객체다.

### Fiber 속성 (요약)

컴포넌트 유형·식별

- `tag`, `key`, `elementType`, `type`, `stateNode`

노드 간 관계 (트리 구조)

- `return` (부모), `child` (첫 자식), `sibling` (형제), `index`

Ref

- `ref`

데이터·상태

- `pendingProps`, `memoizedProps`, `updateQueue`, `memoizedState`, `dependencies`, `mode`

업데이트·사이드 이펙트

- `flags`, `subtreeFlags`, `deletions`

우선순위·스케줄링

- `lanes`, `childLanes` (동시성, Transition, Suspense 등)

이중 버퍼링

- `alternate`: 현재 트리와 작업 중인 트리를 이어 주는 대응 Fiber

### updateQueue

상태 업데이트를 담는 큐다.  
setState를 호출하면 updateQueue에 추가되고, 다음 렌더 단계에서 큐를 소비해 다음 상태를 계산한 뒤, 커밋 단계에서 DOM에 반영한다.

> 렌더링 주기: 이벤트 핸들러, 생명주기 메서드 등 한 번의 “흐름” 단위. 이 안에서 여러 setState가 쌓여도 한 번에 Batch 처리된다.

### memoizedState

훅을 저장해, 함수형 컴포넌트가 다시 렌더돼도 이전 훅 상태를 유지한다.  
연결 리스트 형태로 훅이 순서대로 달려 있다.

```tsx
function ExampleComponent() {
  const [cnt, setCnt] = useState(0);      // 1번째 훅
  const [text, setText] = useState("hi"); // 2번째 훅
  useEffect(() => {
    document.title = text + cnt;
  }, [text, cnt]);                        // 3번째 훅
}
```

Fiber에서는 대략 다음과 같이 연결된다.

```tsx
Fiber.memoizedState = {
  memoizedState: 0,  // 1번째: useState(0)
  next: {
    memoizedState: "hi",  // 2번째: useState('hi')
    next: {
      memoizedState: { deps: ["hi", 0], /* effect 정보 */ },  // 3번째: useEffect
      next: null,
    },
  },
};
```

훅 호출 순서가 바뀌면 이 리스트와 매칭이 깨지기 때문에, 조건문·반복문 안에서 훅을 호출하면 안 된다는 규칙이 생긴다.

---

## 결과

React Fiber는 리액트의 재조정 엔진이자, 컴포넌트의 모든 상태(훅, props, updateQueue 등)를 담는 JS 객체다.  
이 구조를 알면 setState의 Batch 동작, 훅 규칙, 렌더/커밋 단계가 왜 그렇게 동작하는지 더 잘 이해할 수 있다.
