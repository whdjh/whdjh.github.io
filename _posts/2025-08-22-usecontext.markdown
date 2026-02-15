---
layout: post
title: "useContext"
date: 2025-08-22 00:00:00 +0900
categories: dev
---

**리액트 훅 시리즈** 여섯 번째 — `useContext`로 전역 데이터를 공유하는 방법을 정리한 글이다.

원본링크: https://velog.io/@wngns9807/useContext

---

## 왜 공부하게 되었나?

쇼핑몰 앱을 만들면서 **상품 목록 → 장바구니 → 결제** 흐름에서 **장바구니 상태**를 넘겨줘야 했다.  
처음에는 **props**로만 내려줬는데, 페이지와 기능이 늘어나면서 **props drilling**이 심해졌다.

---

## 문제 상황

```tsx
// ProductList.tsx
router.push({
  pathname: "/cart",
  params: {
    cartItems: JSON.stringify(currentCart),
  },
});
```

```tsx
// Cart.tsx
const { cartItems } = useLocalSearchParams();
// props로 내려받은 데이터를 계속 사용해야 함
```

- 필요한 데이터를 **페이지마다 props나 query param**으로 넘겨야 함
- 컴포넌트가 깊어질수록 **전달 코드**가 길어지고 가독성이 떨어짐
- 유지보수가 어려워지고, **데이터 누락** 위험이 생김

---

## 공부 내용

이 문제를 줄이기 위해 **React Context**와 공식 문서를 공부했다.[^1]

> Context를 쓰면 **전역 데이터**를 한 번에 공유할 수 있고, **중간 컴포넌트**에서 props를 반복해서 넘기지 않아도 된다.  
> 다만 **상태가 자주 바뀌거나** 구조가 복잡하면 **불필요한 리렌더**가 늘어날 수 있으니 주의해야 한다.

즉, **Props Drilling**을 줄이는 용도로 Context를 쓸 수 있고, **상태가 단순하거나** **글로벌한 데이터**에 잘 맞는다.  
Zustand·Redux 같은 전역 상태 라이브러리를 써도 되지만, 이번에는 **Context로 직접 구현**해 보면서 구조와 Props Drilling이 어떻게 사라지는지 경험해 보려고 했다.

### CartContext 예시

```tsx
// CartContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

interface CartContextType {
  cartItems: any[];
  addItem: (item: any) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<any[]>([]);

  const addItem = (item: any) => {
    setCartItems((prev) => [...prev, item]);
  };

  return (
    <CartContext.Provider value={{ cartItems, addItem }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
```

```tsx
// ProductList.tsx
const { addItem } = useCart();
addItem(product);
router.push("/cart");
```

```tsx
// Cart.tsx
const { cartItems } = useCart();
cartItems.map((item) => <div key={item.id}>{item.name}</div>);
```

---

## 결과

Context를 적용해 **장바구니 상태**를 전역에서 관리하게 했다.

- **페이지 간 props 전달 없이** 장바구니 접근 가능
- 코드가 짧아지고 **유지보수**가 수월해짐
- **Context를 구독하는 컴포넌트만** 리렌더되어, 성능 영향을 줄일 수 있음[^2]

이 포스트는 **리액트 훅 시리즈** 중 하나다. [useState 원리](/dev/2025-08-04-usestate-principle.html), [useEffect](/dev/2025-08-06-useeffect.html), [useReducer](/dev/2025-08-18-usereducer.html), [memo/useMemo/useCallback](/dev/2025-08-19-memo-usememo-usecallback.html), [useRef](/dev/2025-08-20-useref.html)에 이어 `useContext`를 정리했다.

---

[^1]: [React docs – useContext](https://react.dev/reference/react/useContext): *"useContext is a React Hook that lets you read and subscribe to context from your component."*
[^2]: Context value가 바뀔 때 해당 Context를 쓰는 컴포넌트만 리렌더된다. Provider를 잘 나누고, value를 메모이제이션하면 불필요한 리렌더를 더 줄일 수 있다.
