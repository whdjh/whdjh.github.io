---
layout: post
title: "Token을 웹스토리지에 저장한다고??(쿠키, 메모리 도입기)"
date: 2025-03-11 00:00:00 +0900
categories: dev
---

원본링크: https://velog.io/@wngns9807/Token%EC%9D%84-%EC%9B%B9%EC%8A%A0%ED%86%A0%EB%A6%AC%EC%A7%80%EC%97%90-%EC%A0%80%EC%9E%A5%ED%95%9C%EB%8B%A4%EA%B3%A0%EC%BF%A0%ED%82%A4-%EB%A9%94%EB%AA%A8%EB%A6%AC-%EB%8F%84%EC%9E%85%EA%B8%B0

# 문제 상황

부트캠프에서 제시한 요구사항에 따라, 처음에 Access Token과 Refresh Token을 sessionStorage에 저장했다.
하지만 이는 보안적으로 여러 문제를 야기했다.

- XSS 취약: sessionStorage와 localStorage는 모두 자바스크립트로 접근 가능하므로, 악성 스크립트 삽입(XSS)에 의해 토큰이 유출될 수 있다.
- CSRF 취약: 토큰을 쿠키에 그대로 저장할 경우 CSRF 공격에 그대로 노출된다.
- 사용성 저하: 새로고침 시 세션 정보가 초기화되거나 재로그인이 필요해 UX가 떨어졌다.

즉, "보안도 취약하고, 사용자 경험도 만족스럽지 못한 방식"이었다.

# 개선 과정

## 토큰 저장소 선택 기준 정리

1. 쿠키: 서버와 자동 동기화되지만 CSRF에 취약. HttpOnly와 SameSite 속성으로 보완 가능.
2. local/sessionStorage: JS 접근 가능 → XSS 공격에 취약.
3. 메모리 변수: 새로고침 시 초기화되지만 JS 접근 불가 → XSS 방어에 유리.

### XSS(Cross Site Scripting)

- 악의적인 사용자(웹사이트 관리자가 아닌 누군가)가 웹 페이지에 악성 스크립트를 삽입할 수 있는 취약점
- 핵심은 XSS 공격에 성공한다면 해커는 자바스크립트를 실행
- JS코드로 접근이 가능한 쿠키, 로컬스토리지, 세션스토리지는 XSS 공격에 취약하다
- 다만 쿠키의 경우 HttpOnly 속성을 추가하면, 자바스크립트로 접근할 수 없는 쿠키
- XSS 공격을 방어하기 위해 토큰은 HttpOnly 속성이 걸려있는 쿠키, 메모리에 저장된 로컬 변수 중 한 곳에 저장

### CSRF(Cross Site Request Forgery, 사이트 간 요청 위조)

- 사용자가 자신의 의지와는 무관하게 공격자가 의도한 행위(수정, 삭제, 등록 등)를 특정 웹사이트에 요청하게 하는 공격
- 쿠키는 CSRF 공격에 취약
- CSRF 공격은 사용자의 브라우저를 통해 요청을 보내는 공격입니다. 사용자의 브라우저에서 요청을 보내기 때문에 쿠키는 함께 전달
- 서버 입장에서는 이게 사용자가 보낸 요청인지, 해커가 보낸 요청인지 알 길X

### 결론

1. Access Token은 메모리에 저장, Refresh Token은 쿠키에 저장
2. 클라이언트는 Access Token을 로컬 변수에 저장하여 사용되어, 만약 Access Token이 날아가거나 기간이 만료되면 Refresh Token을 통해 Access Token을 재발급하여 XSS와 CSRF 위험을 줄임

## 기존코드

### useAuthStore.tsx

- 기존: sessionStorage에 accessToken과 refreshToken 모두 저장
- 개선: accessToken은 메모리에만 유지, refreshToken은 HttpOnly + SameSite=strict 쿠키에 저장

```tsx
// 기존 코드
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

### intercepter.tsx

- 기존: sessionStorage에서 토큰을 직접 꺼내 사용
- 개선: accessToken은 메모리에서 가져오고, refreshToken은 쿠키에서 읽어 자동 재발급

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

### 새로고침 대응 (layout.tsx)

- accessToken은 메모리에만 있으므로 새로고침 시 초기화됨
- 개선 방법: layout.tsx에서 refreshToken 기반으로 accessToken을 재발급

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

# 결과

- **보안 강화**
  1. accessToken을 메모리에만 저장하여 JS 접근 차단 → XSS 공격 방어
  2. refreshToken을 HttpOnly + SameSite 쿠키에 저장 → CSRF 공격 방어

- **UX 개선**
  1. 새로고침 시 refreshToken으로 자동 재발급 → 로그인 유지 경험 제공

- **코드 관리 효율**
  1. 토큰 관리 로직을 전역에서 일관되게 관리 가능

# 깨달은 점

- 토큰 중앙화 관리의 중요성: 보안은 단순히 "저장 위치" 문제가 아니라, "어디에서 관리하고, 어떻게 갱신하는가"의 문제였다.
- 보안 vs UX 밸런스: accessToken은 보안을 위해, refreshToken은 UX를 위해 유지 → 적절히 분리 저장하는 것이 핵심.
- 실무에서 요구사항 비판적 수용: 부트캠프 요구사항처럼 "sessionStorage에 저장" 같은 단순 지침을 그대로 따르면 보안 이슈가 생긴다. 요구사항을 그대로 따르는 게 아니라, "왜 그런 방식인지"를 이해하고 더 나은 대안을 제시해야 한다.
