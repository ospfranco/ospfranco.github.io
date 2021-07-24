---
layout: post
title: Redux as analytics middleware
date: 2021-04-28 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

Analytics are commonplace (even a requirement) and, despite time passing by, Redux is still widely used. So here is a small concept that might super charge your analytics game. Instead of sending custom analytic events to create your user funnels, directly hook up your redux actions to your analytics service.

This is a small trick I did during the WerkerApp days. At some point adding analytic data points becomes burdensome. For each new feature you need to figure out which data points you need, you need to agree which additional data you need to send to calculate your goals, etc. Instead of doing all this manual work everytime, you can get a complete analytics pipeline for free by directly hooking up your Redux actions to your analytics. You obviously need to be careful about sending sensitive data, but for every new feature you develop, you will have a complete analytics pipeline for free!

## Redux middleware

Achieving this is super easy, all you need is to create a custom Redux middleware. In this case I'm using Sentry to put breadcrumbs to better trace errors, but you can apply this to any back-end whatsoever.


```ts
// Sentry.middleware.ts
import * as Sentry from '@sentry/react-native'

const ACTION_BLACK_LIST = ['timer/TICK']

const handleAction = (next: any, action: any) => {
  if (!ACTION_BLACK_LIST.includes(action.type)) {
    // Careful here not to send entire actions, it chokes the react-native bridge and might not even reach sentry due to the amount of data
    Sentry.addBreadcrumb({
      category: 'redux_action',
      message: action.type,
      level: Sentry.Severity.info
    })
  }

  return next(action)
}

export function createSentryMiddleware () {
  return (store:any) => (next: any) => (action: any) => handleAction(next, action)
}
```
> In the code you can see I'm only sending the action type, that is because at work our actions are super huge and they kill the react-native bridge, but here you can customize the sending function to your needs and only send the necessary data

```ts
// On your store creation code

const middlewares = []

...

const sentryMiddleware = createSentryMiddleware()
middlewares.push(sentryMiddleware)

...

const store: Store = createStore(rootReducer, compose(applyMiddleware(...middlewares)))
```

The code is super simple, but the concept is truly powerful, it could save you a lot of time by not manually having to add data points and also retroactively collect data from the moment you develop a new feature.

Cheers!