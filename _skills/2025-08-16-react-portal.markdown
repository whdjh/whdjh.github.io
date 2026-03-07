---
layout: post
title: "React Portal 도입기"
date: 2025-08-16 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/React-Portal-%EB%8F%84%EC%9E%85%EA%B8%B0

---

## 문제 상황

부모 컴포넌트에 `overflow: hidden`이 있으면, 그 **안에 렌더링된 모달**은 화면 밖으로 나간 부분이 **잘린다**.  
또 부모의 **z-index**가 모달보다 높거나 낮으면, 모달이 다른 UI 뒤에 가려지거나 반대로 덮어버리는 현상이 생긴다.

이렇게 **부모 안에서** 모달을 렌더링하면 CSS 충돌을 완전히 피하기 어렵고, 모달의 **시각적·구조적 안정성**을 보장하기 힘들다.

---

## React Portal이란?

**React Portal**은 컴포넌트를 **현재 DOM 계층이 아닌 다른 DOM 노드**에 렌더링할 수 있게 해주는 React 기능이다.  
즉, 모달 같은 UI를 **부모 구조와 분리된 별도 DOM 노드**(예: `modal-root`)에 직접 그릴 수 있다.

> **사용 시 이점**
> - 부모의 CSS 영향을 받지 않고 **독립적으로** UI 표시
> - DOM 계층이 분리되어 **구조적으로 안정적**
> - **z-index** 충돌·가려짐 문제 완화

---

## 과정

### 1. `createPortal`로 DOM 계층 분리하기

`createPortal`을 쓰면 컴포넌트를 **현재 DOM 트리와 다른 위치**에 렌더링할 수 있다.  
모달처럼 레이아웃 계층에 영향을 주지 않고, **독립된 노드**에 그릴 수 있다.

```tsx
return createPortal(
  modalContent,
  document.getElementById("modal-root") as HTMLElement
);
```

### 2. 모달 전용 DOM 영역 만들기

모달이 렌더링될 **별도 DOM 영역**을 준비한다.  
레이아웃과 분리된 **전용 공간**에만 모달이 나가도록 한다.

```tsx
<div id="modal-root">
  <Providers>
    <Layout>{children}</Layout>
  </Providers>
</div>
```

---

## 결과

![Portal 적용 후 모달 렌더링](/assets/img/45.png)

모달이 `modal-root`에 포탈로 렌더링되어, 부모의 `overflow`·`z-index` 영향 없이 화면 위에 안정적으로 표시된다.
