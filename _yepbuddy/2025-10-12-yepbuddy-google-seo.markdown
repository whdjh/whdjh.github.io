---
layout: post
title: "YepBuddy - (7) 구글에 안 뜬다고? 그냥 못한 것뿐이다"
date: 2025-10-12 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/YepBuddy-7-%EA%B5%AC%EA%B8%80%EC%97%90-%EC%95%88-%EB%9C%AC%EB%8B%A4%EA%B3%A0-%EA%B7%B8%EB%83%A5-%EB%AA%BB%ED%95%9C-%EA%B2%83%EB%BF%90%EC%9D%B4%EB%8B%A4

---

## 구글에 안 뜰 때 가장 많이 하는 실수 — 한 줄 요약

도메인 붙이고 배포까지 끝냈는데 "구글에 노출이 안 된다"고 호소하는 사람을 자주 본다. 사실 원인은 하나다: **검색엔진에 ‘알려주지 않아서’**다.

도메인 연결은 배포의 끝이 아니라 **시작**이다. 검색엔진에 신호를 보내고, 색인되도록 검증하고, 메타·사이트맵·로봇 규칙을 맞춰 줘야 검색 결과에 뜬다.

---

## 과정

### 1. 메타데이터 업데이트

Next.js `metadata`로 title, description, Open Graph, Twitter, robots, canonical을 설정한다.

```ts
export const metadata: Metadata = {
  title: "...",
  description: "...",
  icons: {
    icon: "...",
  },
  openGraph: {
    title: "...",
    description: "...",
    url: "...",
    siteName: "...",
    images: [
      {
        url: "...",
        width: 1200,
        height: 630,
        alt: "...",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "...",
    description: "...",
    images: ["..."],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://yepbuddy.co.kr",
  },
};
```

### 2. next-sitemap으로 sitemap.xml 자동 생성

#### 설치

```bash
npm i -D next-sitemap
```

#### next-sitemap.config.js

```js
module.exports = {
  siteUrl: "https://yepbuddy.co.kr",
  generateRobotsTxt: true,
  changefreq: "daily",
  priority: 0.7,
  sitemapSize: 7000,
  exclude: ["/admin/**", "/draft/**"],
};
```

#### package.json에 postbuild 스크립트 추가

```json
"scripts": {
  "postbuild": "next-sitemap"
}
```

빌드 후 자동으로 `sitemap.xml`과 `robots.txt`가 생성된다.

### 3. Google Search Console 접속 후 도메인 입력

![Search Console 도메인 입력](/assets/img/105.png)

### 4. 복사 버튼으로 TXT 레코드 값 복사

![TXT 레코드 복사](/assets/img/106.png)

### 5. 가비아 DNS에 TXT 레코드 추가

(TXT 추가 방법은 이전 시리즈 YepBuddy (6) 도메인 적용 참고)

![가비아 TXT 레코드 추가](/assets/img/107.png)

### 6. 소유권 검증 성공

![검증 성공](/assets/img/108.png)

---

이렇게 메타·사이트맵·robots를 맞추고 Search Console에서 도메인을 검증하면, 구글이 사이트를 수집·색인할 수 있고 검색 결과에 노출되기 시작한다.
