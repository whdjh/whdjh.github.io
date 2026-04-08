---
layout: post
title: "YepBuddy - (3) 스키마가 필요하다! Drizzle + Supabase로 구조 잡기"
date: 2025-10-02 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/YepBuddy-3-%EC%8A%A4%ED%82%A4%EB%A7%88%EA%B0%80-%ED%95%84%EC%9A%94%ED%95%98%EB%8B%A4-Drizzle-Supabase%EB%A1%9C-%EA%B5%AC%EC%A1%B0-%EC%9E%A1%EA%B8%B0

---

## 도입하게 된 이유

처음에는 Supabase 대시보드의 테이블 편집기로 유저 정보를 만들었다. 하지만 직접 써 보니 생각보다 불편했다.

- 드롭다운으로 클릭해서 데이터를 넣는 방식은 속도가 느렸다.
- 테이블 구조를 조금만 바꿔도 다시 들어가서 일일이 수정해야 했다.
- 쿼리를 직접 작성하는 게 오히려 더 빠를 때도 있었다.
- 타입이 자동으로 맞춰지지 않아, 프론트 코드에서 매번 수동으로 맞춰 줘야 했다.

"이럴 거면 차라리 코드로 스키마를 짜는 게 낫겠다."

그래서 러닝커브가 크지 않고, TypeScript 기반으로 바로 쓸 수 있는 Drizzle ORM을 도입했다. SQL 문법과 비슷하게 작성할 수 있어서 기존 SQL 감각으로 쉽게 적응할 수 있었고, 스키마를 코드로 관리하니 변경 이력도 한눈에 파악할 수 있었다.

---

## 과정

### 사전 준비

- 회원 가입은 했다고 가정
- Next.js App Router 기준
- Supabase 사용
- FSD 폴더 방식

### Supabase

1. New Project 버튼을 눌러 프로젝트를 생성한다.

![Supabase New Project](/assets/img/87.png)

2. 프로젝트를 생성한다. 비밀번호는 자동 생성 후 Copy하여 루트의 `.env`에 저장했다. (PASSWORD는 예시이므로 실제 값으로 교체한다.)

![프로젝트 생성](/assets/img/88.png)
![.env 저장](/assets/img/89.png)

3. 생성 후 Project Status가 활성화인지 확인하고 Connect 버튼을 클릭한다.

![Connect 버튼](/assets/img/90.png)

4. Transaction pooler 또는 Session pooler의 URL을 복사한다.

![Connection string 복사](/assets/img/91.png)

5. `.env`에 복사한 URL을 붙여 넣고, password를 반영한다.

![.env에 URL·password 반영](/assets/img/92.png)

### Drizzle

1. Drizzle Supabase 문서에 접속한다.  
   - https://orm.drizzle.team/docs/get-started/supabase-new

2. 아래 명령어를 터미널에 입력한다.

```shell
npm i drizzle-orm postgres dotenv
npm i -D drizzle-kit tsx
```

3. app 폴더 내부에 `db.ts` 파일을 만들고 아래 코드를 넣는다.

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });

const db = drizzle(client);

export default db;
```

4. 루트에 `drizzle.config.ts`를 만들고 설정한다. FSD 폴더 방식이라면 `schema` 경로를 프로젝트에 맞게 수정한다.

```ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: [
    './src/app/**/schema.ts',
    './src/db/schema/**/*.ts',
  ],
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

5. `package.json`에 스크립트를 추가한다.

```json
"scripts": {
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio"
}
```

6. 각 페이지에 필요한 테이블 파일(`schema.ts`)을 만든 뒤, 아래 명령어로 테이블 생성 여부를 확인한다.

```shell
npm run db:generate
npm run db:migrate
```

---

## 테이블 정의 방법

1. 테이블 생성

```ts
pgTable("테이블명", { 컬럼 정의 })
```

2. ID

```ts
bigint().generatedAlwaysAsIdentity().primaryKey()
uuid().primaryKey()
```

3. 문자열

```ts
description: text()
```

4. 숫자

```ts
weight: integer()
```

5. 시간

```ts
updatedate: timestamp().defaultNow()
```

6. 드롭다운(ENUM)

```ts
export const roles = pgEnum("topic", ["wpc", "wpi", ...]);
```

7. 가변 데이터 (예: 조회수)

```ts
stats: jsonb().$type<{ views: number }>().notNull().default({ views: 0 })
```

8. 참조 키

```ts
// references(() => proteins.protein_id, { onDelete: "cascade" }) : 원본 삭제 시 연쇄 삭제
// primaryKey({ columns: [...] }) : 복합 PK로 중복 방지 (예: 좋아요)
export const gymsLikes = pgTable("protein_likes", {
  protein_id: bigint({ mode: "number" }).references(() => proteins.protein_id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.protein_id] })]);
```

---

## 결과

- Drizzle로 테이블 스키마를 코드에 바로 정의할 수 있었고, 타입도 함께 따라와서 따로 맞춰 줄 필요가 없어졌다.
- Supabase 대시보드에서 클릭으로 작업할 때보다 스키마 수정이 훨씬 빨라졌고, 마이그레이션도 깔끔하게 관리됐다.
- SQL로 바꿔 쓰기도 쉬워서, 개발 속도와 유지보수성이 동시에 올라갔다.

### 사용하다 보니 만났던 문제들

1. Node.js 런타임 강제  
   `postgres-js` 드라이버는 TCP 소켓 등 Node API를 쓰므로 Edge 런타임에서 동작하지 않는다. 해당 라우트/API에 다음을 넣었다.

```tsx
export const runtime = "nodejs";
```

2. 조건부 where와 타입  
   Drizzle 체이닝에서 조건부 `where`를 쓰면 타입이 달라질 수 있어, `$dynamic()`으로 타입 안정성을 맞췄다.
