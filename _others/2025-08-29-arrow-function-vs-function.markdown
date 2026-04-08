---
layout: post
title: "Arrow function != function"
date: 2025-08-29 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/Arrow-function-function

---

## 왜 공부하게 되었나?

화살표 함수와 일반 함수의 차이, 특히 this 바인딩이 자주 헷갈렸다.  
"콜백 안에서 this가 왜 global을 가리키지?" 같은 문제를 겪으면서, 화살표 함수와 this를 제대로 정리할 필요가 있어서 공부하게 됐다.

---

## 문제 상황

- setInterval, setTimeout 같은 비동기 콜백 안에서 this가 의도한 객체를 가리키지 않는 문제
- 객체 메서드를 화살표 함수로 쓰면, this가 객체가 아니라 전역을 가리키는 문제
- 함수 선언 방식에 따라 this가 달라진다는 걸 명확히 모르다 보니 버그가 발생함

---

## 공부 내용

### 화살표 함수

#### 문법

```tsx
// 함수 선언식
function add(a, b) {
  return a + b;
}

// 함수 표현식
const add = function (a, b) {
  return a + b;
};

// 화살표 함수
const add = (a, b) => {
  return a + b;
};
```

#### 장점

1. 입출력이 한눈에 들어오는 짧은 표현이 가능하다.
2. 파라미터가 하나면 소괄호를 생략할 수 있다.
3. 본문이 한 줄이면 중괄호와 `return`을 생략할 수 있다.

---

### Arrow Function과 this

#### 일반 함수의 this

```tsx
function Person() {
  this.age = 0;

  setInterval(function () {
    this.age++;
    console.log(this.age);
  }, 1000);
}

new Person(); // NaN (this가 global 객체)
```

- new Person() 호출 → 새 객체가 생성되고, Person 안의 this는 그 객체를 가리켜 this.age = 0은 정상 동작한다.
- setInterval에 넘긴 콜백은 일반 함수라서, 실행될 때 호출되는 컨텍스트(전역)에 따라 this가 window(브라우저) 또는 global(Node.js)이 된다.
- 그래서 this.age++는 global.age를 건드리게 되고, `undefined + 1` → NaN이 된다.
- 즉, 일반 함수는 호출될 때마다 this가 다시 바인딩된다.

#### 화살표 함수의 this

```tsx
function Person() {
  this.age = 0;

  setInterval(() => {
    this.age++;
    console.log(this.age);
  }, 1000);
}

new Person(); // 1, 2, 3...
```

- new Person() 호출 → 새 객체가 생성되고, Person 안의 this는 그 객체를 가리켜 this.age = 0은 정상 동작한다.
- setInterval에 넘긴 콜백은 화살표 함수라서, 자신만의 this를 만들지 않고 선언된 위치(Person 함수)의 this를 그대로 쓴다.
- 그래서 this.age++는 Person 인스턴스를 가리켜 1초마다 값이 1, 2, 3…으로 증가한다.
- 즉, 화살표 함수는 상위 스코프의 this를 그대로 물려받는다.

---

## 결과

- 화살표 함수는 문법이 짧을 뿐 아니라, this를 새로 바인딩하지 않고 상위 스코프의 this를 유지하기 때문에 비동기 콜백에 잘 맞다.
- 반대로 객체 메서드나 DOM 이벤트 핸들러처럼 실행 컨텍스트에 맞게 this가 바뀌어야 하는 경우에는 일반 함수가 적합하다.
- 화살표 함수와 일반 함수는 문법만 다른 게 아니라 this 동작이 근본적으로 다르다는 점을 정리하게 됐다.
