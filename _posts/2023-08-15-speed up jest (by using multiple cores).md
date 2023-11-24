---
layout: post
title: Speed up Jest (by using multiple cores)
date: 2023-08-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

You can increase jest speed by passing the amount of workers, this works wonders on a m1 machine, use the following npm scripts:

```jsx
"test": "jest --maxWorkers=50%",
"test:watch": "jest --maxWorkers=50% --watch",
```

For CI jobs, where you usually don't have many processors running the tests sequentially provides the best results

```jsx
"test:ci": "jest --testLocationInResults --runInBand --ci --outputFile=test_results.json --json",
```
