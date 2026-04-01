---
layout: post
title: "YepBuddy - (8) 토스의 컬러 시스템 글을 읽고, 내 디자인 토큰을 OKLCH로 보정해봤다"
date: 2026-03-21 21:30:00 +0900
categories: dev
---

## 내 프로젝트에서 발견한 문제

개인 프로젝트로 운동 앱을 만들고 있다. React Native + NativeWind 기반이고, 디자인 토큰을 3단계(Primitive → Semantic → Component)로 나눠서 관리하고 있었다.

그러던 중 토스 디자인 플랫폼팀의 **"달리는 기차 바퀴 칠하기: 7년만의 컬러 시스템 업데이트"** 글을 읽었는데, 읽으면서 내 프로젝트에도 똑같은 문제가 있다는 걸 깨달았다.

토스 글에서 가장 와닿았던 부분은 이거였다.

> "같은 100인데 Grey 100, Blue 100, Red 100의 명도가 다 달라서, 리스트에서 같이 썼을 때 전부 100으로 통일해도 얼룩덜룩해 보이는 문제"

내 프로젝트의 status 컬러도 마찬가지였다. 같은 50 스케일인데 실제 OKLCH Lightness를 측정해보면:

| 토큰 | hex | OKLCH L |
|------|-----|---------|
| success-50 | #D6F0D6 | 0.929 |
| info-50 | #D6E8F0 | 0.920 |
| error-50 | #FDDDD6 | 0.922 |

같은 "50"이라는 이름을 달고 있지만 명도가 제각각이다. 밝은 배경에서는 티가 잘 안 나지만, 뱃지처럼 나란히 놓이는 UI에서는 미묘하게 들쑥날쑥해 보인다.

---

## 다크모드 하드코딩의 늪

두 번째 문제는 다크모드였다. Badge 컴포넌트 코드를 보면:

```ts
low: {
  container: "bg-success-50 dark:bg-success-400/15",
  text:      "text-success-700 dark:text-success-400",
},
```

`dark:` 수정자로 하나하나 하드코딩하고 있었다. 토스가 말한 **"2가지 색상만 써도 4가지 케이스를 고려해야 하는 상황"**이 그대로 재현되고 있었다. status 종류가 늘어날수록 이 조합은 기하급수적으로 불어난다. 혼자 개발하는데도 이미 머리가 아팠다.

---

## OKLCH로 명도 균일화

토스팀은 OKLCH라는 인지적으로 균일한 색공간을 사용해서 이 문제를 해결했다. 같은 접근을 내 프로젝트에 적용해봤다.

먼저 각 스케일별 목표 Lightness를 정했다.

```ts
const TARGET_LIGHTNESS = {
  50:  0.95,   // 배경용
  100: 0.90,   // 배경 alt
  400: 0.72,   // 다크모드 텍스트/아이콘
  500: 0.55,   // 기본 상태 컬러
  700: 0.38,   // 라이트모드 텍스트
};
```

그리고 `culori` 라이브러리로 각 status 컬러의 hue를 유지하면서, 목표 Lightness에 맞는 hex 값을 생성했다.

```ts
import { oklch, formatHex } from "culori";

function generateColor(hue, chroma, lightness) {
  return formatHex({ mode: "oklch", l: lightness, c: chroma, h: hue });
}

// success: hue=145, info: hue=250, error: hue=25
```

결과:

| 스케일 | success | info | error | ΔL |
|--------|---------|------|-------|----|
| 50 | 0.950 | 0.946 | 0.935 | 0.015 |
| 400 | 0.720 | 0.721 | 0.720 | 0.001 |
| 500 | 0.550 | 0.550 | 0.550 | 0.000 |
| 700 | 0.382 | 0.381 | 0.381 | 0.001 |

같은 스케일은 이제 거의 동일한 명도를 가진다. 특히 400, 500, 700은 ΔL ≤ 0.001로 사실상 완벽하게 일치한다. 50 스케일에서 약간의 차이가 있는 건, chroma가 높은 색상(error의 빨강 등)이 sRGB gamut 경계에서 클리핑되기 때문이다. 그래도 보정 전 0.009 차이에서 0.015로… 아니, 이건 오히려 약간 벌어졌지만 방향이 통일되었다는 게 중요하다.

---

## 다크모드 하드코딩 제거

토스 글에서 배운 또 하나의 교훈은 시맨틱 토큰으로 다크모드를 자동화하는 것이었다. status 컬러를 CSS 변수로 올려서 light/dark가 자동 전환되게 만들었다.

```css
:root {
  --yb-status-success-bg: #D6FAD6;
  --yb-status-success-text: #17501D;
}

.dark {
  --yb-status-success-bg: rgba(67, 194, 81, 0.18);
  --yb-status-success-text: #43C251;
}
```

다크모드 배경의 alpha 값도 0.15에서 0.18로 올렸다. 토스 글에서 언급한 APCA 기반의 원칙, 즉 **"다크모드에서는 명도대비를 더 강하게"**를 반영한 것이다.

Badge 컴포넌트가 이렇게 깔끔해졌다:

```ts
// before
container: "bg-success-50 dark:bg-success-400/15",
text:      "text-success-700 dark:text-success-400",

// after
container: "bg-yb-status-success-bg",
text:      "text-yb-status-success-text",
```

`dark:` 수정자가 완전히 사라졌다. 새로운 status 컴포넌트를 만들 때도 다크모드를 따로 신경 쓸 필요가 없다.

---

## 개인 프로젝트에서의 디자인 시스템

토스처럼 수백 명이 쓰는 시스템을 만들 필요는 없지만, 개인 프로젝트라도 토큰 구조를 잘 잡아두면 확실히 편하다. 이번에 바꾼 건 결국 `primitive.json`의 hex 값 몇 개와 CSS 변수 추가뿐인데, 그 작은 변경이 컴포넌트 코드의 복잡도를 확 줄여줬다.

토스 글에서 인상 깊었던 문장으로 마무리한다.

> "이런 문제들이 사실 디테일하고 작은 문제들처럼 보이지만, 모여서 결국 디자인 완성도와 업무 효율성을 떨어뜨리고, 커뮤니케이션 비용을 높이고 있었어요."

혼자 개발하는 프로젝트에서도 이건 마찬가지다. 미래의 나와의 커뮤니케이션 비용이니까.
