---
layout: post
title: "YepBuddy - (4) 헬스장 데이터를 불러보자! Supabase REST API를 직접 구성해봤다"
date: 2025-10-03 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/YepBuddy-4-%EC%9A%B4%EB%8F%99-%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%A5%BC-%EB%B6%88%EB%9F%AC%EB%B3%B4%EC%9E%90-Supabase-REST-API%EB%A5%BC-%EC%A7%81%EC%A0%91-%EA%B5%AC%EC%84%B1%ED%95%B4%EB%B4%A4%EB%8B%A4

---

## 왜 직접 API를 구성했는가?

Supabase는 기본적으로 REST Endpoint를 자동으로 만들어 주지만, 이 프로젝트에서는 더 세밀한 제어가 필요했다.

- 헬스장 데이터를 단순히 불러오는 것뿐 아니라 검색(q), 필터(topic), 정렬(desc) 등을 직접 제어하고 싶었다.
- 프론트와 백 간의 데이터 구조를 명확히 통일하기 위해 `/api` 경로에 Route Handler를 두고 REST API를 구현했다.

결국 목표는 Supabase + ORM(Drizzle)을 이용한 Spring-like REST API였다.

---

## 구현 과정

### `api/proteins/route.ts` 파일 생성

- Next.js App Router에서는 파일 경로가 곧 API 경로가 된다.
- `src/app/api/proteins/route.ts`처럼 만들면 `/api/proteins` 엔드포인트가 생긴다.

### route 파일 로직

API는 데이터만 주고받는 통로가 아니다. YepBuddy에서는 Drizzle ORM + Supabase로 Next.js 안에 자체 REST 서버를 구성했다.

#### 서버 런타임 지정

```ts
export const runtime = "nodejs";
```

- App Router는 기본적으로 Edge 런타임에서 실행된다.
- Drizzle ORM은 Node.js 환경 전용이므로, 이 한 줄을 넣어야 DB 커넥션이 정상 동작한다.
- 빼면 `"params.id must be awaited"` 같은 런타임 에러가 난다.

#### 필수 import

```ts
import { NextResponse } from "next/server";
import db from "@/app/db";
import { sql } from "drizzle-orm";
```

- NextResponse: Next.js에서 서버 응답을 만드는 객체
- db: Drizzle로 연결된 Supabase Postgres 인스턴스
- sql: SQL 쿼리를 실행하는 tagged template literal  
- ORM(Drizzle)이 DB 접근을, NextResponse가 응답 객체를 담당한다.  
  (ORM = Object–Relational Mapping, 관계형 DB와 코드 사이를 이어 주는 매개체)

#### GET 요청

```ts
export async function GET() {
  const result = await db.execute(sql`
    SELECT DISTINCT ON (protein_id)
      protein_id,
      observed_date,
      price,
      available,
      sale
    FROM protein_prices_daily
    ORDER BY protein_id, observed_date DESC
  `);

  const items = Array.isArray((result as any)?.rows) ? (result as any).rows : (result as any);

  return NextResponse.json({ ok: true, data: { items } });
}
```

- `db.execute(sql\`...\`)`: Drizzle로 SQL을 직접 실행한다.
- `DISTINCT ON (protein_id)`: 각 `protein_id`당 가장 최신 행 한 건만 가져온다.
- `ORDER BY protein_id, observed_date DESC`: protein_id별로 최신 날짜 순이 되도록 정렬해, 각 단백질의 최근 가격만 사용한다.
- 응답은 `NextResponse.json()` 형태로 통일한다.

### fetch → React Query

프론트에서는 fetch 후 React Query로 사용한다. (구현은 생략)

---

## 결과

- Supabase 자동 API보다 쿼리 제어가 훨씬 유연해졌다.
- 프론트엔드에서 DB 구조를 그대로 재활용할 수 있었다.
- Spring 하듯 React(Next) 안에서 백엔드를 설계하는 구조를 만들 수 있었다.
