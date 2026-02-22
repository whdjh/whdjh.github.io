---
layout: post
title: "무신사 코테 2차 회고: 동시성 제어와 AI 활용 전략"
date: 2026-02-14 00:00:00 +0900
categories: dev
---

무신사 코테 2차 과제를 풀면서의 사고 과정, 설계·구현 전략, 그리고 AI 도구(Cursor/Claude)를 어떻게 활용했는지 정리한 회고다.  
단순히 "무엇을 했다"를 넘어서, **왜 그렇게 판단했고 무엇을 배웠는지**를 남기는 것이 목표다.

---

## 1. 문제를 처음 받았을 때의 사고 과정

### 1.1 문제의 본질 파악

`PROBLEM.md`를 읽으면 "대학교 수강신청 시스템 REST API를 만들어라"라고 되어 있다.  
하지만 이 과제에서 진짜 평가하는 것은 단순히 CRUD를 짤 수 있느냐가 아니다. 평가 기준을 보면 비중이 명확하다:

```text
1순위: 동작 여부 (가장 큰 비중) -- 빌드되고 실행되는가?
2순위: 핵심 기능 (큰 비중) -- 동시성 제어가 견고한가?
3순위: 사고의 깊이 -- AI를 어떻게 활용했는가? 설계 문서는?
```

여기서 핵심적으로 읽어야 하는 문장이 있다:

> "정원이 1명 남은 강좌에 100명이 동시에 신청해도, 정확히 1명만 성공해야 합니다."

이 한 문장이 과제 전체의 난이도를 결정한다.  
단순 CRUD가 아니라 **동시성 제어**가 핵심이라는 뜻이다.

### 1.2 시간 제한 안에서의 우선순위 결정

3시간이라는 제한 시간에서 가장 먼저 결정해야 하는 것은 "**무엇을 먼저 만들 것인가**"였다.  
이 프로젝트에서 채택한 순서는 다음과 같다:

```text
1. 빌드 가능한 스켈레톤 확보 (15분)
2. DB 스키마 + 시드 데이터 (30분)
3. 조회 API 3개 (20분)
4. 수강신청/취소 + 동시성 제어 (40분) -- 가장 중요
5. 테스트 작성 (30분)
6. 문서화 (20분)
7. 검증 + 최종 정리 (25분)
```

핵심 원칙은 **"완벽한 코드보다 동작하는 코드"**다.  
어떤 시점에 시간이 끊겨도 `npm start`가 동작하는 상태를 유지해야 했다.  
그래서 스켈레톤(빈 서버 + 헬스체크)을 가장 먼저 만들고, 기능을 하나씩 붙여나가는 방식을 택했다.

### 1.3 기술 스택 선택의 이유

과제에서 JavaScript + Express + SQLite 인메모리(`better-sqlite3`)를 선택한 이유:

- **Express**: 가장 널리 쓰이는 Node.js 웹 프레임워크. 보일러플레이트가 적다.
- **better-sqlite3**: 핵심은 **동기식(synchronous) API**라는 점이다. 대부분의 DB 라이브러리는 비동기(async)인데, better-sqlite3는 동기식이다. 이게 왜 중요한지는 뒤에서 자세히 다룬다.
- **SQLite 인메모리**: 외부 DB 설치가 필요 없다. `npm install && npm start`만으로 모든 것이 동작한다. 평가자가 환경 설정에 시간을 쓸 필요가 없다.

---

## 2. 프롬프트 전략: 왜 이렇게 질문했는가

### 2.1 "커서룰에 요구사항 내재화" — 가장 먼저 한 일

프롬프트 이력(`prompts/01-setup.md`)을 보면, 코드를 작성하기 전에 가장 먼저 한 일이 있다:

> "PROBLEM.md를 줄 단위로 분석해서 커서룰에 반영하는 방식이 좋을 것 같아."

이것이 왜 중요한가? AI 코딩 에이전트(Cursor, Claude 등)는 **컨텍스트** 안에 있는 정보만 참고해서 코드를 작성한다.  
매번 프롬프트에 "18학점 제한이 있고, 시간 충돌 검사해야 하고, 정원 초과 방지해야 하고..."를 반복하면 토큰 낭비이고, 한 번이라도 빠뜨리면 AI가 그 규칙을 무시한 코드를 생성한다.

그래서 `.cursor/rules/musinsa-rookie-exam.mdc` 파일에 모든 요구사항을 구조화해서 넣었다. 이렇게 하면:

- 이후 "수강신청 API 만들어줘"라고만 해도, AI가 자동으로 18학점 제한, 시간 충돌 검사, 정원 초과 방지 등을 모두 고려한 코드를 생성한다.
- 요구사항 누락이 원천적으로 방지된다.
- 프롬프트가 짧아져서 토큰을 절약할 수 있다.

이 전략은 "한 번 설정하면 모든 대화에서 자동으로 적용되는 규칙"이라는 점에서, 매번 수동으로 컨텍스트를 넣는 것보다 훨씬 효율적이다.

### 2.2 "설계 먼저, 구현 나중" — Plan 모드 활용

두 번째 프롬프트 이력(`prompts/02-implementation.md`)을 보면, 구현 전에 Plan 모드에서 설계를 먼저 했다:

> "Plan 모드에서 전체 아키텍처를 먼저 잡자. 4단계로 나누되, 각 단계가 독립적으로 검증 가능해야 해."

왜 이렇게 했는가? 3시간이라는 제한 시간에서 설계 없이 바로 코딩하면, 중간에 구조를 뒤엎어야 하는 상황이 생길 수 있다.  
특히 **동시성 제어 전략**은 코드 구조에 근본적인 영향을 미치므로, 구현 전에 전략을 확정해야 했다.

이 단계에서 확정한 핵심 결정:

```text
- enrolled는 COUNT(*)로 실시간 집계 (컬럼으로 관리하지 않음)
- 시간표는 별도 테이블로 분리 (문자열로 저장하지 않음)
- 동시성은 better-sqlite3의 동기식 특성 + BEGIN IMMEDIATE 활용
```

이 세 가지 결정이 전체 코드의 방향을 결정했다. 뒤에서 각각 왜 이런 결정을 내렸는지 자세히 설명한다.

### 2.3 "협업형 반복 정제" — 프롬프트 패턴

이 프로젝트에서 AI에게 지시한 방식은 "~해줘" 단순 지시형이 아니라,  
**내가 방향을 제시하고 AI가 초안을 만들고 내가 검토하고 다듬는** 패턴이었다:

```text
1. 내가 설계 의도와 방향을 먼저 제시
   → "시간 충돌 검사를 빠르고 정확하게 하려면, 시간표를 문자열이 아니라 별도 테이블로 분리하는 게 나을 것 같아."

2. AI가 초안 생성
   → schema.js, seed.js 초안 코드 생성

3. 결과를 검토하고 다듬기 지시
   → "limit 최대값 100으로 제한 추가해", "에러 메시지에 현재 학점 정보 포함해"

4. curl이나 테스트로 동작 검증
   → curl http://localhost:3000/api/courses?limit=1
```

이런 패턴이 효과적인 이유는, AI가 처음부터 완벽한 코드를 작성하기를 기대하는 것보다 **방향을 잡아주고 세부사항을 다듬는 방식**이 결과물의 품질이 더 높기 때문이다.

### 2.4 "도구 분리" — Cursor와 Claude Code의 역할

- **Cursor**: 설계(Plan 모드) + 구현(Agent 모드). 코드를 작성하는 도구.
- **Claude Code (Ralph)**: QA 전용. 구현이 끝난 후 curl로 각 API를 호출하고, 에지 케이스를 테스트하는 역할.

같은 AI가 만들고 같은 AI가 검증하면 편향이 생길 수 있다.  
"내가 작성한 코드에서 버그를 찾아봐"라고 하면, 자기가 작성한 코드라서 간과하기 쉽다.  
그래서 **별도의 AI 에이전트로 QA를 수행하는 것**이 더 객관적인 검증이 된다.

---

## 3. 파일을 읽는 순서와 각 파일의 역할

이 프로젝트를 이해하려면 다음 순서로 파일을 읽는 것을 권장했다.

### 3.1 먼저 읽어야 할 파일: 전체 구조 파악

**1번: `PROBLEM.md` — 과제 요구사항 원본**

모든 것의 출발점이다. 이 파일을 읽지 않으면 나머지 코드가 왜 이런 구조인지 이해할 수 없다. 특히 주목해야 할 부분:

- 기획팀 메모 (동시성 요구사항의 핵심 문장)
- 데이터 규모 (학과 10+, 강좌 500+, 학생 10,000+, 교수 100+)
- 강좌 조회 필수 응답 필드 6개
- 평가 기준 (동작 > 핵심기능 > 사고의 깊이)

**2번: `README.md` — 빌드/실행 방법**

```bash
npm install
npm start
curl http://localhost:3000/health
```

이 세 줄이 전부다. 외부 DB 설치 없이 즉시 동작한다.

**3번: `docs/REQUIREMENTS.md` — 설계 결정 근거**

PROBLEM.md에 명시되지 않은 모든 결정사항이 여기에 있다.  
왜 인증을 생략했는지, 시간표를 왜 이렇게 설계했는지, 동시성 전략은 왜 이것을 선택했는지 등.

### 3.2 소스 코드를 읽는 순서

소스 코드는 서버가 시작될 때 실행되는 순서대로 읽는 것이 자연스럽다:

```text
src/app.js (진입점)
  → src/db.js (DB 연결)
  → src/schema.js (테이블 생성)
  → src/constants.js (상수 정의)
  → src/seed.js (시드 데이터)
  → src/routes/students.js (학생 API)
  → src/routes/professors.js (교수 API)
  → src/routes/courses.js (강좌 API)
  → src/routes/enrollments.js (수강신청/취소 API) ★ 가장 중요
```

각 파일의 역할을 간단히 정리하면 다음과 같다.

---

### 파일 1: `src/app.js` — 서버 진입점

서버의 시작과 끝을 담당하는 파일이다.

```javascript
const express = require('express');
const { createTables } = require('./schema');
const { seedData } = require('./seed');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// DB 초기화: 테이블 생성 + 시드 데이터
createTables();
seedData();

// 헬스체크
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 라우트 등록
app.use('/api/students', require('./routes/students'));
app.use('/api/professors', require('./routes/professors'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enrollments', require('./routes/enrollments'));

// JSON 에러 핸들링 미들웨어
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || '서버 내부 오류가 발생했습니다.' });
});

// 직접 실행 시에만 서버 시작 (테스트에서는 import만)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  });
}

module.exports = app;
```

주목 포인트:

- `createTables()`와 `seedData()`가 서버 시작 시 **동기적으로** 실행되어 DB가 등록되기전에 서버에 요청을 하지않는다.
- `if (require.main === module)` 패턴: 테스트에서 `require('../src/app')`로 가져오면 서버를 시작하지 않고 app 객체만 반환한다. 테스트와 서버의 포트 충돌을 방지한다.
- JSON 에러 핸들링 미들웨어: REST API에서 HTML 대신 JSON 에러를 반환한다.

---

### 파일 2: `src/db.js` — DB 연결

```javascript
const Database = require('better-sqlite3');

const db = new Database(':memory:');

db.pragma('foreign_keys = ON');

module.exports = db;
```

짧지만 중요한 결정 두 가지:

- `':memory:'`: SQLite를 인메모리 모드로 실행. 서버 재시작 시 데이터 초기화.
- `foreign_keys = ON`: SQLite는 기본적으로 외래키 제약조건이 꺼져 있기 때문에 명시적으로 켠다.

이 파일에서 생성된 `db` 객체가 프로젝트 전체에서 공유된다.

---

### 파일 3: `src/schema.js` — 테이블 스키마

6개의 테이블과 6개의 인덱스를 생성한다.

```sql
CREATE TABLE departments (...);
CREATE TABLE professors (...);
CREATE TABLE courses (...);
CREATE TABLE course_schedules (...);
CREATE TABLE students (...);
CREATE TABLE enrollments (...);
```

#### a) `course_schedules` 테이블을 왜 분리했는가?

가장 직관적인 방법은 courses 테이블에 `schedule TEXT` 컬럼을 두는 것이다.  
하지만 이 방식은 시간 충돌 검사 시 문자열 파싱이 필요하고, JOIN으로 깔끔하게 처리하기 어렵다.

대신 `course_schedules` 테이블에 `(course_id, day_of_week, period)` 조합으로 저장하면,  
**SQL JOIN 한 번으로 충돌 검사가 가능**하다:

```sql
SELECT c.name
FROM enrollments e
JOIN course_schedules cs1 ON e.course_id = cs1.course_id
JOIN course_schedules cs2 ON cs2.course_id = ?  -- 신청하려는 강좌
WHERE e.student_id = ?
  AND cs1.day_of_week = cs2.day_of_week
  AND cs1.period = cs2.period
LIMIT 1;
```

정수 비교 하나로 시간 충돌을 검사할 수 있다.

#### b) `enrolled` 컬럼을 왜 두지 않았는가?

courses 테이블에 `enrolled` 컬럼을 두면 직관적이지만, 동시에 업데이트하면 **lost update** 문제가 생길 수 있다.  
그래서 enrolled를 **저장하지 않고 매번 COUNT로 집계**하는 방식을 택했다:

```sql
SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?;
```

이 값은 enrollments 테이블에 존재하는 row 수라 항상 정확하다.

#### c) `UNIQUE (student_id, course_id)` 제약조건

같은 학생이 같은 강좌에 두 번 신청하는 것을 DB 레벨에서 방지한다.  
코드에서도 중복 체크를 하지만, DB 제약조건은 최후의 방어선이다.

---

### 파일 4: `src/constants.js` — 공통 상수

```javascript
const DAY_NAMES = ['월', '화', '수', '목', '금'];

const PERIOD_TIMES = {
  1: '09:00-10:30',
  2: '10:30-12:00',
  3: '13:00-14:30',
  4: '14:30-16:00',
  5: '16:00-17:30',
  6: '17:30-19:00',
};

module.exports = { DAY_NAMES, PERIOD_TIMES };
```

DB에는 정수만 저장하고, API 응답에서는 사람이 읽기 좋은 `"월 09:00-10:30"` 형식으로 변환할 때 사용했다.

---

## 4. 핵심 로직 상세 해부

### routes 파일 총정리

---

#### professors.js -- 가장 단순한 조회 API

**구조:** 페이지네이션 파라미터 파싱 → 전체 개수 조회 → 해당 페이지 데이터 조회 → 응답

- `Math.max(1, parseInt(req.query.page) || 1)` -- 0, 음수, NaN, 빈 값 등 어떤 입력이 와도 최소 1 이상이 되도록 방어
- `limit`은 최소 1, 최대 100, 기본값 20
- `offset = (page - 1) * limit` -- "처음 N개를 건너뛰고 그 다음부터 가져와라"
- `.get()` -- 결과 1건을 객체로 반환. 없으면 `undefined`
- `.all()` -- 결과 전부를 배열로 반환. 없으면 `[]`
- `total`을 응답에 포함하는 이유: 프론트엔드가 "총 몇 페이지인지" 알아야 페이지 버튼을 만들 수 있음

---

#### students.js -- 목록 조회 + 시간표 조회

**목록 조회(6~22줄):** professors.js와 동일한 패턴. 학년(`year`) 필드만 추가.

**시간표 조회(25~72줄):**

- `/:id/timetable` -- URL의 `:id`에 학생 번호가 들어옴. `GET /api/students/100/timetable` → `req.params.id = "100"`
- 학생 존재 확인 → 없으면 404
- enrollments → courses → departments → professors를 JOIN해서 이 학생이 듣고 있는 강좌 목록을 가져옴
- 각 강좌마다 course_schedules에서 시간 슬롯을 `.all()`로 가져옴 (한 강좌에 시간 슬롯이 여러 개이므로)
- `.map()`으로 숫자를 한글 문자열로 변환, `.join(', ')`으로 합침 → `"월 09:00-10:30, 수 09:00-10:30"`
- `...course` 스프레드 연산자로 기존 필드 복사 + `schedule` 필드 추가
- `.reduce()`로 총 학점 합산

---

#### courses.js -- 목록 조회 + 세 가지 추가 기능

**추가 1: 학과별 필터링**

- `department_id` 파라미터가 있으면 WHERE 조건을 붙이고, 없으면 전체 조회
- `...params` 스프레드 연산자로 파라미터가 있을 때만 값을 넣음

**추가 2: enrolled 서브쿼리**

- `(SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolled`
- 각 강좌 옆에 "현재 몇 명이 신청했는지"를 표시하는 용도 (읽기만, INSERT/DELETE는 하지 않음)
- enrolled 컬럼을 따로 두지 않고 매번 세는 이유: 단일 진실 원천. enrollments 테이블의 row 수가 곧 정확한 신청 인원

**추가 3: 시간표 문자열 변환** -- students.js와 동일한 패턴

---

#### enrollments.js -- 핵심 파일

**수강신청(8~100줄):**

`db.transaction()` 안에 7단계 검증을 넣어서, 전체가 하나의 덩어리로 실행됨. 중간에 다른 요청이 끼어들 수 없음.

7단계 순서와 그 이유:

```
1. 학생 존재 확인 (404)     ← 가장 싼 검사 (SELECT 1건)
2. 강좌 존재 확인 (404)     ← 가장 싼 검사 + credits, capacity도 같이 가져옴
3. 중복 신청 확인 (409)     ← SELECT 1건
4. 정원 확인 (409)          ← COUNT 집계
5. 학점 확인 (409)          ← JOIN + SUM
6. 시간 충돌 확인 (409)     ← JOIN 3개 (가장 무거운 쿼리)
7. INSERT (201)             ← 모든 검증 통과 후 실제 등록
```

순서의 원칙: **빠른 실패(fail fast)**. 비용이 싼 검사를 먼저 해서, 어차피 거부할 요청을 무거운 쿼리 실행 전에 빨리 걸러냄.

- `COALESCE(SUM(...), 0)` -- 아무 강좌도 안 듣고 있으면 SUM이 NULL이 되는데, NULL을 0으로 바꿔줌
- `enroll.immediate()` -- 트랜잭션 시작할 때 즉시 쓰기 락을 잡아서, 이 트랜잭션이 끝날 때까지 다른 수강신청이 대기
- `student_id`와 `course_id`가 둘 다 있어야 하는 이유: "누가 뭘 신청하는지" 둘 중 하나라도 없으면 수강신청이 성립하지 않음
- 성공 시 201을 반환하는 이유: HTTP 201 = "새로운 데이터가 생성됨". POST로 새 row를 만들었으므로 200이 아니라 201이 REST 관례

**수강취소(104~117줄):**

- SELECT 없이 바로 DELETE하고, `result.changes`(삭제된 row 수)로 존재 여부 판단
- TOCTOU 방지: 확인과 삭제를 분리하면 두 요청이 동시에 같은 것을 삭제할 수 있지만, 하나의 DELETE로 처리하면 이 문제가 없음

### 4.1 조회 API 공통 패턴

세 개의 조회 API(학생, 교수, 강좌)는 모두 같은 패턴을 따른다:

```javascript
router.get('/', (req, res) => {
  // 1. 페이지네이션 파라미터 파싱
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  // 2. 전체 개수 조회
  const total = db.prepare('SELECT COUNT(*) as count FROM students').get().count;

  // 3. 페이지 데이터 조회
  const data = db.prepare(`
    SELECT s.id, s.name, ...
    FROM students s
    JOIN departments d ON s.department_id = d.id
    ORDER BY s.id
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  // 4. 응답
  res.json({ data, total, page, limit });
});
```

`page`, `limit` 파싱에서 **모든 이상값을 방어**하는 부분이 인상적이었다:

```javascript
const page = Math.max(1, parseInt(req.query.page) || 1);
```

`0`, 음수, `NaN`, 빈 값 등 어떤 값이 와도 최소 1 이상이 되게 만든다.

---

### 4.2 강좌 조회의 enrolled 실시간 집계

강좌 조회 API(`src/routes/courses.js`)에서 가장 중요한 부분은 `enrolled` 필드다:

```javascript
const data = db.prepare(`
  SELECT c.id, c.name, c.credits, c.capacity,
         c.department_id, d.name AS department_name,
         p.name AS professor_name,
         (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolled
  FROM courses c
  JOIN departments d ON c.department_id = d.id
  JOIN professors p ON c.professor_id = p.id
  ${whereClause}
  ORDER BY c.id
  LIMIT ? OFFSET ?
`).all(...params, limit, offset);
```

`(SELECT COUNT(*))` 서브쿼리로 **매번 실시간 집계**를 한다.  
수강신청/취소 시 별도 UPDATE가 필요 없고, 정합성이 항상 유지된다.

그 다음, 시간표 문자열을 조합하는 부분:

```javascript
const getSchedules = db.prepare(
  'SELECT day_of_week, period FROM course_schedules WHERE course_id = ? ORDER BY day_of_week, period'
);

const result = data.map((course) => {
  const schedules = getSchedules.all(course.id);
  const scheduleStr = schedules
    .map((s) => `${DAY_NAMES[s.day_of_week]} ${PERIOD_TIMES[s.period]}`)
    .join(', ');

  return { ...course, schedule: scheduleStr };
});
```

단순하지만, **DB 정규화 구조와 응답 포맷의 요구사항**을 깔끔하게 연결하는 코드였다.

---

### 4.3 수강취소의 TOCTOU 방지

수강취소는 짧지만 중요한 설계가 숨어 있다:

```javascript
router.delete('/:id', (req, res) => {
  const enrollmentId = parseInt(req.params.id);

  if (isNaN(enrollmentId)) {
    return res.status(400).json({ error: '유효한 수강신청 ID가 필요합니다.' });
  }

  const result = db.prepare('DELETE FROM enrollments WHERE id = ?').run(enrollmentId);
  if (result.changes === 0) {
    return res.status(404).json({ error: '수강신청 내역을 찾을 수 없습니다.' });
  }

  res.json({ message: '수강취소가 완료되었습니다.' });
});
```

여기서 핵심은 **SELECT 없이 바로 DELETE**한다는 점이다.  
`DELETE`의 결과인 `changes`로 존재 여부를 판별해 **TOCTOU(Time of Check to Time of Use)** 문제를 원천 차단한다.

---

## 5. 데이터베이스 설계와 시드 데이터 생성

### seed 파일 총정리
#### 트랜잭션으로 감싼다는 것

트랜잭션 없이 INSERT 10,000번을 하면:

```
INSERT 1건 → 저장 완료!
INSERT 1건 → 저장 완료!
INSERT 1건 → 저장 완료!
... (10,000번 반복)
```

매번 "저장 완료!" 처리를 한다. SQLite 내부에서 매 INSERT마다 데이터를 확정하는 작업이 발생한다. 택배로 비유하면 **물건 1개 보낼 때마다 택배차를 따로 보내는 것**이다.

트랜잭션으로 감싸면:

```
트랜잭션 시작 → "지금부터 모아둘게"
  INSERT 1건 → 모아둠
  INSERT 1건 → 모아둠
  INSERT 1건 → 모아둠
  ... (10,000번)
트랜잭션 끝 → "이제 한 번에 저장!" → 저장 완료!
```

10,000건을 모았다가 한 번에 저장한다. **물건 10,000개를 트럭 하나에 실어서 한 번에 보내는 것**이다. 이것만으로 속도가 수십 배 빨라진다.

---

#### 라운드로빈

라운드로빈은 **순서대로 돌아가며 배정하는 것**이다.

```
교수 7명: [A, B, C, D, E, F, G]

강좌 0 → 교수 A  (0 % 7 = 0)
강좌 1 → 교수 B  (1 % 7 = 1)
강좌 2 → 교수 C  (2 % 7 = 2)
...
강좌 6 → 교수 G  (6 % 7 = 6)
강좌 7 → 교수 A  (7 % 7 = 0)  ← 다시 처음으로
강좌 8 → 교수 B  (8 % 7 = 1)
...
```

모든 교수가 균등하게 강좌를 맡는다. 34개 강좌를 7명이 나누면 교수당 4~5개.

**대체제: 랜덤 배정**

```javascript
const profId = pick(profs); // 랜덤으로 고르기
```

이러면 운이 나쁘면 교수 A가 강좌 15개를 맡고 교수 G는 0개가 될 수 있다. 교수 A의 시간 슬롯이 빨리 차서 시간 충돌이 자주 발생하고, 교수 G는 놀게 된다. 라운드로빈은 이런 편중을 방지한다.

---

#### assignSchedule 함수

이 함수가 해결하는 문제를 먼저 설명한다.

**문제 상황:** 교수 A가 이미 월/수 1교시에 "자료구조"를 가르치고 있다. 교수 A에게 "알고리즘"도 배정해야 한다. 그런데 "알고리즘"도 월/수 1교시에 넣으면, 교수 A가 같은 시간에 두 교실에 있어야 하므로 말이 안 된다.

그래서 교수별로 "이미 쓰고 있는 시간"을 기록하고, 빈 시간에 배정한다.

```
교수 A의 시간표 (5일 x 6교시 = 30칸):

        1교시  2교시  3교시  4교시  5교시  6교시
월       [X]    [ ]    [ ]    [ ]    [ ]    [ ]
화       [ ]    [ ]    [ ]    [ ]    [ ]    [ ]
수       [X]    [ ]    [ ]    [ ]    [ ]    [ ]
목       [ ]    [ ]    [ ]    [ ]    [ ]    [ ]
금       [ ]    [ ]    [ ]    [ ]    [ ]    [ ]

[X] = 자료구조로 이미 사용 중
[ ] = 비어있음
```

**1단계: 요일 쌍으로 배정 시도**

대학 시간표를 보면 보통 "월/수 같은 시간" 또는 "화/목 같은 시간"에 수업을 넣는다. 이게 자연스럽다.

```
"알고리즘"을 배정하고 싶다 (주 2회 수업)

월/수 1교시 시도 → 교수 A가 이미 사용 중 → 실패
화/목 1교시 시도 → 둘 다 비어있음 → 성공!

결과:
        1교시  2교시  3교시  4교시  5교시  6교시
월       [자]    [ ]    [ ]    [ ]    [ ]    [ ]
화       [알]    [ ]    [ ]    [ ]    [ ]    [ ]
수       [자]    [ ]    [ ]    [ ]    [ ]    [ ]
목       [알]    [ ]    [ ]    [ ]    [ ]    [ ]
금       [ ]    [ ]    [ ]    [ ]    [ ]    [ ]
```

**2단계: 개별 빈 슬롯으로 배정**

교수 A가 강좌를 많이 맡아서, 요일 쌍으로 같은 교시에 넣을 수가 없는 경우:

```
        1교시  2교시  3교시  4교시  5교시  6교시
월       [X]    [X]    [X]    [ ]    [ ]    [ ]
화       [X]    [X]    [ ]    [ ]    [ ]    [ ]
수       [X]    [X]    [X]    [ ]    [ ]    [ ]
목       [X]    [X]    [ ]    [ ]    [ ]    [ ]
금       [ ]    [ ]    [ ]    [ ]    [ ]    [ ]

월/수 → 1,2,3교시 전부 사용 중
화/목 → 1,2교시 사용 중
```

쌍으로 같은 교시에 넣으려면 월/수 4교시 이후를 찾아야 한다. 근데 실패하면 그냥 빈 칸 아무 데나 넣는다:

```
"데이터베이스"를 배정 → 월 4교시, 금 2교시에 각각 배정
```

시간표가 들쭉날쭉하지만 교수가 같은 시간에 두 곳에 있지는 않으니 OK.

**3단계: 슬롯이 아예 없을 때**

교수가 강좌를 너무 많이 맡아서 30칸이 거의 다 찬 경우. 이론적으로 가능하지만, 교수당 평균 4~5개 강좌이고 각 강좌가 2칸을 쓰면 30칸 중 8~10칸만 사용하므로 **실제로 여기까지 오는 경우는 거의 없다.**

만약 온다면 이미 사용 중인 칸에 겹쳐서 넣는다. 교수 시간표가 충돌하지만, 이것은 **학생의 수강신청 시간 충돌 검사와는 별개**다. 학생이 수강신청할 때 검사하는 것은 "학생의 시간표에서 겹치는지"이지, 교수 시간표가 겹치는지가 아니기 때문이다.

### 5.1 데이터 규모와 구조

| 항목 | 수량 | 근거 |
|------|------|------|
| 학과 | 15개 | 종합대학의 주요 계열 포괄 |
| 교수 | 110명 | 학과당 7~8명. 교수 1인당 평균 4.6개 강좌 |
| 강좌 | 510개 | 학과당 33~36개. 기본 10개 과목명을 분반으로 확장 |
| 학생 | 10,000명 | PROBLEM.md 최소 요구사항 |
| 강좌 시간 슬롯 | ~1,020개 | 510개 강좌 x 평균 2개 슬롯 |

### 5.2 강좌 생성 + 분반 시스템

```javascript
for (let c = 0; c < coursesPerDept; c++) {
  const baseName = dept.courses[c % dept.courses.length];
  const section = Math.floor(c / dept.courses.length) + 1;
  const courseName = section > 1 ? `${baseName} ${section}분반` : baseName;
  // ...
}
```

각 학과에 10개의 기본 과목명이 있고, 학과당 33~36개 강좌를 만들어야 한다.  
`c % 10`으로 과목명을 순환시키고, `c / 10`으로 분반 번호를 매기는 방식으로 **현실적인 분반 구조**를 만들었다.

### 5.3 교수 시간 충돌 방지 로직

같은 교수가 같은 시간에 두 강좌를 담당하면 안 되기 때문에,  
`profScheduleUsed[profId] = Set<"day-period">` 구조로 **교수별 이미 사용한 슬롯**을 추적했다.

1단계: 요일 쌍 + 같은 교시 (예: 월/수 1교시, 화/목 2교시)  
2단계: 개별 빈 슬롯 배정  
3단계: 정말 어쩔 수 없을 때 랜덤 배정 (실제론 거의 발생하지 않음)

대부분의 경우 1~2단계에서 해결되도록 **시간대와 요일을 랜덤 셔플**했다.

### 5.4 트랜잭션 기반 시드 삽입

```javascript
const seed = db.transaction(() => {
  // 학과, 교수, 강좌, 시간표, 학생 일괄 삽입
});
seed();
```

모든 시드 INSERT를 하나의 트랜잭션으로 감싸서 **성능을 크게 개선**했다.  
인메모리 SQLite이긴 하지만, 트랜잭션 유무에 따라 체감 속도가 꽤 달랐다.

---

## 6. 동시성 제어: 이 과제의 핵심

### 6.1 왜 동시성 제어가 필요한가

수강신청은 다음 단계를 거친다:

```text
1. 정원 확인: 현재 30/30명인가?
2. 학점 확인: 이 학생이 이미 18학점인가?
3. 시간 충돌 확인: 같은 시간에 다른 강좌를 듣고 있는가?
4. INSERT: 문제 없으면 수강신청 등록
```

동시성 문제가 발생하는 시나리오:

```text
정원 29/30인 강좌에 학생 A와 학생 B가 동시에 신청

학생 A: 정원 확인 → 29/30 → OK!
학생 B: 정원 확인 → 29/30 → OK!  (A가 INSERT하기 전에 확인)
학생 A: INSERT → 30/30 → 성공
학생 B: INSERT → 31/30 → 정원 초과 발생!
```

이것이 전형적인 **race condition**이다.

### 6.2 better-sqlite3의 동기식 모델이 해결하는 방법

대부분의 DB 라이브러리와 달리, better-sqlite3는 **동기식(sync)**이다.

- 일반적인 라이브러리: `await db.query(...)` — 쿼리 사이에 다른 요청을 처리할 수 있다.
- better-sqlite3: `db.prepare(...).run()` — 호출이 끝날 때까지 이벤트 루프가 **블로킹**된다.

Node.js는 싱글 스레드이기 때문에, 어느 한 요청의 트랜잭션이 실행되는 동안에는 **다른 요청이 절대 끼어들 수 없다**.  
이 특성을 이용해 "자연스러운 직렬화(natural serialization)"를 얻을 수 있다.

### 6.3 트랜잭션 코드 한 줄씩 해부

```javascript
const enroll = db.transaction((studentId, courseId) => {
  // ...
});
```

`db.transaction()`으로 트랜잭션 단위를 정의하고,  
실제 호출은 `enroll.immediate(studentId, courseId)`로 했다.

```javascript
const result = enroll.immediate(parsedStudentId, parsedCourseId);
```

`.immediate()`는 SQLite의 `BEGIN IMMEDIATE`를 사용해 **트랜잭션 시작 시점에 즉시 쓰기 락**을 잡는다.  
이렇게 하면 트랜잭션 안의 모든 SELECT/INSERT가 **하나의 원자적 블록** 안에서 실행된다.

검증 순서는 다음과 같다:

1. 학생 존재 확인 → 빠른 실패
2. 강좌 존재 확인 → 빠른 실패
3. 중복 신청 확인
4. 정원 확인 (COUNT)
5. 학점 확인 (JOIN + SUM)
6. 시간 충돌 확인 (JOIN 2번)
7. INSERT

비용이 적은 검증을 먼저 해서 **리소스 낭비를 줄이고**,  
모든 검증이 끝난 뒤에야 INSERT를 수행한다.

### 6.4 시각적으로 본 직렬화

정원 30명인 강좌에 50명이 동시에 수강신청을 하는 상황을 시각화하면:

```text
HTTP 요청 50개가 동시에 도착
      │
      ▼
  이벤트 큐: [요청1] [요청2] [요청3] ... [요청50]
      │
      ▼ (이벤트 루프가 하나씩 꺼냄)
  
  [요청1] → enroll.immediate() 시작
          → SELECT COUNT(*) → 0/30명 → OK
          → INSERT → 성공 (1/30)
          → 트랜잭션 종료
  
  [요청2] → SELECT COUNT(*) → 1/30명 → OK → INSERT → 성공 (2/30)
  
  ...
  
  [요청31] → SELECT COUNT(*) → 30/30명 → 정원 초과 → 409 반환
  [요청32~50] → 동일하게 정원 초과로 실패
```

결과: 정확히 30명 성공, 20명 실패. 정원을 절대 초과하지 않는다.

---

## 7. 테스트 전략

### 7.1 Node.js 내장 테스트 러너 활용

외부 프레임워크 없이 `node:test`와 `node:assert`로 통합 테스트를 구성했다.

```javascript
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');
```

테스트 전/후에 서버를 랜덤 포트로 띄우고 내리는 패턴으로,  
**실제 HTTP 레벨에서 end-to-end 검증**을 했다.

### 7.2 동시성 테스트

가장 중요한 테스트는 **정원 초과 방지**였다:

```javascript
it('정원 초과 방지: 동시 요청 시 정원만큼만 성공', async () => {
  // enrolled가 0인 강좌 찾기
  const coursesRes = await request('GET', '/api/courses?limit=500');
  const target = coursesRes.body.data
    .sort((a, b) => a.capacity - b.capacity)
    .find((c) => c.enrolled === 0);

  const capacity = target.capacity;
  const concurrent = capacity + 50;

  // 학생 9000번부터 동시 요청
  const promises = [];
  for (let i = 0; i < concurrent; i++) {
    promises.push(
      request('POST', '/api/enrollments', {
        student_id: 9000 + i,
        course_id: target.id,
      })
    );
  }

  const results = await Promise.all(promises);
  const successes = results.filter((r) => r.status === 201).length;

  assert.strictEqual(successes, capacity);
});
```

`Promise.all`로 여러 HTTP 요청을 동시에 날려서,  
실제 운영 환경에 가까운 **race condition 상황**을 재현했다.

또 다른 테스트에서는 **정원 1명 남은 상태에서 100명 동시 신청** 시  
정확히 1명만 성공하는지도 검증했다.

---

## 8. 이 문제에서 배운 것들

### 8.1 "동작하는 코드"의 중요성

아무리 코드가 아름다워도 `npm start`가 안 되면 아무 의미가 없다.  
그래서 항상 다음 세 줄이 되는 상태를 최우선으로 유지했다:

```bash
npm install
npm start
curl http://localhost:3000/health
```

### 8.2 명시되지 않은 요구사항을 추론·문서화하기

PROBLEM.md에는 일부러 비워둔 영역들이 있었다:

- 인증은 어떻게 할 것인가?
- 수강취소 기한은 있는가?
- 시간표 슬롯은 어떻게 정의할 것인가?

이 틈을 메우는 것이 **시니어와 주니어의 차이**라고 느꼈다.  
합리적인 가정을 하고, 그 근거를 `docs/REQUIREMENTS.md`에 남겼다.

### 8.3 AI를 "동료"로 쓰는 법

AI에게 "수강신청 API 만들어줘"라고만 던지는 것이 아니라,

1. 내가 먼저 문제를 구조화하고  
2. 설계 방향을 제시한 뒤  
3. 초안을 받아 리뷰하고 수정 지시를 내리고  
4. 다른 에이전트로 QA를 돌리는

이 일련의 과정을 통해, AI를 **"코드 자동 완성기"가 아닌 "함께 일하는 동료"**로 쓸 수 있었다.

---

## 부록: 핵심 용어 사전

| 용어 | 설명 |
|------|------|
| 동시성 제어 (Concurrency Control) | 여러 요청이 동시에 같은 데이터에 접근할 때 데이터 정합성을 보장하는 메커니즘 |
| Race Condition | 두 개 이상의 프로세스가 공유 자원에 동시에 접근할 때 실행 순서에 따라 결과가 달라지는 상황 |
| TOCTOU | Time of Check to Time of Use. 확인(check)과 사용(use) 사이에 상태가 변경되는 취약점 |
| Lost Update | 두 트랜잭션이 같은 데이터를 읽고 각각 수정하면, 나중에 쓴 것이 먼저 쓴 것을 덮어쓰는 문제 |
| BEGIN IMMEDIATE | SQLite에서 트랜잭션 시작 시 즉시 쓰기 락을 획득하는 모드 |
| 이벤트 루프 블로킹 | 동기식 작업이 Node.js 이벤트 루프를 점유하여 다른 작업이 실행되지 못하는 상태 |
| 직렬화 (Serialization) | 동시에 실행될 수 있는 작업들을 순서대로 하나씩 실행하는 것 |
| 서브쿼리 | SQL 쿼리 안에 포함된 다른 쿼리. `(SELECT COUNT(*) FROM ...)` 형태 |
| 페이지네이션 | 대량의 데이터를 페이지 단위로 나누어 반환하는 패턴. LIMIT + OFFSET 사용 |
| 인메모리 DB | 디스크가 아닌 메모리에 데이터를 저장하는 DB. 빠르지만 서버 종료 시 데이터 소실 |

