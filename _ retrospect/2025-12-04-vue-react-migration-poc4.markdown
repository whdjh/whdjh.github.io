---
layout: post
title: "Legacy 앱의 에러를 New 앱에서 처리할 수 있을까? (PoC 4편)"
date: 2025-12-04 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/Legacy-%EC%95%B1%EC%9D%98-%EC%97%90%EB%9F%AC%EB%A5%BC-New-%EC%95%B1%EC%97%90%EC%84%9C-%EC%B2%98%EB%A6%AC%ED%95%A0-%EC%88%98-%EC%9E%88%EC%9D%84%EA%B9%8C-PoC-4%ED%8E%B8

---

## 문제 상황

### 현재 구조

```
클라이언트 → Next.js(:3000) → Legacy 앱(:3001)
```

Legacy 앱에서 404나 500이 나면:

- Legacy 앱의 에러 페이지가 보임
- New 앱은 에러를 알 수 없음
- 두 앱의 에러 UI가 달라질 수 있음

### 이상적인 목표

```
Legacy 앱에서 에러 발생
→ New 앱의 Middleware에서 감지
→ New 앱의 error.tsx로 처리
→ 일관된 에러 UI 제공
```

---

## Next.js Error Boundary 기본 동작

### error.tsx는 SSR, CSR 모두 처리

```tsx
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>에러가 발생했습니다</h2>
      <p>{error.message}</p>
      <button onClick={reset}>다시 시도</button>
    </div>
  );
}
```

- SSR 에러: Next.js가 자동 감지 → `error.tsx` 렌더링  
- CSR 에러: Next.js가 자동 감지 → `error.tsx` 렌더링  

다만 Next.js 자체에서 던진 에러만 잡는다. Legacy 앱에서 나온 에러는 감지하지 못한다.

---

## 시도 1: 각 앱에서 독립적으로 처리

가장 단순한 방법

```
New 앱 에러 → New의 error.tsx
Legacy 앱 에러 → Legacy의 에러 페이지
```

- 장점: 구현 간단, 각 앱 독립, 추가 작업 없음  
- 단점: 에러 UI가 달라질 수 있고, 일관성이 없음  

---

## 시도 2: Middleware에서 응답 확인

아이디어

- Middleware에서 Legacy 앱 응답을 확인해 에러를 감지하고, New 앱의 에러 페이지로 리다이렉트해서 처리

### 에러 페이지 UI만 통일

에러 감지는 포기하고, 에러 페이지 UI만 맞추는 방법.

```
New 앱: error.tsx
Legacy 앱: error.html (같은 UI)
```

방법

1. New 앱의 에러 UI를 정적 HTML로 추출  
2. Legacy 앱에서 같은 HTML 사용  

---

## 검증 결과

### SSR, CSR 에러

SSR 에러

```tsx
// app/test-error/ssr-throw/page.tsx
export default function Page() {
  throw new Error('SSR 에러 테스트');
}
```

→ `error.tsx` 정상 렌더링

CSR 에러

```tsx
// app/test-error/csr-throw/page.tsx
'use client';

export default function Page() {
  throw new Error('CSR 에러 테스트');
}
```

→ `error.tsx` 정상 렌더링

### New에서 일괄 처리

(추가 검증·작성 예정)

---

## 추가 검증 필요 사항

위 방법들로는 Legacy 에러를 New에서 일괄 처리하기 어렵지만, 아래는 아직 확인이 필요하다.

### 1. rewrite 응답의 status 확인 가능 여부

시도해볼 방법

```typescript
export async function middleware(request: NextRequest) {
  const legacyUrl = new URL(pathname, LEGACY_APP_URL);
  const response = NextResponse.rewrite(legacyUrl);

  console.log(response.status);

  if (response.status >= 400) {
    return NextResponse.redirect(new URL('/error', request.url));
  }

  return response;
}
```

예상

- `NextResponse.rewrite()`는 즉시 응답 객체를 반환  
- 이 시점에는 아직 Legacy 앱에 요청이 가지 않았을 수 있음  
- `response.status`는 항상 200일 가능성  

확인이 필요한 이유

- Next.js가 내부적으로 먼저 요청을 보내고 응답을 기다릴 수도 있음  
- 문서에 없는 동작일 수 있음  

검증 방법

1. Legacy 앱에서 404를 반환하는 페이지 만들기  
2. Middleware에서 `response.status` 로깅  
3. 실제 status가 찍히는지 확인  

---

### 2. Middleware에서 rewrite 응답 가로채기

시도 1: HEAD로 먼저 확인

```typescript
const testResponse = await fetch(legacyUrl, { method: 'HEAD' });

if (!testResponse.ok) {
  return NextResponse.redirect(new URL('/error', request.url));
}

return NextResponse.rewrite(legacyUrl);
```

예상 문제: HEAD와 GET이 두 번 발생 → 성능 저하

시도 2: rewrite 후 응답 읽기

```typescript
const response = NextResponse.rewrite(legacyUrl);
const text = await response.text();

if (text.includes('404') || text.includes('error')) {
  return NextResponse.redirect(new URL('/error', request.url));
}

return new NextResponse(text);
```

예상

- `rewrite` 응답은 읽을 수 없을 가능성이 높음  
- 읽을 수 있다면 시도 2와 비슷한 메모리 이슈 가능  

검증

1. `response.text()` 호출 시 에러 여부  
2. 가능하다면 메모리 사용량 측정  

---

### 3. 네트워크 레벨에서 에러 감지

클라이언트 접근

```typescript
// 전역 에러 핸들러
window.addEventListener('error', (event) => { ... });

// fetch 래핑
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  if (!response.ok) {
    window.location.href = '/error';
  }
  return response;
};
```

예상

- `rewrite`로 프록시된 요청은 브라우저 입장에서는 200 OK  
- Legacy의 404/500은 HTML 본문으로만 전달  
- `window.addEventListener('error')`로는 감지 불가  

Service Worker

```typescript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).then(response => {
      if (!response.ok) {
        return Response.redirect('/error');
      }
      return response;
    })
  );
});
```

예상 문제

- Service Worker가 `rewrite`된 요청을 가로챌 수 있을지 불명확  
- Next.js 내부 동작과 충돌 가능  

검증

1. Chrome DevTools Network에서 실제 응답 status 확인  
2. Legacy 404 페이지의 status가 클라이언트에 어떻게 보이는지 확인  
3. Service Worker 등록 후 요청 가로채기 시도  

---

[PoC 1편: Nginx 리버스 프록시](/others/2025-11-28-vue-react-migration-poc1/) | [PoC 2편: Facade 패턴](/others/2025-12-01-vue-react-migration-poc2/) | [PoC 3편: 라우팅·데이터·Input 검증](/others/2025-12-03-vue-react-migration-poc3/) ← 이전
