---
layout: post
title: Problems reading data from Binary store, all of the sudden my react-native app does not compile
date: 2021-05-20 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
twitter:
  username: "ospfranco"
  image: "assets/profile.jpeg"
---

If you work with React Native this week has been a lot of fun, your app might have magically stopped compiling all of the sudden (or as in my case when the gradle cache was invalidated in the CI and in my local builds).

Whenever I tried to compile the app for android, I would face a very random error:

```
* What went wrong:
Execution failed for task ':app:processGmsDebugResources'.
> Problems reading data from Binary store in /private/var/folders/qn/vyvn49j90jv9_77vq77wzvw00000gn/T/gradle7617438234756331878.bin offset 0 exists? true
```

It is particularly frustrating because there was absolutely no change from my side. I still haven't been able to figure out the root cause, but after reading some of the github issues; [a gradle issue that has nothing to do with RN](https://github.com/gradle/gradle/issues/8489) and the seemingly related [rn-push-notification issue](https://github.com/zo0r/react-native-push-notification/issues/1999#issuecomment-840235222). From what I gatter the cause seems to be Google pushing an update to their libraries messaging and breaking our precious compilation.

So in order to save you some time here is the solution, update the following dependencies:

```
project app-level build.gradle file:
com.google.firebase:firebase-analytics:17.2.2 to com.google.firebase:firebase-analytics:18.0.2

Project-level build.gradle file:
com.google.gms:google-services:4.3.3 to com.google.gms:google-services:4.3.5
```

If you are using `react-native-push-notification` (actually seems to be the root of this problem), you also need to update that library to the latest version (`7.3.1` as of this writing). Bare in mind this might be a major version change, so the API might have changed, in our case we were using a 6.X.X version and we had to update the `removeAllDeliveredNotifications` method.

Afterwards your app should hopefully compile.