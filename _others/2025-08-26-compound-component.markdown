---
layout: post
title: "합성 컴포넌트 도입기"
date: 2025-08-26 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/%ED%95%A9%EC%84%B1-%EC%BB%B4%ED%8F%AC%EB%84%8C%ED%8A%B8-%EB%8F%84%EC%9E%85%EA%B8%B0

---

## 문제 상황

UI 라이브러리나 디자인 시스템을 만들 때 Card 컴포넌트에서 자주 막힌다.  
카드 하나만 있으면 괜찮은데, header, footer, actions, media, variant, size 같은 옵션이 늘어나면 Props Explosion이 생긴다.

조건 분기가 많아져 코드가 복잡해지고, 어떤 props 조합이 가능한지 헷갈려 사용성이 떨어지거나, 레이아웃을 조금만 바꿔도 Card 컴포넌트 자체를 수정해야 하는 문제가 생겼다.

---

## 합성 컴포넌트란?

부모가 맥락(Context)과 레이아웃 규칙을 주고, 자식들이 필요한 부분만 조합해 하나의 UI를 만드는 패턴이다.  
즉, Card에 모든 옵션을 props로 넣는 대신, Card.Header, Card.Body, Card.Footer처럼 슬롯 단위로 나누어 합성한다.

장점

1. Props 폭발 방지: 작은 단위로 나누어 직관적으로 사용
2. 유연성: 필요한 슬롯만 가져다 쓰면 됨
3. 일관성: variant, size 같은 전역 토큰은 Context로 공유
4. 확장 용이: Card.Media, Card.Actions 같은 새 슬롯 추가가 쉬움

단점

1. 합성 패턴을 팀 전체가 이해해야 함

---

## 과정

### Card.tsx 생성

슬롯을 TitleBlock, Thumbnail 등으로 나누어 Card 객체에 붙인다.

```tsx
import { TitleBlock } from "./TitleBlock";
import { Thumbnail } from "./Thumbnail";

export const Card = {
  TitleBlock,
  Thumbnail,
};
```

### TitleBlock.tsx 생성

작성자·장소 정보를 보여주는 슬롯이다.

```tsx
export const TitleBlock = ({ author, location }: TitleBlockProps) => {
  return (
    <div>
      <p className="text-lg font-semibold mb-2">{author}</p>
      <p className="text-sm">{location}</p>
    </div>
  );
};
```

### Thumbnail.tsx 생성

이미지를 보여주는 슬롯이다.

```tsx
export const Thumbnail = ({ thumbnail, alt, isFirst }: ThumbnailProps) => {
  return (
    <Image
      src={thumbnail}
      alt={alt}
      loading={isFirst ? "eager" : "lazy"}
      width={343}
      height={200}
      className="h-full w-full object-cover"
    />
  );
};
```

---

## 결과

![합성 컴포넌트 적용 후 카드 조합](/assets/img/48.png)

- 코드 가독성이 좋아짐
- 조합식 사용으로 문서화 비용이 줄어듦
- 디자이너와 “카드 구성요소 단위”로 소통하기 쉬워짐
