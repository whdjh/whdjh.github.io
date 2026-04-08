---
layout: post
title: "배열/문자열 메서드 & Set/Map"
date: 2025-08-27 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/%EB%B0%B0%EC%97%B4%EB%AC%B8%EC%9E%90%EC%97%B4-%EB%A9%94%EC%84%9C%EB%93%9C-SetMap

---

## 왜 공부하게 되었는가?

코딩테스트를 JavaScript로 준비했다.  
문제를 풀다 보니 for, while만 쓰면 코드가 길어지고, 시간 복잡도 생각도 헷갈렸다.  
배열·문자열 메서드와 자주 쓰는 Set/Map을 집중적으로 정리하게 됐다.  
코테 풀이 중 this 바인딩 때문에 실수한 적이 있어서, 화살표 함수와 this 차이도 같이 공부했다.

---

## 문제 상황

- 배열 합계, 정렬, 중복 제거 같은 작업을 매번 for문으로 짜다 보니 코드가 길어짐
- 문자열 다루기(뒤집기, 분리, 치환)가 번거롭고 가독성이 떨어짐
- this가 상황에 따라 달라져서, 함수 안에서 의도와 다르게 동작하는 문제가 발생함

---

## 공부 내용

### 배열 관련

#### map — 원소 변환

```tsx
const arr = [1, 2, 3];

// 반복문
const tmp = [];
for (let i = 0; i < arr.length; i++) tmp.push(arr[i] * arr[i]);

// map 사용
const tmp = arr.map((x) => x * x);
```

#### filter — 조건에 맞는 값만 뽑기

```tsx
const arr = [1, 2, 3, 4, 5];

// 반복문
const tmp = [];
for (let i = 0; i < arr.length; i++) {
  if (arr[i] % 2 === 0) tmp.push(arr[i]);
}

// filter 사용
const tmp = arr.filter((x) => x % 2 === 0);
```

#### reduce — 합계

```tsx
const arr = [1, 2, 3, 4];

// 반복문
let sum = 0;
for (let i = 0; i < arr.length; i++) sum += arr[i];

// reduce 사용 — reduce(<콜백>, <초기값>)
const sum = arr.reduce((acc, cur) => acc + cur, 0);
```

---

### Set / Map

#### Set — 중복 제거

```tsx
const arr = [1, 2, 2, 3, 3, 4];

const unique = [...new Set(arr)];
```

#### Map — key-value 저장 (해시맵)

```tsx
const map = new Map();

map.set("apple", 3);
map.set("banana", 5);
```

---

## 결과

- 코딩테스트에서 반복문만 쓰면 코드가 길어지고 버그 가능성이 커진다.
- map, filter, reduce와 Set/Map을 쓰면 반복문을 한 줄 메서드로 줄일 수 있다.
- 문자열은 split, join, replace, slice 등으로 같은 맥락에서 처리할 수 있다.
