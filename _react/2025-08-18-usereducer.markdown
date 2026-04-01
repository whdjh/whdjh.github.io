---
layout: post
title: "useReducer"
date: 2025-08-18 00:00:00 +0900
categories: dev
---

**리액트 훅 시리즈** 세 번째 — `useReducer`로 복잡한 상태를 한곳에서 관리하는 방법을 정리한 글이다.

원본링크: https://velog.io/@wngns9807/useReducer

---

## 왜 공부하게 되었나?

컴포넌트를 작성할 때 상태 관리를 위해 **useState**를 기본으로 썼다.  
간단한 값 하나만 다룰 때는 충분했지만, **상태 개수**가 늘어나면서 코드가 점점 복잡해졌다.

특히 **여러 상태가 서로 연관**되어 있을 때는, useState만으로는 **가독성**이 떨어지고 **유지보수**가 어려웠다.  
그래서 더 나은 상태 관리 방법을 찾다가 **useReducer** 훅을 학습하게 됐다.

---

## 문제 상황

처음에는 상태를 **useState**로만 관리했다.  
프로젝트가 커지고 관리할 상태가 많아지면서, 같은 컴포넌트 안에 **useState가 많이 나열**되고 가독성이 급격히 떨어졌다.

```tsx
function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setName(e.target.value);
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEmail(e.target.value);
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPassword(e.target.value);
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setConfirmPassword(e.target.value);

  return (
    <form>
      <input value={name} onChange={handleNameChange} />
      <input value={email} onChange={handleEmailChange} />
      <input value={password} onChange={handlePasswordChange} />
      <input value={confirmPassword} onChange={handleConfirmPasswordChange} />
    </form>
  );
}
```

상태와 핸들러가 반복되면서 **흐름을 한눈에 보기 어려워졌다.**

---

## 공부 내용

### useReducer란?

1. **useState**처럼 상태를 관리하지만, **reducer**라는 함수를 통해 **상태 업데이트 로직을 한곳에 모아** 관리한다.  
   상태와 **액션**을 분리해서 다룬다.[^1]
2. **상태 관리가 복잡할수록** 이점이 커진다.

### 적용 예시

타입은 `name`만 적고, 나머지 필드는 동일하므로 생략한다.

```tsx
// 컴포넌트가 관리하는 상태 전체를 객체로 관리
type State = {
  name: string;
  // email, password, confirmPassword ...
};

// 상태를 어떻게 바꿀지 설명하는 객체. dispatch(action)으로 전달
// type: 어떤 동작을 할지 (예: name을 바꾼다)
// payload: 그 동작에 필요한 값 (SET_NAME이면 바꿀 name 값)
type Action =
  | { type: "SET_NAME"; payload: string }
  // | { type: "SET_EMAIL"; payload: string } ...
  ;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.payload };
    // ...
    default:
      return state;
  }
}

function SignUpForm() {
  const [state, dispatch] = useReducer(reducer, {
    name: "",
    // ...
  });

  return (
    <form>
      <input
        value={state.name}
        onChange={(e) =>
          dispatch({ type: "SET_NAME", payload: e.target.value })
        }
      />
      {/* ... */}
    </form>
  );
}
```

---

## 결과

상태 업데이트 로직을 **reducer 한곳**에 모아 두었기 때문에, 상태가 늘어나도 **state**와 **dispatch**만 신경 쓰면 됐다.  
**상태 변경 흐름**을 한눈에 파악하기 쉬워졌다.
