---
layout: post
title: "프론트엔드에서 라우팅 제어하기: Facade 패턴으로 Nginx 의존성 벗어나기 (PoC 2편)"
date: 2025-12-01 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/%ED%94%84%EB%A1%A0%ED%8A%B8%EC%97%94%EB%93%9C%EC%97%90%EC%84%9C-%EB%9D%BC%EC%9A%B0%ED%8C%85-%EC%A0%9C%EC%96%B4%ED%95%98%EA%B8%B0-Facade-%ED%8C%A8%ED%84%B4%EC%9C%BC%EB%A1%9C-Nginx-%EC%9D%98%EC%A1%B4%EC%84%B1-%EB%B2%97%EC%96%B4%EB%82%98%EA%B8%B0-PoC-2%ED%8E%B8

---

## Facade 패턴이란?

**복잡한 서브시스템들을 단순한 인터페이스 뒤에 숨기는** 디자인 패턴이다.

```
클라이언트 → [Facade] → 서브시스템 A
                    → 서브시스템 B
                    → 서브시스템 C
```

우리 상황에 적용하면:

```
클라이언트 → [Next.js] → Vue 앱
                    → React 앱
```

**Next.js가 Facade 역할**을 해서, 클라이언트에게 **단일 진입점**을 제공한다.

---

## 새로운 아키텍처: FrontDoor

**Nginx 방식**

```
클라이언트 → Nginx(:80) → Vue(:3001) 또는 React(:3000)
```

**Facade 방식**

```
클라이언트 → Next.js(:3000) → Vue(:3001) 또는 자체 처리
```

**핵심 변화**

- 진입점이 **Nginx**에서 **Next.js**로 변경
- 라우팅 로직이 **nginx.conf**에서 **middleware.ts**로 이동
- **프론트엔드가 제어권** 회복

**FrontDoor**: 인프라 용어로, 클라이언트 요청이 가장 먼저 도달하는 진입점. Next.js가 이 역할을 한다.

---

## 구현: Next.js Middleware

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const LEGACY_APP_URL = 'http://localhost:3001';

const NEW_APP_ROUTES = [
  '/',
  '/new',
  '/test',
  '/test-error',
  '/test-error/csr-throw-no-boundary',
  '/test-error/ssr-fetch',
  '/test-error/ssr-throw',
];

function isNewAppRoute(pathname: string): boolean {
  return NEW_APP_ROUTES.includes(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isNewAppRoute(pathname)) {
    return NextResponse.next();
  }

  const legacyUrl = new URL(pathname, LEGACY_APP_URL);
  legacyUrl.search = request.nextUrl.search;
  return NextResponse.rewrite(legacyUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 동작 방식

1. 클라이언트 요청: `http://localhost:3000/products`
2. Middleware: `/products`가 NEW_APP_ROUTES에 있나?
3-A. 있으면: `NextResponse.next()` → Next.js가 처리  
3-B. 없으면: `NextResponse.rewrite()` → Legacy 앱(3001)으로 프록시

**핵심은 `rewrite`**

- 클라이언트는 URL 변경을 인식하지 못함
- 내부적으로만 Legacy 앱으로 요청 전달
- **단일 도메인 유지**

### 경로 추가

```typescript
const NEW_APP_ROUTES = [
  '/',
  '/new',
  '/products',  // 추가!
];
```

- 코드 수정만으로 라우팅 변경
- 인프라팀 요청 불필요
- 코드 리뷰·Git 버전 관리 가능

---

## Nginx 방식과의 차이점

### 해결된 문제

1. **인프라 의존성 제거** — `middleware.ts` 수정만으로 라우팅 변경, 배포는 프론트엔드 배포와 동일
2. **설정 관리** — 프론트엔드 레포에서 관리, 코드 리뷰·버전 관리 가능
3. **제어권 회복** — 프론트엔드가 라우팅 로직 소유, 긴급 대응 용이

### 새로운 Trade-off: 장애 격리

**Nginx 방식**

- 3000(New) 죽음 → /new만 장애
- 3001(Legacy) 죽음 → / 만 장애  
→ 경로별로 장애 격리

**Facade 방식**

- 3000(New) 죽음 → **전체 장애**
- 3001(Legacy) 죽음 → /new는 정상, 나머지 장애  
→ New 앱이 **단일 장애점**

**판단:** 점진적 전환 단계에서는 이 리스크를 **감수**한다. 라우팅 제어권이 더 중요하고, 전환 완료 후에는 New 앱만 남으므로 해소된다.

---

## Nginx vs Facade 최종 비교

| | Nginx | Facade (Middleware) |
|---|--------|----------------------|
| 단일 도메인 | O | O |
| 성능 부담 | 없음 | 없음 (rewrite) |
| 점진적 전환 | 가능 | 가능 |
| 인프라 의존성 | 높음 | 없음 |
| 설정 관리 | nginx.conf (인프라) | middleware.ts (FE) |
| 코드 리뷰 | 어려움 | 가능 |
| 장애 격리 | 경로별 격리 | New 앱이 단일 장애점 |
| 제어권 | 인프라 | 프론트엔드 |

**선택 기준**

- **Nginx**: 안정성·장애 격리 최우선, 인프라팀과 협업이 원활할 때
- **Facade**: 프론트엔드 자율성·빠른 반복이 중요할 때

우리 팀은 **Facade 방식**을 선택했다. 점진적 전환 단계에서는 속도와 유연성이 더 중요했기 때문이다.

[PoC 1편: Nginx 리버스 프록시](/others/2025-11-28-vue-react-migration-poc1/) ← 이전 | [PoC 3편: 라우팅·데이터 공유·Input/Scroll 검증](/others/2025-12-03-vue-react-migration-poc3/) | [PoC 4편: Legacy 에러 New에서 처리](/others/2025-12-04-vue-react-migration-poc4/) → 다음
