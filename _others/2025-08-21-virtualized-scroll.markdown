---
layout: post
title: "가상화 스크롤 도입기"
date: 2025-08-21 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/%EA%B0%80%EC%83%81%ED%99%94%EC%8A%A4%ED%81%AC%EB%A1%A4-%EB%8F%84%EC%9E%85%EA%B8%B0

---

## 문제 상황

300개 이상의 카드 데이터가 한 번에 렌더링되면서 성능 저하가 났다.  
처음에는 이미지 쪽을 의심해 lazy, preload, LCP 최적화를 시도했지만 해결되지 않았다.  
그래서 대량 렌더링에 쓰는 방법 중 하나인 가상화 스크롤을 도입해보기로 했다.

---

## 과정

### 가상화 스크롤이란?

대량의 리스트를 보여줄 때, 현재 화면(Viewport)에 보이는 항목만 실제 DOM으로 렌더링하고, 나머지는 렌더링하지 않는 방식이다.  
불필요한 DOM 생성과 메모리 사용을 줄여서 대용량 데이터에서 렌더링 성능을 크게 올릴 수 있다.

### 가상화 스크롤 라이브러리 비교

| 라이브러리 | 특징 |
|------------|------|
| react-window | 성능은 좋지만 고정 높이만 지원해 유연성이 떨어짐 |
| react-virtual | `useWindowScroll` 미지원이라 기존 구조와 맞지 않음 |
| react-virtuoso | 리스트/그리드, 무한 스크롤, window 기반 스크롤까지 지원 |

→ react-virtuoso를 사용하기로 했다.

### Virtuoso를 활용한 가상화 스크롤

```tsx
// 무한 스크롤 로직
const [isFetching, setIsFetching] = useState(false);
// 요소의 절반이 보이면 무한 스크롤 트리거
const { ref: observerRef, inView } = useInView({ threshold: 0.5 });
```

```tsx
useEffect(() => {
  if (inView && hasMore && !isFetching) {
    setIsFetching(true);
    onInView();
  }
}, [inView, hasMore, isFetching, onInView]);
```

```tsx
// 데이터 업데이트 시 로딩 상태 초기화
useEffect(() => {
  if (list) {
    setIsFetching(false);
  }
}, [list]);
```

{% raw %}
```tsx
return (
  <>
    <VirtuosoGrid
      totalCount={list.length}
      useWindowScroll
      computeItemKey={(index) => index}
      components={{
        List: forwardRef<HTMLDivElement>((props, ref) => (
          <div {...props} ref={ref} className="grid ..." />
        )),
        Item: forwardRef<HTMLDivElement>((props, ref) => (
          <div {...props} ref={ref} />
        )),
      }}
      itemContent={(index) => item(list[index], index)}
    />
    {hasMore ? <div ref={observerRef} className="h-10 w-full" /> : null}
  </>
);
```
{% endraw %}

- ref를 쓰는 이유: 무한 스크롤이 언제 일어나는지를 알아야 하지만, 그 값이 화면에 그대로 보일 필요는 없다. [useRef](/others/2025-08-20-useref/)처럼 “기억만 하면 되는 값”이므로, `forwardRef`로 DOM 노드를 넘겨 관찰 시점만 전달하는 용도로 쓴다고 보면 된다.

### 가상화에서 이전 데이터는 어떻게 될까?

스크롤을 내려서 `id=7`이 보였다가 `id=100107`로 이동하면, 이전 데이터(0~7)는 사라질까?

- DOM 레벨: react-virtuoso는 뷰포트 근처에 있는 항목만 DOM으로 두고, 나머지는 언마운트한다. 그래서 브라우저 메모리와 렌더 부담이 줄어든다.
- 데이터 레벨: 실제 리스트 데이터는 React Query 캐시 등에 그대로 있다. 0~7번 데이터는 삭제되지 않고 유지된다.
- 스크롤 복귀 시: 다시 위로 스크롤하면 virtuoso가 해당 인덱스를 보고 DOM을 다시 마운트하고, 기존 데이터 배열로 렌더링한다. `gcTime`이 지나지 않았다면 네트워크 재요청은 없다.

정리하면, DOM만 최소화하고 데이터는 유지하는 방식이다.

---

## 결과

스크롤할 때마다 뷰포트 기준으로 실제 렌더되는 개수만 바뀐다.

![가상화 스크롤 – 뷰포트별 렌더 개수](/assets/img/46.png)

![성능 지표 비교](/assets/img/47.png)

### 성능 변화

- Performance Score: 46 → 86 (+40점, 약 87% 상승)
- FCP: 0.9s → 0.8s (약 11% 감소)
- LCP: 5.0s → 4.4s (약 12% 감소)
- TBT: 6,140ms → 570ms (약 91% 감소)
- Speed Index: 6.1s → 3.1s (약 49% 감소)
