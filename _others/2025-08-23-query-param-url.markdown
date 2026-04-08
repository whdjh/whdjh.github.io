---
layout: post
title: "쿼리 파라미터 기반 URL 도입기"
date: 2025-08-23 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/%EC%BF%BC%EB%A6%AC-%ED%8C%8C%EB%9D%BC%EB%AF%B8%ED%84%B0-%EA%B8%B0%EB%B0%98-URL-%EB%8F%84%EC%9E%85%EA%B8%B0

---

## 문제 상황

마이페이지 탭 상태를 Zustand로만 관리하고 있었다.  
그러다 보니 페이지 새로고침 시 상태가 초기화되고, 뒤로가기/앞으로가기가 제대로 동작하지 않는 UX 문제가 생겼다.

---

## 과정

### 고려한 기술

| 방식 | 장점 | 단점 |
|------|------|------|
| 클라이언트 상태 기반 (Zustand 등) | 구현이 단순함 | URL에 상태가 안 반영되어 새로고침 시 초기화, 히스토리 이동 불가 |
| 라우트 기반 (/tab1, /tab2) | 구조가 명확함 | 탭 전환마다 URL이 바뀌어 UX가 불안정하고, SEO에 부담이 될 수 있음 |
| 쿼리 파라미터 기반 (?tab=...) | URL 공유·새로고침 복원·히스토리 반영 가능, 기존 구조와 충돌 적음 | — |

→ 쿼리 파라미터 기반으로 탭 상태를 URL에 반영하기로 했다.

### 쿼리 파라미터 기반 구현

```tsx
const router = useRouter();
const searchParams = useSearchParams();

// 현재 쿼리 파라미터 값
const currentTab = searchParams.get(key) as T;
const isValid = currentTab && validTabs.includes(currentTab);

// 유효하면 사용, 아니면 기본값
const activeTab = isValid ? currentTab : defaultValue;

// 탭 변경 시
const setTab = (tab: T) => {
  const params = new URLSearchParams(searchParams);
  params.set(key, tab);
  router.push(`?${params.toString()}`);
};

return { activeTab, setTab };
```

- searchParams.get(key): 현재 URL의 쿼리 파라미터에서 탭 값을 읽는다.
- validTabs.includes(currentTab): 허용된 탭 값인지 검사해, 잘못된 값이면 기본 탭을 쓴다.
- URLSearchParams로 기존 쿼리를 유지한 채 해당 키만 바꾸고, router.push로 URL을 갱신해 브라우저 히스토리에 스택으로 쌓이게 한다.

---

## 결과

- 새로고침해도 탭 상태가 URL에서 복원된다.
- 뒤로가기/앞으로가기 시 해당 탭으로 이동한다.
- URL 공유 시 같은 탭 상태로 열 수 있어 UX가 안정적으로 개선됐다.
