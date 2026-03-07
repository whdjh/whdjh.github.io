---
layout: post
title: "캘린더 컴포넌트 설계: Flat 패턴 vs Compound 패턴"
date: 2026-02-28 00:00:00 +0900
categories: dev
---

캘린더 컴포넌트를 만들면서 **Flat 패턴**과 **Compound 패턴** 사이에서 고민을 많이 했다.  
이전에 합성 컴포넌트 도입기를 쓸 때는 Compound 쪽이 무조건 정답처럼 느꼈는데, 캘린더를 직접 만들어 보니 생각이 달라졌다.

---

## 두 패턴의 차이

### Flat 패턴: "하나의 컴포넌트가 모든 것을 안다"

데이터와 렌더링 로직이 한 컴포넌트에 모여 있다. `dataSource`, `datetimeKey`, `labelKey` 같은 props를 받아서 내부에서 날짜별 매핑, 라벨 추출, 스타일 결정까지 전부 처리한다.

```tsx
<CommonCalendarView
  dataSource={holidays}
  datetimeKey="date"
  labelKey="name"
  labelClassName={(item) => item.isActive ? 'bg-red-200' : 'bg-gray-200'}
  onLabelClick={(item) => openModal(item)}
/>
```

사용하는 쪽에서는 **데이터만 넘기면 끝**이다. 내부 구현을 몰라도 된다.

### Compound 패턴: "컴포넌트는 데이터를 모른다"

컴포넌트가 데이터를 직접 알지 않고, 외부에서 조합해 주입한다.  
`Calendar.Root`, `Calendar.Day`, `Calendar.Label` 같은 슬롯으로 나누고, 각 슬롯이 순수하게 주입받은 데이터를 렌더링만 한다.

```tsx
<Calendar.Root month={currentMonth}>
  {days.map((day) => (
    <Calendar.Day key={day.date} date={day.date}>
      {day.labels.map((label) => (
        <Calendar.Label
          key={label.id}
          className={label.className}
          onClick={() => openModal(label)}
        >
          {label.name}
        </Calendar.Label>
      ))}
    </Calendar.Day>
  ))}
</Calendar.Root>
```

사용하는 쪽에서 **데이터 가공을 직접** 해야 한다. 대신 레이아웃을 자유롭게 바꿀 수 있다.

---

## 고민의 핵심: 컴포넌트 vs 위젯

이 고민을 계속 파고들다 보니 결국 **"이걸 컴포넌트로 볼 것이냐, 위젯으로 볼 것이냐"**의 문제였다.

### 컴포넌트 관점 (Compound)

- 데이터를 **몰라야** 한다.
- 주입받은 데이터를 **리턴하는 단순한 역할**만 한다.
- 재사용성과 유연성이 극대화된다.
- `Button`, `Card`, `Modal` 같은 **범용 UI 조각**에 적합하다.

### 위젯 관점 (Flat)

- 특정 도메인의 데이터 구조를 **알고 있다.**
- 데이터를 넘기면 **완성된 UI를 통째로** 내놓는다.
- 사용이 간편하고 일관성이 보장된다.
- `DatePicker`, `DataGrid`, `Chart` 같은 **특정 목적의 완성형 UI**에 적합하다.

---

## 캘린더에서 Flat을 선택한 이유

처음에는 Compound 패턴으로 갔다. 그런데 **문제가 금방 드러났다.**

### 1. 반복되는 보일러플레이트

캘린더를 사용하는 곳이 세 군데였는데, 세 군데 모두 "날짜별로 아이템 그룹핑 → 라벨 추출 → 스타일 결정 → 클릭 핸들러 연결"이라는 **동일한 데이터 가공 로직**을 작성하고 있었다.

```tsx
// A 페이지, B 페이지, C 페이지 전부 이런 코드가 반복됨
const itemsByDate = useMemo(() => {
  const map = new Map<string, Item[]>()
  dataSource.forEach((item) => {
    const key = formatDate(item.date)
    map.set(key, [...(map.get(key) || []), item])
  })
  return map
}, [dataSource])
```

Compound 패턴의 유연성이 오히려 **중복의 원인**이 됐다.

### 2. 캘린더의 렌더링 구조는 거의 바뀌지 않는다

캘린더는 **7열 × 4~6행의 격자**라는 구조가 고정되어 있다. Card처럼 "Header를 빼거나, Footer 위치를 바꾸거나" 할 일이 거의 없다. 바뀌는 건 각 날짜 칸 안에 들어가는 **라벨의 내용과 스타일** 정도인데, 이건 `labelKey`와 `labelClassName`으로 충분히 커버할 수 있다.

### 3. 제네릭으로 타입 안전성 확보

Flat 패턴의 단점 중 하나인 "데이터 구조를 모르니 타입이 느슨해진다"는 문제는 **제네릭**으로 해결했다.

```tsx
export type CommonCalendarViewProps<T = any> = {
  dataSource?: T[]
  datetimeKey?: keyof T
  labelKey?: keyof T | ((item: T) => string)
  labelClassName?: (item: T) => string | string
  onLabelClick?: (item: T | null) => void
}
```

`T`를 넘기면 `datetimeKey`와 `labelKey`에서 자동완성이 동작한다. 데이터를 알지만, **어떤 데이터든** 받을 수 있는 구조다.

---

## 내부 구현에서 신경 쓴 점

### Key 설정 중앙화

나중에 key가 추가될 때 수정 포인트를 줄이기 위해 `keyConfig` 객체로 묶었다.

```tsx
const keyConfig = useMemo(
  () => ({
    datetime: datetimeKey,
    label: labelKey,
  }),
  [datetimeKey, labelKey]
)
```

### labelKey의 이중 인터페이스

단순한 경우에는 key 이름만 넘기고, 복잡한 경우에는 함수를 넘길 수 있다.

```tsx
// 단순: 필드명만 지정
<CommonCalendarView labelKey="title" />

// 복잡: 가공 로직 주입
<CommonCalendarView labelKey={(item) => `${item.title} (${item.count}건)`} />
```

### 하위 호환성

`activeHolidayDates`를 직접 넘기는 기존 방식도 유지하면서, `dataSource`에서 자동 추출하는 새 방식도 지원한다.

```tsx
const activeHolidayDates = useMemo(() => {
  if (propActiveHolidayDates) return propActiveHolidayDates
  if (!dataSource || !keyConfig.datetime) return []
  return dataSource
    .filter((item) => (item as Record<string, unknown>).isActive === true)
    .map(getDateFromItem)
    .filter((date): date is Date => date !== null)
}, [propActiveHolidayDates, dataSource, keyConfig, getDateFromItem])
```

---

## 결론: 패턴은 도구이지 정답이 아니다

| 기준 | Compound 패턴 | Flat 패턴 |
|------|--------------|----------|
| **유연성** | 높음 (레이아웃 자유) | 낮음 (내부 구조 고정) |
| **사용 편의** | 낮음 (보일러플레이트) | 높음 (데이터만 넘기면 끝) |
| **재사용성** | 범용 UI에 적합 | 특정 도메인에 적합 |
| **일관성** | 사용처마다 다를 수 있음 | 어디서나 동일한 UI |
| **학습 비용** | 높음 (슬롯 구조 이해 필요) | 낮음 (Props만 보면 됨) |

Compound 패턴이 더 "올바른" 설계라는 인식이 있었는데, 캘린더를 만들면서 **상황에 맞는 패턴 선택**이 더 중요하다는 걸 체감했다.

- 구조가 자주 바뀌는 **범용 UI** → Compound
- 구조가 고정된 **도메인 위젯** → Flat

결국 "컴포넌트는 데이터를 몰라야 한다"는 원칙도, 그 컴포넌트가 **어떤 추상화 수준**에 있느냐에 따라 달라지는 것이다.
