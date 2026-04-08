---
layout: post
title: "호이스팅과 클로저"
date: 2025-03-12 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/%ED%98%B8%EC%9D%B4%EC%8A%A4%ED%8C%85%EA%B3%BC-%ED%81%B4%EB%A1%9C%EC%A0%80

---

## 왜 공부하게 되었나

JS를 쓰면서 변수나 함수 접근 시 예상치 못한 동작이 발생하고,  
함수 내부에서 외부 변수를 참조할 때 스코프와 실행 시점이 헷갈렸다.  
그래서 실행 컨텍스트와 스코프가 코드 동작에 어떻게 영향을 주는지 이해하고자 공부하게 되었다.

---

## 문제 상황

- `var`, `let`, `const` 변수 접근 시 동작이 달라 예기치 않은 `undefined`나 `ReferenceError`가 발생
- 함수가 종료된 후에도 내부 함수에서 외부 변수에 접근 가능한지 몰라 상태 유지 구현에 어려움이 생김

---

## 실행 컨텍스트

- 실행 컨텍스트는 코드가 실행되는 환경 스냅샷으로  
  렉시컬 환경(LexicalEnvironment), 변수 환경(VariableEnvironment), `this` 바인딩으로 구성된다.
- 컨텍스트는 생성 단계 → 실행 단계 순서로 진행되며,  
  함수 호출 시마다 콜 스택(Call Stack)에 쌓였다가(pop/push) 사라진다.

---

## 호이스팅(Hoisting)

- JS는 코드 실행 전에 선언 단계와 초기화 단계를 먼저 수행한다.
- 이 때문에 변수 선언과 함수 선언이 마치 코드 상단으로 끌어올려지는 것처럼 동작한다.
- 다만 값 할당은 끌어올려지지 않기 때문에,  
  `var`는 초기 접근 시 `undefined`, `let`/`const`는 TDZ(Temporal Dead Zone)로 인해 `ReferenceError`가 발생한다.

![호이스팅 개념도](/assets/img/5.png)
![TDZ 개념도](/assets/img/6.png)

```tsx
console.log(myVar); // undefined
var myVar = 10;

console.log(myLet); // ReferenceError
let myLet = 10;

console.log(myFunction()); // 'Hello World'
function myFunction() {
  return 'Hello World';
}
```

> 각 변수별 정리
> - `let` : 선언 → 초기화 → 할당
> - `var` : 선언 + 초기화 → 할당
> - `const` : 선언 + 초기화 + 할당

---

## 클로저(Closure)

- 함수가 선언될 때의 스코프를 기억하여,  
  함수가 종료된 이후에도 그 스코프에 계속 접근할 수 있는 기능이다.
- 호이스팅된 함수/변수와 결합되어 상태 유지, 프라이빗 변수 관리 등에 활용할 수 있다.

```tsx
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

> 1. `const fn = outer()`가 실행될 때,  
>    전역 렉시컬 환경 위에 `outer`의 렉시컬 환경이 생성되고,  
>    그 안에 `a`와 `inner`가 저장된다.  
>    `outer`는 종료되지만, 반환된 `inner`(= `fn`)이 `a`에 대한 참조를 계속 들고 있다.
>
> ![outer 렉시컬 환경](/assets/img/7.png)
>
> 2. 이후 `fn()`을 호출하면 `inner`의 렉시컬 환경이 새로 만들어지고,  
>    스코프 체인을 통해 `outer`의 `a`에 접근해 값을 변경한다.
>
> ![inner 렉시컬 환경](/assets/img/8.png)

---

## 한 줄 정리

- 호이스팅: 실행 컨텍스트 생성 시, 렉시컬 스코프 내의 선언이 먼저 처리되어 끌어올려진 것처럼 보이는 현상  
- 클로저: 함수가 선언된 시점의 스코프를 기억해, 이후에도 그 스코프에 계속 접근할 수 있게 해주는 기능

---

## 결과

- 호이스팅을 통해 변수와 함수의 선언/초기화/할당 순서를 명확히 이해하게 되었다.
- 클로저를 통해 함수 내부에서 외부 스코프를 안전하게 참조하면서 상태를 유지할 수 있게 되었다.
- 두 개념을 함께 이해하니, JS의 실행 컨텍스트, 스코프 체인, 상태 관리를 훨씬 쉽게 바라볼 수 있게 되었다.

