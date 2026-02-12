---
layout: post
title: "Token을 웹스토리지에 저장한다고?? (쿠키, 메모리 도입기)"
date: 2025-03-11 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/Token%EC%9D%84-%EC%9B%B9%EC%8A%A4%ED%86%A0%EB%A6%AC%EC%A7%80%EC%97%90-%EC%A0%80%EC%9E%A5%ED%95%9C%EB%8B%A4%EA%B3%A0%EC%BF%A0%ED%82%A4-%EB%A9%94%EB%AA%A8%EB%A6%AC-%EB%8F%84%EC%9E%85%EA%B8%B0

---

## 문제 상황

부트캠프에서 제시한 요구사항에 따라 처음에는 **Access Token과 Refresh Token을 모두 `sessionStorage`에 저장**했다.  
하지만 이 방식은 보안적으로 여러 문제를 야기했다.

- **XSS 취약**: `sessionStorage`와 `localStorage`는 모두 자바스크립트로 접근 가능하므로, 악성 스크립트 삽입(XSS)에 의해 토큰이 유출될 수 있다.
- **CSRF 취약**: 토큰을 쿠키에 그대로 저장할 경우, 별도 대비가 없으면 CSRF 공격에 그대로 노출된다.
- **사용성 저하**: 새로고침 시 세션 정보가 초기화되거나 재로그인이 필요해 UX가 떨어진다.

즉, **보안도 취약하고 사용자 경험도 만족스럽지 못한 방식**이었다.

---

## 개선 과정

### 1) 토큰 저장소 선택 기준 정리

1. **쿠키**
   - 서버와 자동으로 동기화되지만 **CSRF에 취약**하다.
   - `HttpOnly`, `SameSite` 속성으로 어느 정도 보완 가능하다.
2. **localStorage / sessionStorage**
   - JS에서 자유롭게 접근 가능 → **XSS 공격에 취약**하다.
3. **메모리 변수(로컬 변수)**
   - 새로고침 시 초기화되지만, 값 자체는 JS 코드 내부에서만 관리한다.
   - **XSS 공격에 상대적으로 유리**하고, 브라우저에 직접 남지 않는다.

### XSS (Cross Site Scripting)

- 악의적인 사용자가 웹 페이지에 **악성 스크립트**를 삽입할 수 있는 취약점.
- XSS 공격에 성공하면 해커는 **임의의 자바스크립트를 실행**할 수 있다.
- JS 코드로 접근 가능한 **쿠키, 로컬스토리지, 세션스토리지**는 XSS 공격에 취약하다.
- 다만 쿠키의 경우 `HttpOnly` 속성을 추가하면 자바스크립트로 접근할 수 없다.
- 따라서 XSS를 방어하기 위해 토큰은 **`HttpOnly` 쿠키** 혹은 **메모리에 저장된 로컬 변수** 중 한 곳에 저장하는 편이 안전하다.

### CSRF (Cross Site Request Forgery, 사이트 간 요청 위조)

- 사용자가 자신의 의지와는 무관하게, 공격자가 의도한 행위(수정, 삭제, 등록 등)를 특정 웹사이트에 요청하게 만드는 공격.
- 쿠키는 브라우저가 자동으로 붙이기 때문에 **CSRF 공격에 취약**하다.
- CSRF는 **사용자의 브라우저를 통해 요청을 보내는 공격**이라, 요청에 쿠키가 함께 전달된다.
- 서버 입장에서는 이것이 실제 사용자의 요청인지, 공격자가 유도한 요청인지 알기 어렵다.

### 결론: 역할 분리

1. **Access Token은 메모리에 저장**
2. **Refresh Token은 쿠키에 저장**

클라이언트는 Access Token을 **메모리 로컬 변수**에만 두고 사용한다.  
만약 Access Token이 만료되거나 사라지면, **쿠키에 있는 Refresh Token**을 통해 Access Token을 재발급 받는다.  
이렇게 하면 **XSS와 CSRF 위험을 모두 줄이는 것**을 목표로 할 수 있다.

---

## 코드 변경

### 1) `useAuthStore.tsx`

- **기존**: `sessionStorage`에 Access Token과 Refresh Token 모두 저장
- **개선**: Access Token은 **메모리에만 유지**, Refresh Token은 **`HttpOnly` + `SameSite=strict` 쿠키**에 저장

```tsx
// 기존 코드 예시
import Cookies from 'js-cookie';

export const useAuthStore = create<AuthState>(set => {
  return {
    accessToken: null,
    setLogin: (accessToken, refreshToken) => {
      if (typeof window !== 'undefined') {
        // refreshToken을 쿠키에 저장
        Cookies.set('refreshToken', refreshToken, { secure: true, sameSite: 'strict' });
      }
      set({ accessToken });
    },
    setLogout: () => {
      if (typeof window !== 'undefined') {
        Cookies.remove('refreshToken');
      }
      set({ accessToken: null });
    },
  };
});
```

> 실제 서비스에서는 Refresh Token을 **`HttpOnly` 쿠키**로 설정하는 작업은 **백엔드**에서 처리하며,  
> 프론트에서는 토큰 값을 직접 다루지 않고 쿠키 기반으로만 동작하게 만드는 것이 이상적이다.

---

### 2) `intercepter.tsx`

- **기존**: `sessionStorage`에서 토큰을 직접 꺼내 사용
- **개선**: Access Token은 **메모리에서 가져오고**, Refresh Token은 **쿠키에서 읽어 자동 재발급**

```tsx
INSTANCE_URL.interceptors.response.use(
  (response) => response,
  async (error) => {
    const refreshToken = Cookies.get('refreshToken');
    const { setLogin, setLogout } = useAuthStore.getState();

    if (refreshToken) {
      try {
        const refreshedData = await postTokens(refreshToken);
        setLogin(refreshedData.accessToken, refreshedData.refreshToken);
        return INSTANCE_URL(error.config);
      } catch (e) {
        console.error('Refresh token 오류:', e);
        setLogout();
      }
    } else {
      console.log('refresh token 없음');
      setLogout();
    }
    return Promise.reject(error);
  }
);
```

---

### 3) 새로고침 대응 (`layout.tsx`)

Access Token은 메모리에만 있기 때문에, **새로고침 시 메모리가 초기화**되면 토큰도 사라진다.  
이를 보완하기 위해, 레이아웃 단에서 Refresh Token을 기반으로 Access Token을 재발급해 준다.

```tsx
useEffect(() => {
  const refreshToken = Cookies.get('refreshToken');
  if (refreshToken) {
    postTokens(refreshToken).then(data => {
      if (data?.accessToken) {
        useAuthStore.getState().setLogin(data.accessToken, refreshToken);
      }
    });
  }
}, []);
```

이렇게 하면 사용자가 새로고침을 해도, 쿠키에 남아 있는 Refresh Token을 이용해 **자동으로 로그인 상태를 복구**할 수 있다.

---

## 결과

### 보안 강화

1. **Access Token을 메모리에만 저장**하여 JS에서 직접 꺼내 쓰지 않음 → XSS 공격에 대한 방어 강화
2. **Refresh Token을 `HttpOnly` + `SameSite` 쿠키에 저장**하여 CSRF 공격에 대한 위험을 줄임

### UX 개선

1. 새로고침 시 Refresh Token으로 Access Token을 자동 재발급해, **로그인이 끊기지 않는 경험**을 제공

### 코드 관리 효율

1. 토큰 관리 로직을 전역에서 일관되게 관리할 수 있어, **코드 가독성과 유지보수성**이 좋아졌다.

---

## 깨달은 점

- **토큰 중앙화 관리의 중요성**  
  보안은 단순히 “어디에 저장할까?”의 문제가 아니라,  
  **“어디에서 관리하고, 어떻게 갱신할 것인가”**의 문제라는 것을 느꼈다.

- **보안 vs UX 밸런스**  
  Access Token은 보안을 위해 메모리에만 두고,  
  Refresh Token은 UX를 위해 쿠키에 남겨 두는 식으로 **역할을 분리**하는 것이 핵심이었다.

- **요구사항을 비판적으로 수용하기**  
  “sessionStorage에 저장하세요” 같은 단순 지침을 그대로 따르면 보안 이슈가 생길 수 있다.  
  앞으로는 **왜 이런 방식이 요구되는지**, 그리고 더 나은 대안은 무엇인지까지 고민해보려 한다.

