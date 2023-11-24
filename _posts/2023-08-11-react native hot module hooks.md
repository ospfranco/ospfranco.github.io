---
layout: post
title: React Native, hot module hooks
date: 2023-08-11 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/oscar.jpg
---

In some cases you might want to clear listeners or state when a fast-refresh/hot-reload cycle happens. You can do so by hooking up to the hot module:

```typescript
module.hot?.accept(() => {
  store.cleanUp();
});
```

This will only be called once the new module is mounted, this means any reference the previous in-memory module had, will not be there. Sometimes you really need a reference to an old object to clean it, you can use the counter part `dispose`:

```typescript
module.hot?.dispose(() => {
  myVarThatHoldsARef.reset();
});
```

Take note of the optional chaining operator, when compiling the app on production the `hot` module will not be there, causing a crash if trying to be called.
