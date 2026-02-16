---
layout: post
title: "Tailwind 도입기"
date: 2025-07-21 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/Tailwind-%EB%8F%84%EC%9E%85%EA%B8%B0

---

## 왜 공부하게 되었나

프로젝트를 진행하면서 **CSS를 직접 작성하고 클래스명을 관리하는 것**이 번거롭다고 느꼈다.  
특히 **반응형 디자인**과 **재사용 가능한 컴포넌트 스타일링**을 구현할 때 시간이 많이 소요되었다.  
그래서 Tailwind CSS를 사용하면 개발 생산성을 높이고, 유지보수를 쉽게 할 수 있겠다고 생각하게 되었다.

---

## 문제 상황

- **CSS 파일과 클래스명**을 직접 관리하느라 코드가 길어지고 유지보수가 어렵다.
- **반응형 디자인**을 적용할 때 미디어쿼리를 여러 곳에 작성해야 해서 관리가 복잡하다.
- **UI 재사용성**을 확보하려면 컴포넌트 단위로 스타일을 관리해야 하는데, 기존 CSS 방식으로는 쉽지 않다.

---

## 공부한 내용

### 1. 생산성 향상

기존에는 마크업과 CSS를 분리해서 작성하고, 클래스명을 직접 짓고 관리해야 했다.

```tsx
{/* 기존 CSS 방식 */}
<div className="card">
  <div className="card-content">
    <h2 className="card-title">사용자 프로필</h2>
    <p className="card-description">안녕하세요! 반갑습니다.</p>
  </div>
</div>
```

```css
.card {
  width: 300px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.card-content {
  padding: 16px;
}
.card-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
}
.card-description {
  color: #666;
  margin-bottom: 16px;
}
```

Tailwind CSS는 **미리 정의된 유틸리티 클래스**를 사용해, CSS 파일과 클래스명 고민을 줄인다.

```tsx
<div className="w-64 sm:w-96 rounded-lg bg-white shadow-md p-4">
  <h2 className="text-xl font-bold mb-2">사용자 프로필</h2>
  <p className="text-gray-600 mb-4">안녕하세요! 반갑습니다.</p>
</div>
```

---

### 2. 반응형 디자인

기존에는 미디어쿼리를 여러 번 작성해야 했다.

```css
.card {
  width: 300px;
}
@media (min-width: 768px) {
  .card {
    width: 500px;
  }
}
@media (min-width: 1024px) {
  .card {
    width: 800px;
  }
}
```

Tailwind는 **`sm:`, `md:`, `lg:`** 같은 프리픽스로 반응형 스타일을 직관적으로 적용할 수 있다.

```tsx
<div className="w-64 sm:w-96 md:w-128 lg:w-192 p-4">
  내용
</div>
```

---

### 3. 재사용과 유지보수

컴포넌트 단위로 스타일을 관리할 수 있고, **디자인 시스템**을 일관되게 적용할 수 있다.

```tsx
export default function Button({ children }: { children: React.ReactNode }) {
  return (
    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
      {children}
    </button>
  );
}
```

---

### 4. 번들 최적화

**JIT(Just-In-Time) 컴파일러** 덕분에 **실제 사용한 클래스만** 빌드에 포함된다.  
빌드 속도가 빠르고, 최종 CSS 파일 크기도 작아진다.

---

## 결과

- CSS 작성과 클래스명 관리에 드는 **시간을 줄일 수 있다.**
- **반응형 UI**와 **컴포넌트 재사용**이 쉬워져 **유지보수가 용이**해졌다.
- 프로젝트에 맞는 **디자인 시스템**을 쉽게 구축할 수 있고, **불필요한 코드 없이 번들을 최적화**할 수 있다.
