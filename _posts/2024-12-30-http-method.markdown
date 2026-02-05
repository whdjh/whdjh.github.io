---
layout: post
title: "HTTP Method"
date: 2024-12-30 00:00:00 +0900
categories: dev
---

2024년 12월 30일, 프로젝트를 진행하면서 서버와 통신할 일이 많아졌다.

> **GET이면 조회, POST면 등록?**  
> **POST와 PUT은 뭐가 다르고, 멱등성이 뭐지?**

API 요청을 보내고 응답을 받아 데이터를 화면에 보여주거나 수정/삭제하는 과정에서 자연스럽게 HTTP METHOD와 axios를 접하게 되었다.
처음에는 단순히 "GET이면 조회, POST면 등록" 정도로만 생각했지만, 정확한 의미와 차이를 알아두는 게 좋겠다고 느꼈다.

그래서 이참에 한 번 정리해 보기로 했다.

---

## 왜 공부하게 되었나?

프로젝트를 진행하면서 서버와 통신할 일이 많아졌다.
API 요청을 보내고 응답을 받아 데이터를 화면에 보여주거나 수정/삭제하는 과정에서 자연스럽게 HTTP METHOD 와 axios를 접하게 되었다.
처음에는 단순히 "GET이면 조회, POST면 등록" 정도로만 생각했지만, 정확한 의미와 차이를 알아두는 게 좋겠다고 느꼈다.

---

## 문제 상황

axios로 API를 호출하면서 GET/POST/PUT/DELETE를 어떻게 구분해야 하는지 헷갈렸다.
특히 POST와 PUT의 차이, 그리고 "멱등성" 같은 개념이 낯설었다.
단순히 호출이 되는 것에 만족하다 보니, 왜 에러가 400/404로 오는지 명확하게 설명할 수 없었다.

---

## 공부 내용

### HTTP란?

웹에서 클라이언트와 서버가 데이터를 주고받기 위한 통신 규약(Protocol) 이다.

### HTTP METHOD 정리

- HTTP Method는 서버에 요청하는 목적을 명확하게 전달하기 위한 방식이다.
1. GET → 데이터 조회
2. POST → 데이터 생성
3. PUT → 데이터 수정(덮어쓰기)
4. DELETE → 데이터 삭제

### axios 설정하기

```tsx
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export const instance = axios.create({
  baseURL: BASE_URL,
});

instance.interceptors.request.use((config) => {
  const localStorageToken = localStorage.getItem('accessToken');
  const sessionStorageToken = sessionStorage.getItem('accessToken');

  if (localStorageToken) {
    config.headers.Authorization = `Bearer ${localStorageToken}`;
  } else if (sessionStorageToken) {
    config.headers.Authorization = `Bearer ${sessionStorageToken}`;
  }
  return config;
});
```

- 매번 요청마다 인증 토큰을 직접 추가하지 않아도 자동으로 헤더에 붙게 된다.

### GET (조회하기)

```tsx
export default async function getUtil({ params }) {
  try {
    const { data } = await instance.get(`url`, { params });
    return data;
  } catch (error) {
    throw new Error('조회 중 문제가 발생했습니다.');
  }
}
```

- 주로 데이터 읽기/검색용
- 성공 시 200 OK, 실패 시 400/404

### DELETE (삭제하기)

```tsx
export const deleteData = async (dataId) => {
  try {
    await instance.delete(`url/${dataId}`);
  } catch (error) {
    throw new Error('삭제 중 문제가 발생했습니다.');
  }
};
```

- 특정 리소스를 제거
- 성공 시 200 OK 또는 204 No Content

### POST (등록하기)

```tsx
export const postData = async ({ params }) => {
  try {
    const { data } = await instance.post(`url`, params);
    return data;
  } catch (error) {
    throw new Error('등록 중 문제가 발생했습니다.');
  }
};
```

- 새로운 리소스를 생성
- 성공 시 201 Created

### PUT (수정하기)

```tsx
export const putData = async ({ title, color, dataId }) => {
  try {
    const { data } = await instance.put(`url/${dataId}`, { title, color });
    return data;
  } catch (error) {
    throw new Error('수정 중 문제가 발생했습니다.');
  }
};
```

- 특정 리소스를 수정하거나 덮어쓰기
- 성공 시 200 OK 또는 204 No Content

### 멱등성(Idempotency)

- 여러 번 요청해도 결과가 같은 성질
- GET / PUT / DELETE → 멱등성 O
- POST → 멱등성 X (매번 새로운 데이터 생성)

---

## 결과: 이제는 이렇게 정리할 수 있다

이제 HTTP METHOD를 단순히 "조회/등록/수정/삭제" 정도로만 아는 게 아니라, 정확한 의미와 차이를 설명할 수 있게 되었다.
axios 인터셉터를 통해 토큰 처리도 자동화하면서 코드가 훨씬 간결해졌다.
특히 POST vs PUT과 멱등성 개념을 이해하게 되어 API 통신 시 불필요한 혼동을 줄일 수 있었다.
앞으로 API 요청을 작성할 때 단순히 "돌아간다" 수준이 아니라, 왜 이 메소드를 써야 하는지를 기준 삼아 선택할 수 있게 되었다.

---

## 마치며

HTTP Method를 쓰는 이유는 **서버에 요청의 목적을 명확히 전달하기 위해서**다.

- 조회는 GET, 생성은 POST, 수정은 PUT, 삭제는 DELETE → 의미에 맞게 쓰면 API가 읽기 쉬워진다.
- 멱등성을 생각하면 → 같은 요청을 여러 번 보냈을 때의 동작을 예측할 수 있다.

이 기준을 알고 나니, 에러 코드가 왜 400/404로 오는지도 설명할 수 있게 되었다.
