---
layout: post
title: "YepBuddy - (5) 매일 아침 8시, 나 대신 프로틴 가격을 긁어오는 봇을 만들었다"
date: 2025-10-04 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/YepBuddy-5-%EB%A7%A4%EC%9D%BC-%EC%95%84%EC%B9%A8-8%EC%8B%9C-%EB%82%98-%EB%8C%80%EC%8B%A0-%ED%94%84%EB%A1%9C%ED%8B%B4-%EA%B0%80%EA%B2%A9%EC%9D%84-%EA%B8%81%EC%96%B4%EC%98%A4%EB%8A%94-%EB%B4%87%EC%9D%84-%EB%A7%8C%EB%93%A4%EC%97%88%EB%8B%A4

---

## 시작은 단순했다

매달 프로틴을 살 때마다 느꼈다. "지금 이 가격, 비싼 건가?" 매번 세일 시기를 확인하고 노션에 기록하는 게 너무 귀찮았다.

그래서 결심했다. "차라리 봇을 만들어서, 나 대신 자동으로 가격을 가져오자."

이렇게 YepBuddy의 자동화 시스템, **'프로틴 가격 감시자'** 프로젝트가 시작됐다.

---

## 과정

### 프로젝트 초기 설정

독립적인 크롤러 프로젝트를 구성했다.

```
protein-price-tracker/
├── crawlMyproteinPrice.js
├── package.json
├── .env              ← (Supabase 키 저장)
└── .github/workflows/
    └── myprotein_crawler.yml
```

### package.json 설정

크롤러 실행 환경과 의존성만 최소로 넣었다.

```json
{
  "name": "protein-price-tracker",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@supabase/supabase-js": "^2.74.0",
    "dotenv": "^17.2.3",
    "puppeteer": "^24.23.0",
    "puppeteer-extra": "^3.3.6",
    "puppeteer-extra-plugin-stealth": "^2.11.2"
  }
}
```

- **puppeteer-extra + StealthPlugin**: 봇 감지 시스템을 피하기 위한 스텔스 브라우저 세팅

### Supabase 서비스 키를 .env에

#### 1. Supabase 프로젝트 대시보드에서 project 뒤의 값을 `SUPABASE_URL`로 저장

![Supabase URL](/assets/img/93.png)

#### 2. 사이드바에서 **Project Settings** 탭 클릭

![Project Settings](/assets/img/94.png)

#### 3. **API Keys** 탭 클릭

![API Keys](/assets/img/95.png)

#### 4. service_role 키를 .env에 추가

```
SUPABASE_URL=https://project뒤의값.supabase.co
SUPABASE_SERVICE_ROLE_KEY=여기에 service_role 복사
```

### 크롤러 로직

크롤링은 Puppeteer로, 데이터 저장은 Supabase로 진행한다.

#### 스텔스 브라우저로 봇 탐지 우회

```ts
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

puppeteer.use(StealthPlugin());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

#### 크롤링 대상 정의

```ts
const PRODUCTS = [
  { name: "임팩트 웨이프로틴", url: "https://...", protein_id: 26 },
  { name: "임팩트 아이솔레이트", url: "https://...", protein_id: 27 },
  { name: "클리어 웨이", url: "https://...", protein_id: 36 },
  { name: "크레아틴", url: "https://...", protein_id: 37 },
  { name: "베타알라닌", url: "https://...", protein_id: 38 },
];
```

쿠팡은 정책이 엄격하고 공식 API가 있어서, 별도로 **파트너스 API**를 활용할 예정이다.

#### 가격 크롤링 함수

```ts
async function crawlPrice(page, url) {
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector("span.price.font-semibold.my-auto.text-2xl");

  const rawPrice = await page.$eval(
    "span.price.font-semibold.my-auto.text-2xl",
    (el) => el.textContent.trim()
  );

  const numericPrice = parseInt(rawPrice.replace(/[^\d]/g, ""), 10);
  return numericPrice;
}
```

#### 메인 실행 함수

```ts
async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const month = today.getMonth() + 1;
  const date = today.getDate();

  console.log(`오늘 날짜: ${todayStr}`);

  // 월과 일이 같은 날만 insert (ex. 3월 3일, 4월 4일)
  if (month !== date) {
    console.log(`오늘(${month}월 ${date}일)은 월과 일이 같지 않아 저장하지 않음`);
    await browser.close();
    return;
  }

  const results = [];

  for (const product of PRODUCTS) {
    console.log(`${product.name} 크롤링 중...`);
    const price = await crawlPrice(page, product.url);
    if (!price) continue;

    results.push({
      protein_id: product.protein_id,
      observed_date: todayStr,
      price,
      available: true,
    });

    console.log(`${product.name}: ₩${price.toLocaleString()}`);
  }

  await browser.close();

  if (results.length > 0) {
    const { error } = await supabase.from("protein_prices_daily").insert(results);
    if (error) console.error("Supabase 저장 실패:", error.message);
    else console.log("Supabase 저장 완료");
  }
}
main();
```

- Puppeteer로 각 상품 페이지 접속 → 가격 요소 추출 → 숫자만 파싱
- **월과 일이 같은 날**일 때만 Supabase `protein_prices_daily` 테이블에 저장
- MyProtein 세일 주기에 맞춰 자동 저장되도록 구성

### GitHub Actions: 매일 오전 8시(KST 오후 5시) 자동화

```yaml
name: Myprotein Monthly Tracker

on:
  schedule:
    - cron: "0 8 * * *"  # UTC 8시 = KST 17시
  workflow_dispatch:

jobs:
  crawl:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        run: npm ci --no-audit --no-fund

      - name: Run crawler
        run: node crawlMyproteinPrice.js
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

---

## 결과

- 매일 오후 5시(KST) 정각에 GitHub Actions가 자동 실행된다.
- MyProtein 사이트에 접속해 5개 제품 가격을 크롤링한다.
- 월·일이 같은 날(세일 가능일)에만 Supabase에 자동 저장한다.
- 전체 로깅과 에러는 GitHub Actions 로그로 확인한다.

결과적으로, "매달 세일 시기를 기다리며 수동으로 기록하던" 과정이 **완전 자동화된 가격 DB**로 바뀌었다.
