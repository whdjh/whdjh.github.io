---
layout: post
title: "무신사 코테 2차 회고: 동시성 제어와 AI 활용 전략"
date: 2026-02-14 00:00:00 +0900
categories: dev
---

## Step 1: 동시성 제어의 근본 원리
> "정원이 1명 남은 강좌에 100명이 동시에 신청해도, 정확히 1명만 성공해야한다."

경쟁 상태를 방어하는 아키텍쳐를 사용하게 된다. 따라서 프론트 개발자인점을 활용해서 Redis Lock또는 DB 격리를 설정할 필요없는 node.js(싱글 스레드)와 sqllite(동기식)를 선택했다.

과정을 정리하면
- OS 큐 + NodeJS 싱글 스레드 (입구 통제): "아무리 동시에 요청이 쏟아져도, 한 줄로 세워서 정확히 1명씩만 입장시킨다."
- SQLite 동기식 블로킹 + 트랜잭션 + 락 (완벽한 밀실): "입장한 1명이 작업을 모두 끝내거나 아예 안 하거나(트랜잭션) 할 때까지, 화장실 문을 처음부터 꽉 잠그고(immediate 락), 그 1명이 화장실에서 나올 때까지 NodeJS의 시간을 아예 멈춰버려서(동기식 블로킹) 절대 다음 사람을 부르지 못하게 만든다."

---
## Step 2: 정합성과 속도를 위한 스키마 설계
1. 전체 스키마
![](https://velog.velcdn.com/images/wngns9807/post/0c168749-0e43-4216-af90-b1b2801eff87/image.png)
> 1. INTEGER PRIMARY KEY: 테이블 전체에서 절대 중복될 수 없고, 절대 비어있을 수 없다
> 2. AUTOINCREMENT: 기존 번호에 +1하여 자동으로 번호표 부여
> 3. UNIQUE: PRIMARY KEY 말고 절대 다른 줄이랑 겹치지 않게
> 4. NOT NULL: 반드시 입력할 값

- 학과(departments)에 교수(professors)와 학생(students)가 속한다.
> departments (학과 테이블)
>
| id (PK) | name (UNIQUE) |
| :--- | :--- |
| 1 | 컴퓨터공학과 |
| 2 | 경영학과 |
> professors (교수 테이블)
> 
| id (PK) | name | department_id (FK) |
| :--- | :--- | :--- |
| 10 | 이주훈 | 1 (컴퓨터공학과 소속) |
| 20 | 김주훈 | 2 (경영학과 소속) |
> students (학생 테이블)
>
| id (PK) | name | department_id (FK) |
| :--- | :--- | :--- |
| 101 | 박주훈 | 1 (컴퓨터공학과 소속) |
| 102 | 최주훈 | 2 (경영학과 소속) |

- 교수와 학생은 학과ID를 참조
- 강좌는 특정 학과에서 개설하고 특정 교수가 담당한다.
- 강좌는 학과ID와 교수ID를 동시에 참조한다.
- 시간표는 하나의 강좌에 시간 조각들이므로 강좌ID를 참조한다.
- 수강신청은 학생과 강좌를 연결해주는 다리(교차로) 역할을 하므로, 학생ID와 강좌ID를 동시에 참조한다.


2. 중앙의 교차로: enrollments (수강신청 명단)
![](https://velog.velcdn.com/images/wngns9807/post/45c0857b-e20d-491f-b7ea-9ec7d4763177/image.png)
- 학생(students) 테이블과 강좌(courses) 테이블 사이에 놓인 enrollments 테이블
- 설명: 보통은 강좌 테이블 안에 "현재 수강 인원: 30명"이라고 적어둘 것 같지만, 우리 설계에는 그 칸이 아예 없다. 대신 학생과 강좌를 연결하는 enrollments라는 교차로 역할의 테이블를 만들었다.
- 1번 학생이 100과목을 들어도 아래로 추가하면 된다. -> 꼼수B
- 강좌에 몇명이 신청했는지 알고싶으면 강좌ID가 1번인 줄이 몇개인지 count하면 된다. -> 꼼수A
- 삭제를 하고싶다면 해당 열만 삭제하면 된다.
> enrollments (수강신청 명단 테이블)
>
| id (PK) | student_id (학생) | course_id (강의) | 설명 (DB엔 안 들어감) |
| :--- | :--- | :--- | :--- |
| 1 | 101 | 5 | 101번 학생이 5번 강의 신청 |
| 2 | 101 | 7 | 101번 학생이 7번 강의 신청 |
| 3 | 102 | 5 | 102번 학생이 5번 강의 신청 |

> - 꼼수 A: 여기서 강의에 쉼표로 두면 되지않나?
그렇게 된다면 쉼표로 무한정 넣다보면 한 셀에 데이터가 무한정으로 길어진다. 이제 카운트를 하게되면 쉼표를 다 꺼내서 세야되는 작업을 하므로 느려진다.
> 
| 강좌 id | 강좌명 | 수강생 명단 (문자열) | 문제점 |
| :--- | :--- | :--- | :--- |
| 5 | 자료구조 | "101, 102, 105, 110..." | "총 몇 명?" -> 글자를 다 꺼내서 쉼표를 세어야 함 (느림).

> - 꼼수 B: 여기서 학생에 테이블을 늘리면 되지않나?
그렇게 된다면 학생 1은 강좌를 10개 넣고 학생 2는 강좌를 1개만 넣었는데 학생 2에도 빈 값의 셀이 많아져 메모리 사용이 많아진다.
>
| 학생 id | 이름 | 과목1 | 과목2 | 과목3 | ... | 과목10 | 문제점 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 101 | 김철수 | 5 | 7 | (빈칸) | ... | (빈칸) | 안 듣는 과목 칸은 다 빈칸(NULL)이라 메모리 낭비 심함.


3. 옆으로 뻗은 가지: course_schedules (시간표)
![](https://velog.velcdn.com/images/wngns9807/post/1e5ba286-792d-4bc3-8113-0e00c3772c19/image.png)
- 강좌(courses) 테이블에서 곁가지로 뻗어 나온 course_schedules 테이블
- 설명: 강좌 테이블 안에 "월1, 수1"이라고 글자로 적어두지 않았다. 아예 테이블을 밖으로 빼내서 요일(월=0)과 교시(1교시=1)를 숫자로 저장해 두었다.
- 효과: 이렇게 숫자로 예쁘게 정리된 별도의 표를 만들어두면, 나중에 "시간표 겹치는 거 있어?"라고 데이터베이스에게 물어봤을 때(SQL JOIN), 데이터베이스가 복잡한 글자 해석 없이 숫자만 딱딱 맞춰보고 빠르게 대답가능
> course_schedules (시간표 테이블)
>
| id (PK) | course_id (강의) | day_of_week (요일) | period (교시) | 설명 (DB엔 안 들어감) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 5 | 0 | 1 | 5번 강의는 월요일 1교시 |
| 2 | 5 | 2 | 1 | 5번 강의는 수요일 1교시 |
| 3 | 7 | 4 | 3 | 7번 강의는 금요일 3교시 |
 

> - 강의 테이블에 시간표 칸을 만드는 경우에 꼼수 A처럼 쉼표를 분리하고, 문자와 숫자를 분리해야됨
>
| 강의 id | 강의명 | schedule (시간표) | 문제점 |
| :--- | :--- | :--- | :--- |
| 5 | 자료구조 | "월1, 수1" | "월1 겹쳐?" -> 서버(Node.js)가 독방에 앉아서 이 글자를 꺼내 쉼표 자르고 비교하느라 시간을 다 허비함. 밖의 대기열 폭발. |

---
## Step 3: 수강신청 빠른 실패 전략
> "독방에 들어온 1번 학생을 최대한 빨리 쫓아내거나(에러), 최대한 빨리 통과시켜서(성공) 뒤에 줄 서 있는 99명을 덜 기다리게 만들자"
> db.prepare('쿼리').get(값) 은 "이 쿼리의 빈칸(?)에 값을 안전하게 넣어서, DB에서 딱 1줄만 재빨리 찾아와!"

1. 트랜젝션 입장 -> 수강 신청 버튼을 눌러 enroll 함수안으로 들어와 끝나기전까지는 아무도 못들옴(동시성 방어)
```js
const enroll = db.transaction((studentId, courseId) => {
  // 여기서부터 트랜잭션 시작! 문 잠급니다.
```

2. 학생/강의 존재인가? -> students와 courses 테이블의 PRIMARY KEY (id)를 조회
```js
  // 2. 학생 존재 확인
  const student = db.prepare('SELECT id FROM students WHERE id = ?').get(studentId);
  if (!student) return { error: '학생을 찾을 수 없습니다.', status: 404 };

  // 2. 강좌 존재 확인
  const course = db.prepare('SELECT id, credits, capacity FROM courses WHERE id = ?').get(courseId);
  if (!course) return { error: '강좌를 찾을 수 없습니다.', status: 404 };
```

3. 중복 신청 확인 -> 수강 테이블의 UNIQUE (학생ID, 강의ID) 제약 조건 활용해서 조회하므로 금방 끝남

```js
  // 3. 중복 신청 확인
  const existing = db.prepare(
    'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?'
  ).get(studentId, courseId);
  if (existing) return { error: '이미 수강신청한 강좌입니다.', status: 409 };

```

4. 정원 초과인가? -> COUNT하므로 단순 개수 세는 연산이어서 1,2 다음으로 끝남
```js
  // 4. 정원 확인 (동시성 제어 핵심)
  const enrolled = db.prepare(
    'SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?'
  ).get(courseId).count;
  if (enrolled >= course.capacity) return { error: '정원이 초과되었습니다.', status: 409 };
```


5. 최대 학점인가? -> 수강 명단과 시간표와 강의 테이블을 JOIN하여 아래와 같은 테이블이 만들어지고, 학점 칸의 숫자들을 SUM까지 완료하여 고비용

| 학생 ID | 수강 중인 강의 | 강의명 | 학점 (credits) |
| --- | --- | --- | --- |
| 1번 | 5번 | 자료구조 | 3 |
| 1번 | 7번 | 알고리즘 | 3 |

```js
  // 5. 학점 확인 (최대 18학점)
  const currentCredits = db.prepare(`
    SELECT COALESCE(SUM(c.credits), 0) as total
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.student_id = ?
  `).get(studentId).total;
  
  if (currentCredits + course.credits > 18) {
    return { error: '최대 학점을 초과합니다.', status: 409 };
  }

```


6. 시간표가 겹치는가? -> 기존 수강 명단 + 시간표 + 새 강의 시간표를 모두 JOIN하여 아래와 같은 테이블이 만들어지고. 새로 신청한 강의의 시간표(예: 월요일 1교시)와 **"숫자가 일치하는 줄이 있는지" 일일이 대조**해야 하므로 가장 무거운 연산

| 학생 ID | 수강 중인 강의 | 요일 (숫자) | 교시 (숫자) |
| --- | --- | --- | --- |
| 1번 | 5번 (자료구조) | 0 (월) | 1 (1교시) |
| 1번 | 5번 (자료구조) | 2 (수) | 1 (1교시) |
```js
  // 6. 시간 충돌 확인
  const conflict = db.prepare(`
    SELECT c.name AS course_name
    FROM enrollments e
    JOIN course_schedules cs1 ON e.course_id = cs1.course_id
    JOIN course_schedules cs2 ON cs2.course_id = ?
    JOIN courses c ON e.course_id = c.id
    WHERE e.student_id = ?
      AND cs1.day_of_week = cs2.day_of_week
      AND cs1.period = cs2.period
    LIMIT 1
  `).get(courseId, studentId);

  if (conflict) {
    return { error: `시간이 충돌하는 강좌가 있습니다: ${conflict.course_name}`, status: 409 };
  }
```

7. 합격 -> INSERT
8. 다시 -> COMMIT
```js
  // 7. 수강신청 등록 (INSERT)
  const result = db.prepare(
    'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)'
  ).run(studentId, courseId);

  // 리턴하는 순간 트랜잭션이 성공적으로 COMMIT 되고 독방 문이 열림!
  return {
    data: {
      id: result.lastInsertRowid,
      student_id: studentId,
      course_id: courseId,
    },
    status: 201,
  };
});

```

---

## Step 4: 수강 취소 로직에 숨겨진 'TOCTOU' 방어술
```js
// ── 수강취소 ──
// TOCTOU 방지: SELECT 없이 DELETE 한 번으로 처리, changes로 존재 여부 판단
router.delete('/:id', (req, res) => {
  const enrollmentId = parseInt(req.params.id);

  // 1. .run() 방아쇠 당기기!
  const result = db.prepare('DELETE FROM enrollments WHERE id = ?').run(enrollmentId);
  
  // 2. 삭제된 줄(영수증)이 0개라면?
  if (result.changes === 0) {
    return res.status(404).json({ error: '수강신청 내역을 찾을 수 없습니다.' });
  }

  res.json({ message: '수강취소가 완료되었습니다.' });
});
```

- .run()으로 행동을 지시하면, DB가 "나 방금 이 명령으로 데이터 O줄을 건드렸어!"라고 보고를 해주고, 그럼 result.changes가 0이라고 지울것이 없다는것을 알려준다.
- DB는 DELETE 명령을 받으면 알아서 문을 잠그고 지운다. 두 번 다다닥 눌러도, 첫 번째가 지우고 나면 두 번째는 지울 게 없어서 자연스럽게 실패한다. 꼬일 틈(TOCTOU) 자체가 없다.


---
## Step 5: 1만 건의 시드 데이터와 '라운드로빈' 배정 알고리즘
> "10,000명의 학생, 500개의 강좌, 교수 110명이 동적 데이터로 구성해야했다."

1. 전체 생성 구조
```
학과 15개 -> 교수 110명 -> 강의 500+ -> 학생 10,000
```
- 모든 INSERT는 하나의 트렌젝션이다. 이유는 10,000개 INSERT를 트랜잭션 없이 날리면 SQLite는 매 INSERT마다 디스크에 fsync(저장 확인)를 한다. 트랜잭션으로 묶으면 마지막에 딱 1번만 디스크에 써서 시간을 줄인다.

2. 라운드로빈 교수 배정
- 나머지 연산을 하여 순서를 배정해 균등하게 배분하여  특정 교수에게 강좌가 몰리면 그 교수의 시간표 슬롯이 빨리 소진되어 시간 충돌이 과도하게 발생하고, 동시성 테스트에서 충돌 오류(409)와 정원 초과 오류(409)가 뒤섞여 테스트 결과를 신뢰할 수 없게 된다.

3. 시간표 배정
- 1순위: daypair x periods 조합에서 교수 스케줄과 겹치지않음
- 2순위: 빈 슬롯
- 3순위: 충돌 허용하여 랜덤 배정

```js
profScheduleUsed[profId] = Set<"day-period">
```
- 교수가 이미 쓰고 있는 슬롯을 "0-1"(월요일 1교시) 형태의 문자열로 Set에 저장.
Set의 has() 조회는 O(1) 이므로, 500개 강좌 배정 중 매번 충돌 검사를 해도 빠르다.


---
## Step 6: 테스트
> "내가 만든 자물쇠가 진짜 잠기는지, 실제로 100명이 동시에 문을 두드려봐야 안다."

- 1. Promise.all이 동시성을 흉내내는 원리
```
// ❌ 순차 요청: 이건 동시성 테스트가 아님
for (let i = 0; i < 100; i++) {
  await request('POST', '/api/enrollments', { student_id: i, course_id: 1 });
}

// ✅ 동시 요청: 100개를 한 번에 쏜다
const promises = [];
for (let i = 0; i < 100; i++) {
  promises.push(request('POST', '/api/enrollments', { student_id: i, course_id: 1 }));
}
const results = await Promise.all(promises);
```
- await를 루프 안에 쓰면 1번이 끝나야 2번이 시작된다. Promise.all은 100개의 HTTP 요청을 거의 동시에 출발시킨다. 정확히는 "완전한 동시"가 아니라 이벤트 루프가 다음 틱을 처리하기 전에 100개의 소켓 연결을 모두 열어버리는 것이다. 서버 입장에서는 이 100개가 사실상 동시에 몰려오는 요청으로 처리된다.
- 클라이언트의 응답과 서브 응답의 일치를 봐야한다.
- 테스트별로 학생 ID 범위를 다르게 주어 데이터 오염을 막았다.

--- 
## 면접대비질문
### Q1. `.immediate()` vs `.deferred()` — 왜 `.immediate()`를 사용했나요?

"현재 단일 프로세스 + 동기식 + 인메모리 환경에서는 `.deferred()`로도 충분합니다. 어차피 better-sqlite3가 동기식이라 이벤트 루프를 블로킹하기 때문에, 트랜잭션 격리 수준과 관계없이 인터리빙이 물리적으로 불가능합니다. `.immediate()`를 쓴 건 이 트랜잭션이 쓰기 작업이라는 의도를 명시적으로 드러내기 위한 선택이고, 만약 나중에 파일 기반 SQLite로 전환한다면 실제로 동시성 보호 역할도 하게 됩니다." 

**핵심 키워드:** 동기식, 이벤트 루프 블로킹, 인터리빙 불가, 의도 표현용

---

### Q2. TOCTOU가 뭔가요? SELECT 후 DELETE로 했다면 어떤 문제가 생기나요?

"TOCTOU는 Time Of Check To Time Of Use의 약자로, 확인한 시점과 사용한 시점 사이에 상태가 바뀌는 문제입니다. 수강취소를 SELECT 후 DELETE로 구현하면, 두 요청이 동시에 SELECT해서 '있다'고 확인한 뒤 둘 다 DELETE하면 이미 없는 걸 삭제하면서도 200을 반환하게 됩니다. 현재 코드는 DELETE 한 번으로 처리하고 changes 값으로 존재 여부를 판단해서, 확인과 행동을 하나로 합쳐 TOCTOU를 원천 차단했습니다. 이 방식은 코드가 동기든 비동기든 상관없이 항상 안전합니다."
 

**핵심 키워드:** 확인과 행동의 분리, DELETE 원자적 처리, changes 카운트

---

### Q3. 수강신청 검증 순서를 왜 이렇게 정했나요?

"두 가지 원칙을 따랐습니다. 첫째, 비용이 작은 것부터 실행해서 불필요한 비싼 쿼리를 줄였습니다. PK 조회(학생/강좌 존재 확인)가 가장 싸고, 다중 JOIN(시간 충돌 확인)이 가장 비쌉니다. 존재하지 않는 학생인데 시간 충돌 검사를 돌리면 낭비죠. 둘째, 근본 원인을 먼저 알려주는 게 좋은 UX입니다. 학생이 존재하지 않는데 '시간이 충돌합니다'라고 하면 혼란스럽고, '학생을 찾을 수 없습니다'가 훨씬 명확합니다."
 

**핵심 키워드:** 비용 순서(성능), 근본 원인 우선(UX)

---

### Q4. enrolled를 COUNT(*)로 매번 계산하는 이유는?

"courses 테이블에 enrolled 컬럼을 두고 증감시키면 조회 성능은 좋지만, 실제 데이터와 불일치할 위험이 있습니다. 버그로 +1/-1이 어긋나면 정원 30명인데 31명이 들어가는 사고가 날 수 있습니다. COUNT 기반은 enrollments 테이블이라는 단일 진실의 원천(single source of truth)에서 직접 세기 때문에 항상 정확합니다. 정원 초과가 절대 불가한 수강신청 시스템에서는 정확성을 우선하는 게 맞다고 판단했습니다."
 

**핵심 키워드:** single source of truth, 정확성 vs 성능 트레이드오프

---

### Q5. UNIQUE 제약조건이 있는데 왜 SELECT로 중복을 한 번 더 확인하나요?

"역할이 다릅니다. SELECT 검사는 사용자를 위한 것으로 '이미 수강신청한 강좌입니다'라는 친절한 에러 메시지를 제공합니다. UNIQUE 제약조건은 데이터 무결성의 최후 안전망입니다. UNIQUE만 쓰면 SQLite 에러 메시지가 그대로 나가서 사용자가 이해할 수 없습니다."
 

**핵심 키워드:** UX(사용자 에러 메시지) vs 데이터 안전망

---

### Q6. 에러 핸들링 미들웨어가 실제로 호출되나요?

"비즈니스 로직 에러(400, 404, 409)는 각 라우트에서 직접 처리하고 있어서, 이 미들웨어에 도달하는 경우는 예상치 못한 런타임 에러(DB 장애, 코드 버그 등)뿐입니다. 안전망(safety net) 역할로 두었습니다. 비즈니스 에러는 각 라우트에서, 예기치 못한 에러는 중앙 핸들러에서 처리하는 구조입니다."
 

**핵심 키워드:** 비즈니스 에러는 라우트에서, 예기치 못한 에러는 중앙에서

---

### Q7. 동시 접속 5,000명이 몰리면 어떻게 되나요?

"현재는 better-sqlite3가 동기식이라 한 명씩 순차 처리됩니다. 5,000번째 사용자는 앞의 4,999명이 끝날 때까지 기다려야 해서 응답 지연이 심해집니다. 개선하려면 먼저 DB를 PostgreSQL로 교체하고 비동기 드라이버를 사용하면 Node.js 이벤트 루프를 살릴 수 있습니다. 동시성 제어는 SELECT FOR UPDATE로 전환하고, 그래도 부족하면 서버 인스턴스를 수평 확장하겠습니다. 현재 병목은 Node.js가 싱글스레드라서가 아니라 better-sqlite3가 동기식이라서입니다."
 

**핵심 키워드:** 병목은 동기식 DB, PostgreSQL 비동기 전환, SELECT FOR UPDATE, 수평 확장

---

### Q8. 동명이인이 대량 발생하는데 문제 아닌가요? (함정)

"문제 아닙니다. 이 시스템에서 학생을 식별하는 건 이름이 아니라 ID(PK)입니다. 수강신청도, 시간표 조회도 전부 student_id로 합니다. 이름은 표시용이고, 현실에서도 동명이인은 자연스러운 현상이라 오히려 현실적인 데이터입니다."
 

**핵심 키워드:** PK로 식별, 이름은 표시용, 함정 질문엔 근거 있게 반박

---

### **Q9. 시드 데이터를 하나의 트랜잭션으로 감싼 이유는?**

"같은 SQL을 수만 번 실행하는데, 트랜잭션 없이 개별 실행하면 매번 내부 처리 비용이 발생합니다. 하나로 묶으면 그 비용이 한 번만 발생해서 수십 배 빨라집니다. 1분 이내 완료 요구사항을 확실히 충족시키기 위한 성능 최적화입니다. 같은 맥락에서 db.prepare()도 트랜잭션 바깥에서 한 번만 선언해서 SQL 컴파일을 1번만 하도록 했습니다."
 

**핵심 키워드:** 트랜잭션 배치 처리, prepare 1회 컴파일, 디스크 I/O 최소화, 성능 최적화

---

### **Q10. 교수 시간표 fallback에 빠지면 비즈니스 규칙 위반 아닌가요?**

"인지하고 있습니다. 다만 교수당 평균 4~5개 강좌, 30개 슬롯 중 약 9개만 사용하므로 fallback에 빠질 확률은 극히 낮습니다. 개선한다면 fallback 대신 에러를 던지거나 다른 교수를 배정하는 방식으로 비즈니스 규칙 위반을 원천 차단하겠습니다."
 

**핵심 키워드:** 확률적 안전성, fallback 허용 vs 에러 던지기, 비즈니스 규칙 위반 인지 + 개선안 제시

---

### **Q11. 시드에 수강신청 데이터를 넣지 않은 이유는?**

“테스트에서 빈 강좌를 전제로 동시성을 검증하고 있어서, 시드에 수강신청을 넣으면 테스트가 깨집니다. 시드 데이터와 테스트의 의존성을 고려한 설계입니다. 다만 더 현실적으로 만든다면 시드에 수강신청도 넣고, 테스트 조건을 enrolled === 0 대신 enrolled < capacity로 유연하게 바꾸는 게 바람직합니다."
 

**핵심 키워드:** 시드-테스트 의존성, 빈 강좌 전제 조건, enrolled < capacity로 유연화