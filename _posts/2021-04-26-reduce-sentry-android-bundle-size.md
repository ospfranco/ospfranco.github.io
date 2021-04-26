---
layout: post
title: Reduce Sentry android bundle size
date: 2021-04-26 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

At work I convinced my team to switch from Crashlytics to [Sentry](sentry.io). Sentry is just a far more complete tool, however, due to our target audience and just the android ecosystem in general, we are very careful regarding our app's apk size. Every added mb has a negative impact on how many people download/sign-up in our app. After adding Sentry our app grew by almost 2 megabytes, which is a step prize for us.

So I spent a bit of time trying to see if there was anything that could be done about it. Eventually reading the issues on the `sentry-android` repo (which is a direct dependency of the react-native version of the Sentry library), some people mentioned that NDK support (the framework to write C/C++ in android) seems to add a lot of unnecessary files.

The documentation directly mentions that if you don't need NDK support, you can switch your dependency from `sentry-android` to `sentry-android-core`. So I opened to `node_modules/@sentry/react-native/android/build.gradle` and changed the dependency there from `sentry-android` to `sentry-android-core`. Then saved a patch with [patch-package](https://github.com/ds300/patch-package).

Afterwards I simply built the app again (if you are doing local builds, you might want to run `./gradlew clean` on your android folder to get rid of any caches), and **it removes ~1.2 megabytes of the size of the app**.

