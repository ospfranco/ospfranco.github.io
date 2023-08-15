---
layout: post
title: React Native, native logs quirks
date: 2023-08-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.JPG
---

# iOS

On iOS the default output (NSLog) is by default disabled on the project. You can re-enable it by editing the scheme you are using, going to the `Arguments` tab, there you will see a `OS_ACTIVITY_MODE` flag, you can clear the value and you will start seeing all the logs.

If you don't want to use NSLog (or print on Swift I suppose) you can use the RCTLog functions:

```obj-c
#import <React/RCTLog.h>

// Your code
RCTLogWarn(@"Your message")
```

# Android

On Android you can resort to the RNLog functions:

```java
import com.facebook.react.util.RNLog;

// Your code
RNLog.a("Your message");
```