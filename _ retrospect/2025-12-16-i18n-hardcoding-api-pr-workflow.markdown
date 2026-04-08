---
layout: post
title: "다국어 리소스 관리 하드코딩 API 및 PR 생성 워크플로우 검증 (PoC 6편)"
date: 2025-12-16 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/%EB%8B%A4%EA%B5%AD%EC%96%B4-%EB%A6%AC%EC%86%8C%EC%8A%A4-%EA%B4%80%EB%A6%AC-%ED%95%98%EB%93%9C%EC%BD%94%EB%94%A9-API-%EB%B0%8F-PR-%EC%83%9D%EC%84%B1-%EC%9B%8C%ED%81%AC%ED%94%8C%EB%A1%9C%EC%9A%B0-%EA%B2%80%EC%A6%9D

---

## 서론

자체 관리 서비스를 운영하는 회사에서 FE 개발자로 일하다 보면, 다국어 리소스를 관리할 때 아래 같은 흐름이 있으면 좋겠다고 느낄 때가 많다.

- 백오피스에서 다국어 키와 값을 입력한다.
- 그 내용을 백오피스 API로 DB에 반영한다.
- GitHub Actions 워크플로우가 실제 서비스 API를 호출해 DB를 읽고 JSON을 갱신한다.
- main과 diff가 있으면 자동으로 PR을 생성한다.

이렇게 운용하면 다국어 리소스를 개발자가 직접 넣는 대신, 기획자가 입력한 다국어 리소스를 사용만 하게 되어 역할이 명확히 분리된다.

---

## 전체 아키텍처 한 번에 보기

![다국어 리소스 관리 전체 아키텍처](/assets/img/70.png)

---

## 실제 서비스 아키텍처처럼 검증하기

### local 테스트 환경

```
repo
├─ app/i18n/page.tsx        # 백오피스 FE (i18n 관리 화면)
├─ db/
│  └─ i18n-virtual-db.json  # 가상 DB (백오피스에서 관리하는 원본 저장소)
└─ locale/
   ├─ ko.json               # 실서비스에서 사용하는 한국어 JSON
   ├─ en.json               # 실서비스에서 사용하는 영어 JSON
   └─ ...                   # 그 외 언어들 (fr.json 등), 워크플로우가 API 응답 기준으로 생성
```

### 백오피스와 DB에서의 테스트

백오피스 화면에서 모킹 API로 GET/POST를 보내어, 가상 DB가 정상적으로 조회·저장되는지만 확인한다.

### DB와 실제 서비스 테스트

#### Get API로 locale/*.json 생성

{% raw %}
```yaml
- name: Update localeJson from i18n API
  run: |
    set -euo pipefail
    mkdir -p locale

    API_RESPONSE=$(curl -fsSL "${{ secrets.I18N_API_BASE_URL }}${{ env.I18N_API_ENDPOINT }}")

    echo "$API_RESPONSE" | jq -r 'to_entries[] | select(.value | type == "object") | "\(.key) \(.value | @json)"' | while read -r lang content; do
      echo "$content" | jq '.' > "locale/${lang}.json"
    done
```
{% endraw %}

예상치 못한 오류가 나면 워크플로우가 실패하도록 `set -euo pipefail`을 둔다. 실서비스 JSON이 들어갈 `locale` 디렉터리를 준비한 뒤, API 응답(형태: `{"ko": {...}, "en": {...}, ...}`)을 받아 언어별 파일로 쪼갠다.

실서비스 적용 시 변경할 부분

{% raw %}
```yaml
API_RESPONSE=$(curl -fsSL "${{ secrets.I18N_API_BASE_URL }}${{ env.I18N_API_ENDPOINT }}")
```
{% endraw %}

변환기 동작 요약

- `jq 'to_entries[]'`: `{ ko: {...}, en: {...} }`를 `[{"key":"ko","value":{...}}, ...]` 형태로 풀어 순회
- `select(.value | type == "object")`: 값이 객체인 항목만 통과
- `"\(.key) \(.value | @json)"`: 각 항목을 `ko {"..."}`, `en {"..."}` 같은 한 줄 문자열로 변환
- `while read -r lang content; do ... done`: 첫 토큰(언어 코드)을 `lang`, 나머지를 `content`에 넣어 순회
- `echo "$content" | jq '.' > "locale/${lang}.json"`: `content`를 `locale/언어코드.json`에 기록

#### 기존 PR 있는지 확인

{% raw %}
```yaml
- name: Check for existing PR
  id: check-existing-pr
  run: |
    EXISTING_PR=$(gh pr list --state open --search "in:title \"chore: update Localization\"" --json number,headRefName --jq '.[0].number // empty')
    EXISTING_BRANCH=$(gh pr list --state open --search "in:title \"chore: update Localization\"" --json number,headRefName --jq '.[0].headRefName // empty')

    if [ -n "$EXISTING_PR" ]; then
      echo "existing_pr=$EXISTING_PR" >> $GITHUB_OUTPUT
      echo "existing_branch=$EXISTING_BRANCH" >> $GITHUB_OUTPUT
      echo "Found existing PR: #$EXISTING_PR on branch: $EXISTING_BRANCH"
    else
      echo "existing_pr=" >> $GITHUB_OUTPUT
      echo "existing_branch=" >> $GITHUB_OUTPUT
      echo "No existing PR found"
    fi
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
{% endraw %}

이미 "chore: update Localization" 제목의 PR이 열려 있으면 그 PR 번호와 브랜치 이름을 출력에 넣고, 없으면 비워 둔다.

#### 이번에 쓸 브랜치 이름 결정

- Case 1: 이미 열린 PR이 있다 → 그 PR의 브랜치 재사용
- Case 2: 열린 PR은 없고, 예전 `update-localization-*` 브랜치가 있다 → 그중 최신 브랜치 재사용
- Case 3: 둘 다 없으면 → `update-localization-<현재시각>` 새 브랜치 생성

{% raw %}
```yaml
- name: Generate timestamp and branch name
  id: generate-info
  run: |
    TIMESTAMP=$(date +"%Y%m%d-%H%M")

    if [ -n "${{ steps.check-existing-pr.outputs.existing_branch }}" ]; then
      BRANCH_NAME="${{ steps.check-existing-pr.outputs.existing_branch }}"
      echo "Using existing PR branch: $BRANCH_NAME"
    elif [ -n "${{ steps.find-latest-branch.outputs.latest_branch }}" ]; then
      BRANCH_NAME="${{ steps.find-latest-branch.outputs.latest_branch }}"
      echo "Using latest branch: $BRANCH_NAME"
    else
      PR_NUMBER=$(date +"%Y%m%d%H%M%S")
      BRANCH_NAME="update-localization-${PR_NUMBER}"
      echo "Creating new branch: $BRANCH_NAME"
    fi

    echo "timestamp=${TIMESTAMP}" >> $GITHUB_OUTPUT
    echo "branch_name=${BRANCH_NAME}" >> $GITHUB_OUTPUT
```
{% endraw %}

#### 동적 브랜치에 커밋/푸시

{% raw %}
```yaml
- name: Update dynamic branch
  run: |
    BRANCH_NAME="${{ steps.generate-info.outputs.branch_name }}"
    TIMESTAMP="${{ steps.generate-info.outputs.timestamp }}"

    git checkout main
    git checkout -b "$BRANCH_NAME" || git checkout -B "$BRANCH_NAME"

    git add locale/*.json

    if [ -n "$(git status --porcelain)" ]; then
      COMMIT_MSG="chore: update Localization"
      git commit -m "$COMMIT_MSG" -m "$TIMESTAMP" || exit 1
      git push origin "$BRANCH_NAME" --force-with-lease
      echo "Updated branch: $BRANCH_NAME"
    else
      echo "No changes detected"
    fi
```
{% endraw %}

생성·갱신한 `locale/*.json`만 작업 브랜치(`update-localization-*`)에 커밋·푸시하고, 변경이 없으면 커밋/푸시를 하지 않는다.

하나의 PR이 계속 갱신되는 이유

- 기존 PR이 있으면 같은 브랜치를 재사용하고,
- 같은 브랜치에 새 커밋을 `--force-with-lease`로 푸시해 이전 커밋을 덮어쓴다.

#### main과 작업 브랜치 사이에 실제 변경 있는지 확인

{% raw %}
```yaml
- name: Check for changes between main and dynamic branch
  id: verify-changed-files
  run: |
    BRANCH_NAME="${{ steps.generate-info.outputs.branch_name }}"
    git fetch origin "$BRANCH_NAME" || true

    if git diff --quiet main...origin/"$BRANCH_NAME" -- 'locale/*.json' 2>/dev/null; then
      echo "changed=false" >> $GITHUB_OUTPUT
      echo "No changes detected between main and $BRANCH_NAME"
    else
      echo "changed=true" >> $GITHUB_OUTPUT
      echo "Changes detected:"
      git diff main...origin/"$BRANCH_NAME" -- 'locale/*.json' || true
    fi
```
{% endraw %}

main과 비교했을 때 `locale/*.json`이 바뀐 경우에만 PR을 생성하도록, 변경 여부를 출력에 기록한다.
