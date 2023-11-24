---
layout: post
title: Disambiguate TypeScript union types
date: 2023-08-16 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/oscar.jpg
---

On TypeScript you can easily create the union of two similar, yet distinct, types:

```ts
type iOSPaymentInfo = {
  orderId: string;
  iOSOnlyField: string;
}

type AndroidPaymentInfo = {
  orderId: string;
  androidOnlyField: string;
}

type PaymentInfo = iOSPaymentInfo | AndroidPaymentInfo;

// Trouble comes

let paymentInfo: PaymentInfo = ... // some payment info

// You cannot access iOSOnlyField or AndroidOnlyField TypeScript will complain the field might be null
paymentInfo.iOSOnlyField // kaboom
```

You can make typescript happy by adding a literal field that will provide it with enough info to make sure the object is correct:

```ts
type iOSPaymentInfo = {
  orderId: string;
  iOSOnlyField: string;
  kind: 'iOS';
}

type AndroidPaymentInfo = {
  orderId: string;
  androidOnlyField: string;
  kind: 'Android';

}

type PaymentInfo = iOSPaymentInfo | AndroidPaymentInfo;

// Trouble comes

let paymentInfo: PaymentInfo = ... // some payment info

if(paymentInfo.kind === 'iOS') {
  // Type safe code for iOSPaymentInfo
} else {
  // Type safe code for AndroidPaymentInfo
}
```

> [Source](https://basarat.gitbook.io/typescript/type-system/discriminated-unions)
