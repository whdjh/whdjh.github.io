---
layout: post
title: "서브셋폰트 도입기"
date: 2024-12-30 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/%EC%84%9C%EB%B8%8C%EC%85%8B%ED%8F%B0%ED%8A%B8-%EB%8F%84%EC%9E%85%EA%B8%B0

# 문제상황

서비스 초기 페이지에서 첫 화면 출력이 지연되고, 텍스트가 늦게 표시되거나 깜빡이는 현상(FOIT/FOUT)이 발생했다.
원인을 확인해보니, 웹폰트 로딩 지연이 주요 원인이었다.

# 웹 폰트란?

- 웹 폰트는 사용자가 폰트를 설치하지 않아도 디자이너가 원하는 타이포그래피를 웹 페이지에 구현할 수 있게 하는 기술
- 웹 폰트는 폰트 파일을 서버에서 다운로드하여 사용하는 방식으로 동작하고, 여러 가지 형식이 존재한다.
- 용량 순서대로 EOT > TTF/OTF > WOFF > WOFF2
- 운영 체제에서 사용하는 TTF 또는 OTF 형식의 폰트는 파일 크기가 매우 커서 웹 환경에선 적절하지 않은데, 그래서 나온 것이 WOFF 형식의 폰트
- WOFF(Web Open Font Format)는 이름 그대로 웹을 위한 폰트이고 TTF 폰트를 압축하여 웹에서 더욱 빠르게 로드
- WOFF2는 WOFF의 개선 버전으로, 압축 알고리즘이 개선되었고 WOFF2 형식으로 폰트를 가져오면 더 적은 용량으로 폰트를 사용

## 웹 폰트 용량을 줄여야하는 이유

- 용량이 불필요하게 높은 웹 폰트는 FOIT, FOUT 현상으로 기획/디자이너/개발자가 의도한 화면을 제대로 보기X
- 사용자가 웹 사이트에 접속했을 때 텍스트가 보이는 시점에 폰트 다운로드가 완료되지 않았다면 텍스트가 보이지 않거나(FOIT) 기본 폰트로 보이다가(FOUT) 의도한 화면이 보이면서 텍스트가 변한다고 한다.
- 또한 필요하지않은 용량만큼의 폰트를 다운로드하므로 비용적인 측면에서도 문제를 발생할 수도 있다고 한다.
- 따라서 나는 다이나믹 서브셋을 이번 프로젝트에서 적용했고, 그 과정과 결과에 대해 포스팅할 예정이다.

## 서브셋 폰트

- 서브셋(subset) 폰트는 전체 폰트 중 필요한 문자만 선택하여 사용
- 서브셋 폰트를 사용하면, 필요한 문자만 포함된 폰트 파일을 다운로드하기 때문에 전체 폰트를 다운로드하는 것보다 더 적은 용량으로 폰트를 사용할 수 있고 로딩 속도도 더 빠르다.

![서브셋 폰트 설명 이미지](/assets/img/1.png)

출처 : https://d2.naver.com/helloworld/4969726

- 저렇게 형광색으로 표시한 글자들은 일상에서 거의 사용하지 않는 글자들인데 이것들을 제외해서 구성해 용량을 줄이고 폰트 효과적으로 사용할 수 있다.

# 과정

## 폰트 다운로드

- https://cactus.tistory.com/306?fbclid=IwAR3KcWXEy7qzM0oykZFgY58eUebI3Qcwnl1SJ2IZQdCLQewxX6S-3auKYsM 이 페이지에 접속해서 "글꼴 다운로드"를 클릭한다.
- 다운로드 받은 폴더를 들어가면 web -> static -> woff-subset, woff2-subset이라는 폴더의 파일을 활용하도록 한다.
- WOFF는 더 넓은 호환성을 가진 표준 파일 형식
- WOFF2는 WOFF보다 더 작은 파일 크기를 제공하는 새로운 형식
- 여기서 우리가 진행한 프로젝트에서는 다음과 같이 구성했다.

![프로젝트 폰트 구성](/assets/img/2.png)

## fonts.css

```css
@font-face {
  font-family: 'Pretendard';
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src:
    url('./fonts/Pretendard-Bold.subset.woff2') format('woff2'),
    url('./fonts/Pretendard-Bold.subset.woff') format('woff');
}

@font-face {
  font-family: 'Pretendard';
  font-weight: 600;
  font-style: normal;
  font-display: swap;
  src:
    url('./fonts/Pretendard-SemiBold.subset.woff2') format('woff2'),
    url('./fonts/Pretendard-SemiBold.subset.woff') format('woff');
}
@font-face {
  font-family: 'Pretendard';
  font-weight: 500;
  font-style: normal;
  font-display: swap;
  src:
    url('./fonts/Pretendard-Medium.subset.woff2') format('woff2'),
    url('./fonts/Pretendard-Medium.subset.woff') format('woff');
}

@font-face {
  font-family: 'Pretendard';
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src:
    url('./fonts/Pretendard-Regular.subset.woff2') format('woff2'),
    url('./fonts/Pretendard-Regular.subset.woff') format('woff');
}
```

정리하자면,

- font-family: 폰트의 이름을 지정
- font-weight: 폰트의 굵기를 지정
- font-style: 폰트의 스타일을 지정(normal, italic 등)
- font-display: 폰트가 로딩되기 전까지 사용할 fallback 폰트를 지정
- src: 폰트 파일의 경로를 지정
- 여기선 쉼표(,)로 구분하여 woff, woff2 둘 다 지정하고 있는데, 브라우저는 이해하는 첫 번째 목록부터 불러오려고 하므로 woff2 > woff 순서로 불러오도록 시도한다.

## 적용하기

- 나는 next.js를 사용하려고 _app.tsx 파일에 import하여 사용했다.

```ts
import '@/styles/fonts.css';
```

# 결과

![서브셋 폰트 적용 결과](/assets/img/3.png)

# 깨달은 점

- 웹폰트처럼 리소스 자체의 크기와 로딩 전략을 함께 최적화해야 진짜 개선이 가능하다.
- "빠른 초기 렌더링"은 기술 선택(SSR/CSR)보다도 리소스 경량화 + 브라우저 렌더링 전략에 크게 좌우된다.
