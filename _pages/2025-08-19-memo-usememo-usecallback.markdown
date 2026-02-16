---
layout: post
title: "memo vs useMemo, 나아가 useCallback까지"
date: 2025-08-19 00:00:00 +0900
categories: dev
---

**리액트 훅 시리즈** 네 번째 — `React.memo`, `useMemo`, `useCallback`으로 렌더링·연산·함수를 최적화하는 방법을 정리한 글이다.

원본링크: https://velog.io/@wngns9807/memo-vs-useMemo-%EB%82%98%EC%95%84%EA%B0%80-useCallback%EA%B9%8C%EC%A7%80

---

## 왜 공부하게 되었나?

프로젝트를 진행하면서 **성능 최적화**가 필요하다고 느꼈다.

특히 **리스트 렌더링**이나, **부모가 리렌더될 때 자식까지 불필요하게 다시 그려지는** 문제가 있었다.  
처음에는 **memo**로 감싸서 해결하자고 생각했는데, **useMemo**도 비슷한 맥락에서 자주 쓰여서 **차이**를 정리할 필요가 생겼다.

---

## 문제 상황

React 프로젝트에서 **Input** 컴포넌트를 재사용할 때, **부모가 리렌더**되면 자식 Input도 **매번 리렌더**되는 문제가 있었다.  
특히 **useFormContext**로 묶인 상태라, Input이 여러 개면 성능 부담이 커질 수 있었다.

```tsx
function Input({ ..., size, ... }) {
  const sizeClass = {
    xs: 'tab:w-[17.6875rem] w-[13.125rem]',
    sm: 'pc:w-[25rem] w-[19.4375rem]',
    md: 'w-[28rem]',
    lg: 'w-full',
  }[size || 'lg'];

  return (
    // ...
  );
}

export default memo(Input);
```

그래서 이 컴포넌트는 **React.memo**로 감싸 두었다.  
즉, **부모가 리렌더돼도 props가 바뀌지 않으면** Input은 다시 그리지 않도록 최적화한 것이다.

하지만 이 수준만으로는 부족했다. **복잡한 스타일**과 **RHF(React Hook Form)** 유효성 검사 규칙 생성 등으로 컴포넌트 **내부 연산**이 무거웠다.  
그래서 **컴포넌트 내부 연산**에도 최적화가 필요했다.

---

## 공부 내용

### React.memo

- Input의 **props**(name, type, rules, label 등)가 **바뀌지 않으면**, 부모가 리렌더되더라도 Input은 **다시 그려지지 않는다.**[^1]
- **컴포넌트 단위** 리렌더링 최적화에 초점을 둔다.

### useMemo

- 컴포넌트 **내부**에서 쓰는 **값**을 메모이제이션한다.
- **의존성 배열**이 바뀔 때만 다시 계산하고, 그렇지 않으면 **캐싱된 값**을 쓴다.
- **컴포넌트 내부 연산** 최적화에 초점을 둔다.

정리하면, **memo**는 **컴포넌트 자체** 리렌더링 최적화, **useMemo**는 **컴포넌트 내부 연산** 최적화다.

### size 연산에 useMemo 적용

```tsx
const sizeClass = useMemo(() => {
  return {
    xs: 'tab:w-[17.6875rem] w-[13.125rem]',
    sm: 'pc:w-[25rem] w-[19.4375rem]',
    md: 'w-[28rem]',
    lg: 'w-full',
  }[size || 'lg'];
}, [size]);
```

**size**가 바뀔 때만 다시 계산하고, 나머지에는 **캐싱된 값**을 써서 연산을 줄일 수 있다.

### useCallback

- **useMemo**를 계속 쓰다 보니, "함수는 **useCallback**으로만 따로 쓰면 되지 않나?"라는 생각이 들었다.
- **useCallback**은 컴포넌트 안에서 **함수 객체**를 캐싱하고 싶을 때 쓴다. **함수 자체를 기억**한다고 보면 되고, **이벤트 핸들러**에 많이 쓴다.[^2]
- **useMemo의 함수 특화 버전**이라고 기억하면 된다. (`useCallback(fn, deps)` ≒ `useMemo(() => fn, deps)`)

---

### 한 줄 정리

| 대상 | 역할 | 중점 |
|------|------|------|
| **React.memo** | 컴포넌트 자체 최적화 | **props** 변화 |
| **useMemo** | 컴포넌트 내부 **값** 최적화 | **계산**·의존성 |
| **useCallback** | **함수** 최적화 | **이벤트 핸들러** 등 |

---

## 결과

- Input이 여러 개여도 **부모가 리렌더**돼도 **memo** 덕분에 props가 같으면 다시 그리지 않았다.
- **useMemo**로 `sizeClass` 같은 내부 연산을 줄여, 불필요한 계산을 최소화했다.

이 포스트는 **리액트 훅 시리즈** 중 하나다. [useState 원리](/others/2025-08-04-usestate-principle/), [useEffect](/others/2025-08-06-useeffect/), [useReducer](/others/2025-08-18-usereducer/)에 이어 `memo` / `useMemo` / `useCallback`을 정리했다.

---

[^1]: [React docs – memo](https://react.dev/reference/react/memo): *"memo lets you skip re-rendering a component when its props are unchanged."*
[^2]: [React docs – useCallback](https://react.dev/reference/react/useCallback): *"useCallback is a Hook that lets you cache a function definition between re-renders."*
