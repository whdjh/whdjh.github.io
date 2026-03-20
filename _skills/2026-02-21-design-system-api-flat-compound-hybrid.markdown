---
layout: post
title: "디자인 시스템 컴포넌트 API 설계: Flat, Compound, 그리고 Hybrid"
date: 2026-02-21 00:00:00 +0900
categories: dev
---

디자인 시스템 프로젝트를 시작하기 전에, "좋은 디자인 시스템이란 뭘까"부터 정리하고 싶었다. 여러 아티클을 읽던 중 토스 디자인 시스템(TDS) 팀의 글이 인상 깊었다. 직접 MUI나 shadcn을 사용하면서 느꼈던 불편함이 글 속 사례와 정확히 겹쳤기 때문이다.

이 글은 TDS 아티클의 핵심 내용을 정리하면서, 내 경험과 앞으로의 프로젝트에 어떻게 적용할 수 있을지 생각을 붙여본 기록이다.

---

## 정해진 디자인 시스템의 한계

MUI를 쓰다 보면 이런 상황을 자주 만난다.

> "이 버튼에 아이콘이랑 뱃지를 같이 넣고 싶은데, props로 안 되네?"

처음에는 문서를 뒤져본다. 원하는 prop이 없으면 `sx`로 스타일을 덮어쓰거나, `styled()`로 감싸서 새 컴포넌트를 만들게 된다. 결국 디자인 시스템 위에 또 다른 레이어를 쌓는 셈이다.

TDS 아티클에서는 이런 현상을 **"시스템의 우회"**라고 부른다. Figma에서 컴포넌트를 detach하거나, 코드에서 패키지를 fork하는 것. 그리고 이건 사용자의 잘못이 아니라, 시스템이 수요를 충족하지 못하고 있다는 신호라고 말한다.

이 관점이 인상 깊었다. 디자인 시스템은 규칙을 강제하는 도구가 아니라, 팀이 제품 문제를 풀 수 있게 도와주는 **제품**이라는 시각. 수요가 있는데 공급이 안 되면 사용자는 알아서 해결한다. 우회를 막을 게 아니라, 우회할 이유를 줄여야 한다.

---

## Flat, Compound, 그리고 Hybrid

그렇다면 컴포넌트 API를 어떻게 설계해야 우회를 줄일 수 있을까? TDS 아티클에서는 두 가지 패턴과 그 조합을 제안한다.

### Flat 패턴: 간결함이 무기인 경우

Flat 컴포넌트는 내부 구조를 감추고, 모든 변형을 props로 제공하는 방식이다.

```tsx
<Card
  title="월간 리포트"
  description="이번 달 요약을 확인하세요"
  actionLabel="다운로드"
  onActionClick={download}
/>
```

사용법이 직관적이고, 컴포넌트의 내부 구조를 몰라도 된다. **Button, Badge, Tag**처럼 변형이 적고 반복적으로 쓰이는 컴포넌트에 적합하다.

하지만 한계가 명확하다. 시스템이 예상하지 못한 요구가 생기면 props가 끝없이 늘어난다.

- `actionLabel`을 hover 했을 때 콜백을 넘기고 싶다면? → `onActionHover` 추가
- button 대신 anchor로 바꾸고 싶다면? → `actionAs` 추가
- 액션 옆에 뱃지를 넣고 싶다면? → `actionBadge` 추가

props 하나가 늘어날 때마다 컴포넌트의 복잡도가 올라가고, 결국 MUI의 API 문서처럼 끝없는 props 목록이 만들어진다.

### Compound 패턴: 유연함이 필요한 경우

Compound 패턴은 하위 컴포넌트를 조합해서 사용자가 직접 구조를 만드는 방식이다.

```tsx
<Card>
  <Card.Header>
    <Card.Title>월간 리포트</Card.Title>
    <Badge>Beta</Badge>
    <Button onClick={download}>다운로드</Button>
  </Card.Header>

  <Card.Body>
    <ReportSummary />
  </Card.Body>

  <Card.Footer>
    <small>최근 업데이트: 1시간 전</small>
  </Card.Footer>
</Card>
```

시스템이 미리 예측하지 못한 레이아웃도 조합으로 해결할 수 있다. **Card, Dialog, Dropdown**처럼 내부 구조가 유동적이고 팀마다 다르게 써야 하는 컴포넌트에 적합하다.

하지만 Compound도 만능은 아니다. 단순히 title만 설정하면 되는 카드를 비교해보면 차이가 드러난다.

```tsx
// Flat: 이게 끝
<Card title="월간 리포트">
  <ReportSummary />
</Card>

// Compound: Header 안에 Title이 들어가야 하고, Body는 필수인가?
<Card>
  <Card.Header>
    <Card.Title>월간 리포트</Card.Title>
  </Card.Header>
  <Card.Body>
    <ReportSummary />
  </Card.Body>
</Card>
```

단순한 케이스에서는 오히려 보일러플레이트만 늘어나고, 개발자가 컴포넌트의 내부 구조를 학습해야 하는 비용이 생긴다.

### Hybrid 전략: 둘 다 제공하기

TDS가 택한 방식은 "어떤 패턴이 옳은가"가 아니라 **"둘 다 제공하자"**였다.

```tsx
import { Card as FlatCard } from "@tds/mobile/flat"
import { Card } from "@tds/mobile"

// 커스텀 불필요 → Flat
<FlatCard
  title="월간 리포트"
  description="이번 달 요약을 확인하세요"
  actionLabel="다운로드"
  onActionClick={download}
/>

// 커스텀 필요 → Compound
<Card>
  <Card.Header>
    <div style={{ color: 'red' }}>
      <Card.Title>월간 리포트</Card.Title>
      <Badge>Beta</Badge>
    </div>
    <Button onClick={download}>다운로드</Button>
  </Card.Header>
  <Card.Body>
    <ReportSummary />
  </Card.Body>
</Card>
```

핵심은 **API는 두 가지지만, 내부 구현은 하나**라는 점이다. Flat API는 Compound의 primitive를 미리 조립한 것에 불과하다.

```tsx
// Flat Card의 내부 구현
import { CardRoot, CardHeader, CardTitle, CardBody } from "@tds-primitive/mobile"

function Card({ title, children }: CardProps) {
  return (
    <CardRoot>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody>{children}</CardBody>
    </CardRoot>
  )
}
```

Flat API가 Compound의 primitive 위에 만들어지기 때문에, 유지보수는 primitive 한 벌만 하면 된다. 사용자 입장에서는 상황에 맞는 선택지가 생기고, 시스템 입장에서는 관리 부담이 크게 늘지 않는 구조다.

이 부분을 보면서 shadcn이 떠올랐다. shadcn은 컴포넌트 코드를 직접 프로젝트에 복사하는 방식이라, 기본적으로 Compound에 가깝다. 여기에 자주 쓰는 조합을 Flat처럼 미리 만들어두는 레이어를 얹으면, 사내 디자인 시스템에서도 비슷한 Hybrid 전략을 적용할 수 있지 않을까 생각한다.

---

## 마무리

이 글을 정리하면서 얻은 가장 큰 인사이트는, 디자인 시스템의 확장성은 결국 컴포넌트 API 설계에서 결정된다는 점이다.

아직 직접 만들어본 건 아니라서, 실제 프로젝트에서 Hybrid 전략이 얼마나 잘 동작하는지는 검증이 필요하다. primitive 레이어의 경계를 어디까지 잡을지, Flat으로 미리 조립하는 기준을 어떻게 세울지 같은 구체적인 문제는 만들면서 부딪혀봐야 알 것 같다.

만들어보면서 후속 글로 이어갈 예정이다.
