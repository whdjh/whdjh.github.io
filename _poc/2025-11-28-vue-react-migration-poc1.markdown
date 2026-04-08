---
layout: post
title: "프레임워크 전환 지옥에서 살아남기: Vue→React 점진적 마이그레이션 삽질기 (PoC 1편)"
date: 2025-11-28 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/%ED%94%84%EB%A0%88%EC%9E%84%EC%9B%8C%ED%81%AC-%EC%A0%84%ED%99%98-%EC%A7%80%EC%98%A5%EC%97%90%EC%84%9C-%EC%82%B4%EC%95%84%EB%82%A8%EA%B8%B0-VueReact-%EC%A0%90%EC%A7%84%EC%A0%81-%EB%A7%88%EC%9D%B4%EA%B7%B8%EB%A0%88%EC%9D%B4%EC%85%98-%EC%82%BD%EC%A7%88%EA%B8%B0-PoC-1%ED%8E%B8

---

## 들어가며: 처음 해보는 PoC

레거시 Vue 앱을 React로 전환해야 하는 프로젝트를 맡았다. 가장 큰 제약은 서비스를 중단할 수 없다는 것. Big Bang 방식으로 한 번에 바꾸기엔 리스크가 너무 컸다.

이번이 처음으로 제대로 된 PoC(Proof of Concept)를 해본 경험이었다.

PoC의 목적

- 기술적 실현 가능성 검증
- 예상되는 문제점 사전 파악
- 팀에 명확한 선택 근거 제시

감수할 수 있는 것

- 기존 화면과 새 화면의 UI 차이
- 페이지 간 풀 리로드

감수할 수 없는 것

- 성능 저하
- 새 창으로 열리는 방식

---

## 검토한 방법들

### 1. Iframe

```
┌─────────────────┐
│   Vue 앱        │
│  ┌───────────┐  │
│  │  Iframe   │  │ ← React 앱
│  │ (React)   │  │
│  └───────────┘  │
└─────────────────┘
```

탈락. 너무 올드하고 성능·운영 측면에서 부담이 크다.

---

### 2. Module Federation

```
┌─────────────────────────┐
│   Host 앱               │
│  ┌──────┐  ┌──────┐    │
│  │ Vue  │  │React │    │
│  │모듈  │  │모듈  │    │
│  └──────┘  └──────┘    │
└─────────────────────────┘
런타임에 Vue + React 동시 로드
```

- 개념: 컴파일 시점에 서로 다른 프레임워크의 모듈을 연결
- 매력적인 점: 마이크로 프론트엔드의 정석, 일부만 교체 가능
- 탈락 이유: Vue + React 동시 로드 → 번들 증가, 런타임 성능 저하

성능 저하는 감수할 수 없다고 했으므로 탈락.

---

### 3. Nginx 리버스 프록시

핵심 아이디어

```
http://localhost (단일 도메인)
├── /        → Legacy 앱 (Vue, :3001)
└── /new/*   → New 앱 (React, :3000)

클라이언트 → Nginx → URL 패턴 확인 → 적절한 포트로 프록시
```

왜 이게 좋은가

1. 단일 도메인 유지 → Origin 통일 → 쿠키/localStorage 자동 공유, 별도 데이터 공유 처리 불필요
2. 성능 부담 없음 → 각 앱이 독립 실행, Vue와 React가 동시에 로드되지 않음. `/new` 방문 시에만 React 로드
3. 점진적 마이그레이션 → 페이지 단위로 이동, 문제 시 해당 경로만 롤백, 카나리 배포 가능
4. 독립적인 개발/배포 → 파이프라인 분리, 기술 스택 유지 가능

---

## 실제 구현

### Nginx 설정

```nginx
server {
    listen 80;
    server_name localhost;

    location /new/_next/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /new {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Next.js 설정

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  basePath: "/new",
};
```

### 실행

```bash
sudo nginx -t
brew services restart nginx

cd legacy-app && pnpm run dev   # :3001
cd new-app && pnpm run dev      # :3000
```

---

## 처음 PoC를 하며 깨달은 것

### 주저리 주저리 말하지 말기

- 나쁜 답변: "이런 방식들이 있었고~ 그래서 라우팅 이슈가 있었는데 어떻게 할지 모르겠다~" (변명에 가까움)
- 좋은 답변: "결론은 Nginx 방식이 가장 좋습니다. 단일 도메인으로 데이터 공유가 자동 해결되고, 성능 부담도 없습니다. 라우팅은 `window.location.href`로 해결 가능해 특별한 이슈는 없었습니다."
- 핵심: 결론부터 말하기, 주인의식을 가지고 판단하기, 이슈인지 아닌지 명확히 구분하기

### 이슈와 제약의 차이

이슈가 아닌 것

- 앱 간 이동 시 풀 리로드 → 다른 앱이니 당연함
- `router.push` 대신 `window.location.href` 사용 → 간단한 해결책 존재

실제 제약

- 개발 환경에서 HMR 불안정 → 워크플로우로 해결
- Nginx 설정 관리 필요 → 초기 설정 후 거의 변경 없음

---

## PoC의 목적

기술 검증이 아니라 의사결정을 위한 근거 마련이다.

- "이 기술을 쓸 수 있나요?" (X)
- "이 기술이 우리 상황에 가장 적합한가요?" (O)

---

## PoC 결과 요약

선택한 방식: Nginx 리버스 프록시

이유

- 단일 도메인으로 데이터 공유 자동 해결
- 독립 실행으로 성능 부담 없음
- 점진적 마이그레이션 가능
- 예상된 "이슈"는 모두 해결 가능한 제약

특별한 이슈는 없었다.

---

## 하지만…

PoC를 진행하며 Nginx 방식의 한계도 보였다.

우려사항

- 인프라/DevOps 의존성 증가
- Nginx 설정 변경 시마다 인프라팀 요청 필요
- 프론트엔드가 라우팅 제어권을 잃음

질문: 라우팅 제어를 프론트엔드에서 할 수는 없을까?
