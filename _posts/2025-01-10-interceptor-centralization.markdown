---
layout: post
title: "Intercepter 중앙화 도입기"
date: 2025-01-10 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/Intercepter-%EC%A4%91%EC%95%99%ED%99%94-%EB%8F%84%EC%9E%85%EA%B8%B0

# 문제상황

- 이번에 팀 프로젝트를 진행하면서, API Call 함수가 어려개가 만들어졌다. 그림은 일부를 보여준 것인데, 각 폴더마다 대략 10개의 API Call 함수가 있다고 보면된다.

- 다음과 같은 문제가 발생했다.
  - 첫번째로 중복 코드 문제로, 여러개의 API 호출 함수마다 오류 처리와 로깅 코드를 포함해야 하므로 코드가 중복되어 유지보수가 어려워짐
  - 두번째로 불일치한 로깅으로, API 함수 중 하나에서 로깅을 잊어버리거나 로깅 형식이 표준화되지 않으면, 로깅이 일관되지 않을 수 있다는 문제점
  - 마지막으로 렌더링 속도 측면 UX에 대한 불편함을 줄 수 있다고 한다.
- 그래서 프로젝트 회고를 진행하면서 instance에서 intercepter에서 처리하면 좋을 것 같다는 생각이 들었다
- 이것을 찾아보니 axios intercepter 중앙화라고 한다.

# 과정

- instance.ts

```ts
import axios from 'axios';

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
```

- API Call 함수

```ts
import instance from '../instance';

export default async function getStatus(): Promise<GetStatus> {
  const { data } = await instance.get('url');
  return data.result;
}
```

- 이렇게 되면 단점들을 어느정도 상쇄할 수 있다고 한다..

## 하지만 이게 끝일까?

- 좀더 구글링을 해보니 나와 같은 고민을 하신 분들이 많다는 것을 알았다.
- 그 중 나는 지금 React-Query에 대해 강의를 수강중에 있는데, React-Query 중앙화라는 것을 알아냈다...! -> 모든 프로젝트가 React라면 고려할만 하다고 한다.

```ts
// use cases
useQuery(['querykey'], fetchFunction, {
  context: { componentName: 'Custom Component' }
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

- 이렇게 한다면, 전역에러에 대한 로그를 처리하는 것이 더 많은 metadata를 얻을 수 있다고한다.

# 결과

- 코드 중복 감소: 각 API 호출 함수마다 오류 처리/로깅을 따로 작성하지 않아도 되어, 코드의 양과 유지보수 비용이 줄어들었다.
- 일관된 로깅 확보: 인터셉터(또는 React-Query 중앙화)를 통해, 모든 API 에러 로그가 같은 형식으로 기록되어 디버깅이 쉬워졌다.

# 깨달은점

- Error 로깅 처리는 이 두 가지중 무엇이 좋다!!라는 것이 아니라 어디에서 중앙화를 해야한다!!라는 마음이 중요하다라고 생각한다.
