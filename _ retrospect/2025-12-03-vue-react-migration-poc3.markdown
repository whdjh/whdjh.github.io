---
layout: post
title: "실제 검증: 라우팅 검증, 데이터 공유 그리고 Input/Scroll 동작 (PoC 3편)"
date: 2025-12-03 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/%EC%8B%A4%EC%A0%9C-%EA%B2%80%EC%A6%9D-%EB%9D%BC%EC%9A%B0%ED%8C%80-%EA%B2%80%EC%A6%9D-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EA%B3%B5%EC%9C%A0-%EA%B7%B8%EB%A6%AC%EA%B3%A0-InputScroll-%EB%8F%99%EC%9E%A5-PoC-3%ED%8E%B8

---

## 1. 라우팅 분기 검증

### 테스트 환경

```typescript
// middleware.ts
const NEW_APP_ROUTES = ['/', '/new', '/test'];
// /legacy 는 Legacy 앱(3001)으로 프록시
```

### 테스트 시나리오

- 시나리오 1: Legacy → New 이동  
- 시나리오 2: New → Legacy 이동  
- 시나리오 3: 같은 앱 내부 이동  

### 검증 결과

| 시나리오 | 예상 동작 | 실제 동작 | 결과 |
|----------|-----------|-----------|------|
| Legacy → New | 풀 리로드, New로 전환 | 정상 | O |
| New → Legacy | 풀 리로드, Legacy로 전환 | 정상 | O |
| New 내부 이동 | 클라이언트 라우팅 (리로드 없음) | 정상 | O |
| Legacy 내부 이동 | 클라이언트 라우팅 (리로드 없음) | 정상 | O |

핵심

- 앱 간 이동: `window.location.href` → 풀 리로드  
- 앱 내부 이동: `router.push` → 클라이언트 라우팅  
- URL은 그대로 두고 내부적으로만 프록시

---

## 2. 데이터 공유 검증

### 테스트 환경

- 클라이언트는 항상 `localhost:3000`으로만 접속 → Origin 통일 → localStorage, Cookie 자동 공유

### 검증 결과

| 테스트 | Legacy→New | New→Legacy | 페이지 전환 후 | 뒤로가기 후 | 새로고침 후 |
|--------|------------|------------|----------------|-------------|-------------|
| localStorage | O | O | O | O | O |
| Cookie | O | O | O | O | O |
| sessionStorage | O | O | O | O | O |

핵심: Origin이 `localhost:3000`으로 통일되어 별도 데이터 공유 처리 없이 브라우저가 자동 공유한다.

---

## 3. Input/Scroll 값 유지 검증

### Next.js App Router 기본 동작 (Facade 적용 전)

검증 결과

| | 비제어 input | 제어 input | scroll |
|---|--------------|------------|--------|
| window.location 이동 후 뒤로가기 | O | X | O |
| router.push 이동 후 뒤로가기 | X | X | O |
| 새로고침 | X | X | O |

이유

- 비제어 input (`defaultValue`): 브라우저 히스토리가 값을 복원. `router.push` 시에는 컴포넌트가 새로 마운트되어 초기화.
- 제어 input (`value` + state): 페이지 이동 시 상태 초기화. 유지하려면 별도 저장 필요.
- Scroll: 브라우저가 위치를 기억. `router.push` 시 Next.js가 최상단으로 이동하는 동작은 그대로.

### Facade 패턴 적용 후

| | 비제어 input | 제어 input | scroll |
|---|--------------|------------|--------|
| window.location 이동 후 뒤로가기 | O | X | O |
| router.push 이동 후 뒤로가기 | X | X | O |
| 새로고침 | X | X | O |

결과: Next.js 기본 동작과 동일. Facade가 기본 동작을 바꾸지 않는다.

---

## 다른 서비스들은 어떻게 하나?

| 서비스 | 값 저장 | 방식 |
|--------|---------|------|
| 구글/네이버/오늘의집/velog 검색 | O | 쿼리 파라미터 |
| GPT/Claude | O | 상태 또는 localStorage |
| 노션/지라/컨플루언스 | O | 타이핑마다 서버 동기화 |
| velog/티스토리/네이버 블로그 글쓰기 | X | — |

패턴

- 검색창: `router.push(\`/search?q=${query}\`)` — URL에 포함, 북마크·공유 가능  
- 로그인: 쿠키 또는 sessionStorage — 서버 검증 가능  
- 에디터(중요 문서): 타이핑마다 서버 동기화 — 데이터 손실 방지  
- 에디터(일반): localStorage — 간단하나 디바이스별로 다름  

---

## 결론

### SPA에서 Input 값이 초기화되는 건 정상이다

`router.push` 후 뒤로가기 시 input이 초기화되는 것은 React 컴포넌트가 새로 마운트되기 때문이다. 비정상이 아니라 정상 동작이고, 값을 유지하는 서비스는 별도 저장 로직을 둔 것이다.

### 필요 시 용도에 따라 선택

```typescript
// 검색창 → URL
router.push(`/search?q=${query}`);

// 로그인 → 쿠키
document.cookie = 'token=abc; path=/';

// 임시 저장 → localStorage
localStorage.setItem('draft', content);

// 중요 문서 → 서버
await api.save(content);
```

현재 동작을 유지해도 되고, 필요하면 용도에 맞는 방식을 선택해 적용하면 된다.

---

## 검증 결과 요약

| 항목 | 검증 결과 | 비고 |
|------|-----------|------|
| 라우팅 분기 | 통과 | 앱 간/앱 내부 이동 모두 정상 |
| 데이터 공유 | 통과 | Origin 통일로 자동 공유 |
| Input/Scroll | 통과 | Next.js 기본 동작과 동일 |

특별한 이슈는 없었다. Facade 패턴은 Next.js 기본 동작을 방해하지 않고, Middleware는 요청 라우팅만 담당한다.

---

## 회고: 기본 동작을 먼저 확인하라

처음엔 Input 값이 초기화되는 걸 보고 "Facade 패턴 때문인가?"라고 의심했다.  
별도 Next.js 프로젝트로 기본 동작을 먼저 확인한 뒤, Facade와 무관하다는 걸 확인했다.

교훈

1. 먼저 기본 동작을 확인한다.  
2. 패턴 적용 후 동작을 비교한다.  
3. 차이가 있을 때만 원인을 분석한다.

기본 동작도 모르고 패턴 탓을 하면 안 된다.

---

[PoC 1편: Nginx 리버스 프록시](/others/2025-11-28-vue-react-migration-poc1/) | [PoC 2편: Facade 패턴](/others/2025-12-01-vue-react-migration-poc2/) ← 이전 | [PoC 4편: Legacy 에러 New에서 처리](/others/2025-12-04-vue-react-migration-poc4/) → 다음
