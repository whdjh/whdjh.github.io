---
layout: post
title: "Intercepter 중앙화 도입기"
date: 2025-01-10 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/Intercepter-%EC%A4%91%EC%95%99%ED%99%94-%EB%8F%84%EC%9E%85%EA%B8%B0

---

## 문제 상황

- 팀 프로젝트를 진행하면서 API Call 함수가 여러 개 만들어졌다.  
  아래 그림은 일부만 보여준 것이고, 각 폴더마다 대략 10개의 API Call 함수가 있다고 보면 된다.

![여러 API 호출 파일 구조](/assets/img/4.png)

- 이 구조에서 다음과 같은 문제가 발생했다.
  - 중복 코드 문제: 여러 API 호출 함수마다 오류 처리와 로깅 코드를 포함해야 해서, 코드가 중복되고 유지보수가 어려워짐
  - 불일치한 로깅: 어떤 API 함수에서는 로깅을 빼먹거나, 로깅 형식이 제각각이라 로그를 믿기 어려움
  - UX 저하 가능성: 렌더링 속도나 사용자 경험 측면에서, 일관되지 않은 에러 처리로 불편함을 줄 수 있음

- 그래서 프로젝트 회고를 진행하면서, `instance`의 interceptor에서 공통 처리를 하면 좋겠다는 생각이 들었고,  
  찾아보니 이를 axios interceptor 중앙화라고 부른다는 것을 알게 되었다.

---

## 과정

### 1) `instance.ts`에서 응답 인터셉터 설정

```ts
import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://example.com/api',
});

instance.interceptors.response.use(
  (res) => {
    const { code } = res.data;
    if (code !== 0) {
      console.error(JSON.stringify(res.data));
      throw new Error(res.data.msg);
    }
    return res;
  },
  (error) => {
    console.error(error);
    throw error;
  },
);

export default instance;
```

### 2) API Call 함수에서 중복 제거

```ts
import instance from '../instance';

export default async function getStatus(): Promise<GetStatus> {
  const { data } = await instance.get('url');
  return data.result;
}
```

- 각 API 함수에서는 요청과 응답 데이터 처리에만 집중하고,  
  공통 에러 처리/로깅은 모두 인터셉터에서 맡도록 했다.
- 이렇게 하면 앞서 언급한 단점들을 어느 정도 상쇄할 수 있다.

---

## 하지만 이게 끝일까?

- 더 찾아보니 나와 비슷한 고민을 한 사람들이 많았고,  
  단순 axios 인터셉터보다 한 단계 더 나아간 패턴도 존재했다.
- 특히 지금 React Query 강의를 수강 중인데, 여기서 React Query 레벨에서 중앙화하는 방법을 알게 되었다.  
  모든 프로젝트가 React라면 한 번쯤 고려해볼 만한 방식이다.

```ts
// use cases
useQuery(['querykey'], fetchFunction, {
  context: { componentName: 'Custom Component' },
});

// default client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error, _variables, context, queryInstance) => {
        const { componentName, failureCount } = context;
        if (failureCount === 0) {
          return;
        }
        sendLogError({
          message: '에러(종류)',
          endpoint: _variables[0],
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
          componentName,
        });
      },
    },
  },
});
```

- 이렇게 하면 전역 에러에 대한 로그를 더 풍부한 메타데이터와 함께 남길 수 있다.
  - 어떤 컴포넌트에서 발생한 에러인지
  - 몇 번째 실패인지
  - 어떤 endpoint를 호출했는지 등

---

## 결과

- 코드 중복 감소: 각 API 호출 함수마다 오류 처리/로깅을 따로 작성하지 않아도 되어, 코드 양과 유지보수 비용이 줄었다.
- 일관된 로깅 확보: 인터셉터(또는 React Query 중앙화)를 통해, 모든 API 에러 로그가 같은 형식으로 기록되어 디버깅이 쉬워졌다.

---

## 깨달은 점

- 에러 로깅 처리는 어느 도구가 더 좋다/나쁘다의 문제가 아니라,  
  “어디에서 중앙화할 것인가?”를 먼저 고민하는 게 더 중요하다고 느꼈다.
- 상황에 따라
  - axios 인터셉터에서 중앙화할 수도 있고,
  - React Query나 다른 상태관리 레이어에서 중앙화할 수도 있다.  
  중요한 것은 팀이 합의한 한 곳에서 일관되게 처리하는 것이다.
