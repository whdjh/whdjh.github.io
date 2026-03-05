---
layout: post
title: "디자인 패턴 5,6장"
date: 2026-03-06 00:00:00 +0900
categories: dev
---

## 5장 최신 자바스크립트 문법과 기능
- 어플리케이션 분리의 중요성: 자바스크립트 생태계에서 애플리케이션이 모듈형이라는 것은 잘게 분리된 모듈로 구성되었음을 뜻하며 이러한 느슨한 결합은 의존성을 낮추어 유지보수가 쉽게 만든다.
- 정적 모듈 가져오기는 메인 코드를 실행하기 전에 먼저 모듈을 다운로드하고 실행해야하므로 성능에 저하를 야기할 수 있다.
- 동적 모듈 가져오기는 지연 로딩을 통해 필요한 시점에만 로드를 할 수 있다.
- 모듈을 사용하면 얻는 이점
1. 한번만 실행된다.
2. 자동으로 지연 로드가 된다.
3. 유지 보수와 재사용이 쉽다.
4. 네임스페이스를 생성한다.
5. 사용하지 않는 코드를 제거한다.
- 생성자, 게터, 세터를 가진 클래스
```js
class Cake {
  constructor( name, toppings, price, cakeSize ) {
    this.name = name
    this.cakeSize = cakeSize
    this.toppings = toppings
    this.price = price
  }

  addTopping( topping ) {
    this.toppings.push( topping )
  }

  get allToppings() {
    return this.toppings
  }

  get qualifiesForDiscount() {
    return this.price > 5
  }

  set size( size ) {
    if ( size < 0 ) throw new Error("Cake must be valid size: " + "either small, medium or large" )
    this.cakeSize = size
  }
}

let cake = new Cake("chocolate", ["chocolate chips"], 5, "large")
```
1. extends를 통한 상속 가능
2. super를 통해 부모 메서드 실행 가능
3. #를 앞에 붙여 비공개 멤버로 만들 수 있음

## 6장 디자인 패턴의 유형
- 생성패턴: 객체 생성하는 방식에 중점을 두어 이 과정을 제어하여 문제를 해결하는 것을 목표
- 구조패턴: 객체의 구성과 각 객체 간의 관계를 인식하는 방법에 중점
- 행위패턴: 시스템 내의 객체 간 커뮤니케이션을 개선하거나 간소화하는 방법에 중점
