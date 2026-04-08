---
layout: post
title: "웹소켓과 SSE가 뭐냐면?"
date: 2025-08-31 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/%EC%9B%B9%EC%86%8C%EC%BC%93%EA%B3%BC-SSE%EA%B0%80-%EB%AD%90%EB%83%90%EB%A9%B4

---

## 왜 공부하게 되었나?

이전까지는 REST API 기반 HTTP로 서버·클라이언트 간 데이터를 주고받는 프로젝트만 해왔다.  
공모전에서 챗봇 연동을 만들 때는 이 방식만으로는 한계가 있다는 걸 느꼈다.  
실시간 통신 방법을 찾다가 SSE(Server-Sent Events)와 WebSocket을 알게 됐고, 특히 양방향 실시간 통신이 가능한 WebSocket을 직접 다뤄보기로 했다.

---

## 문제 상황

HTTP 요청 기반 통신은, 클라이언트가 먼저 요청을 보내야 서버가 응답하는 구조다.  
그래서 서버가 먼저 클라이언트에게 메시지를 보낼 수 없고, 실시간 응답이 필요한 챗봇에서는 계속 폴링해야 하는 비효율이 생긴다.

이를 보완하는 방법으로, 서버 → 클라이언트 실시간 푸시가 가능한 SSE와 양방향 통신이 가능한 WebSocket을 검토했고, WebSocket 설정을 직접 구현해보기로 했다.

---

## 공부 내용

### 1. Node.js 서버 준비

```bash
npm init
npm install express ws
```

### 2. 8080 서버 구성 (server.js)

![server.js – 8080 서버 구성](/assets/img/49.png)

### 3. 메시지 전송 페이지 (index.html)

![index.html – 메시지 전송 페이지](/assets/img/50.png)

![index.html 화면](/assets/img/51.png)

### 4. 웹소켓 연결 (유저 → 서버만)

server.js에 WebSocket 처리 추가

![server.js – WebSocket 서버 로직](/assets/img/52.png)

index.html에 WebSocket 클라이언트 추가

![index.html – WebSocket 클라이언트](/assets/img/53.png)

### 5. 웹소켓 양방향 (유저 ↔ 서버)

![양방향 WebSocket 연결](/assets/img/54.png)

---

### socket.io를 많이 쓰는 이유

실무에서는 socket.io를 많이 쓴다.

1. 연결 끊김 시 자동 재접속
2. 접속자마다 자동 ID 부여
3. 전체 메시지 브로드캐스트 (모든 유저에게 전송)
4. 방(Room) 생성·관리

---

## 결과

![WebSocket 실시간 메시지 동작](/assets/img/55.gif)

서버·클라이언트가 WebSocket으로 연결된 뒤, 양방향으로 실시간 메시지를 주고받는 흐름을 구현해 봤다.
