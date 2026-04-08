---
layout: post
title: "TBD 기반 Release Please 문제점"
date: 2025-12-10 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/TBD-%EA%B8%B0%EB%B0%98-Release-Please-%EB%AC%B8%EC%A0%9C%EC%A0%90

---

## Release Please

![Release Please - Major / Minor / Patch](/assets/img/70.png)

- Major: 이전 버전과 호환되지 않는 API 변경
- Minor: 이전 버전과 호환되는 기능 추가 (`feat`)
- Patch: 이전 버전과 호환되는 버그 수정 (`fix`)

---

## GitFlow vs Trunk-Based

![GitFlow vs Trunk-Based](/assets/img/71.png)

---

## 문제 정의

![문제 정의 - Case 1, Case 2](/assets/img/72.png)

### Case 1: fix가 포함된 핫픽스 → Result: 릴리즈 노트 중복

원인

- 핫픽스 배포 시 생성된 태그가 Main 브랜치로 동기화(Sync)되지 않음
- Main은 최신 태그를 모르므로, 정기 배포 시 이미 핫픽스에 들어간 커밋을 다시 '새 변경'으로 모아서 릴리즈 노트에 중복 기재

### Case 2: feat가 포함된 핫픽스 → Result: 릴리즈 버전 충돌

원인

- 핫픽스 배포로 마이너 버전이 올라갔는데, 해당 태그가 Main에 반영되지 않음
- Main은 여전히 구버전 태그 기준으로 다음 버전을 정하므로, 이미 핫픽스로 나간 버전과 같은 버전 번호를 만들어 충돌 발생

---

## 시도했던 해결 구조: BackMerge

![BackMerge 구조](/assets/img/73.png)

### 해결한 것

- Case 2처럼 release 쪽에서 만든 태그를 main으로 반영해, main에서도 태그가 맞게 맞춰짐

### 이슈

- 체리픽으로 가져오면 Fix C가 동일한 내용이어도 커밋 ID(SHA)가 달라짐
- Release Please는 커밋 해시만 보기 때문에, 결국 changelog에 같은 수정이 중복으로 들어감

질문: 체리픽해서 가져올 때 커밋을 `chore`로 쓰면 Case 1(중복)은 안 생기지 않나?  
→ 그렇게 하면 1.1.1의 changelog에는 그 fix가 아예 안 찍힘.

- BackMerge를 하면 `package.json`(또는 manifest) 버전이 1.1.1로 갱신되고, 1.1.1 이후 시점의 커밋만 다음 changelog에 포함됨

---

## TBD를 유지하려면?

1. 정기 배포로 v1.1.0 생성
2. `feat: Feat A`, `feat: Feat B` 작업 중 에러 발생 → `chore: Fix C`로 수정 (흐름상은 다소 어색할 수 있음)
3. v1.1.0 태그에서 `release/v1.1.x` 브랜치 생성
4. `release/v1.1.x`에서 Fix C를 cherry-pick 후, 커밋 메시지를 `fix: Fix C`로 바꿔서 푸시하고 Release Please 실행  
   - 주의: `git cherry-pick -e <핫픽스커밋해시>` 사용  
   - 이때 1.1.1용 changelog 생성
5. main의 manifest를 수동으로 1.1.1로 수정  
   - RP는 manifest를 보고 “마지막 배포 버전”을 판단  
   - Merge를 안 했으므로 main에는 v1.1.1 태그가 없음 → RP는 마지막 태그를 여전히 v1.1.0으로 봄  
   - 로그 수집: v1.1.0 이후 커밋을 모두 가져옴  

```json
// .release-please-manifest.json
{
  ".": "1.1.1"
}
```

6. 이후 작업 재개
7. 정기 배포 실행 → Feat A, Feat B, Feat D가 반영된 릴리즈 노트 생성

요약: RP는 manifest 파일을 먼저 보고 “마지막 배포 버전”을 정한다.

---

## 배포 브랜치를 추가하는 방식

1. 정기 배포
   - production(운영): v1.1.0
   - main: v1.1.0 기준으로 Feat A, Feat B 머지
2. 핫픽스: production에서 브랜치 따서 수정 → `fix: Fix C` 후 production에 머지
3. production에 v1.1.1 태그 생성 및 배포 (main과 무관)
4. production의 fix 커밋을 main으로 cherry-pick  
   - 주의: `git cherry-pick -e <핫픽스커밋해시>`  
   - 커밋 메시지를 `chore: apply hotfix from v1.1.1`처럼 두면, main의 RP는 버전을 올리지 않고 무시 → main은 여전히 v1.2.0을 목표로 함 (main에는 v1.1.1 태그가 없음)  
   - 이때 manifest만 1.1.1로 올려 둠
5. 정기 배포 시 main에 v1.2.0 릴리즈 PR 머지 → v1.2.0 태그 생성, Feat A, Feat B, Feat D가 포함된 changelog 생성
6. main을 production에 푸시해서 운영 최신화

차이 정리

- 앞의 방식: Main(미래 코드)에서 수정 → Release(과거 코드)로 이식
- 이 방식: Production(현재 코드)에서 수정 → Main(미래 코드)로 이식

---

## 커밋 메시지로 diff만 반영하면 중복 제거 안 되나?

공식 입장:  
Release Please 쪽 이슈([#2476](https://github.com/googleapis/release-please/issues/2476))에서 “머지 커밋 때문에 로그가 중복된다”는 요청이 있으나, 머지/중복 로그를 도구 레벨에서 처리할 계획은 없다는 답변.

기술적 이유:  
도구는 커밋 해시(SHA)만 식별자로 사용한다. 체리픽이나 스쿼시 머지는 내용이 같아도 새 해시가 나오기 때문에, RP 입장에서는 완전히 다른 커밋으로 인식한다.
