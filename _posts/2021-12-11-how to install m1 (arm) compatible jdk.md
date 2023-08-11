---
layout: post
title: How to install M1 (arm) compatible JDK
date: 2021-12-11 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.JPG
---

Recently found out a nice trick to easily install a compatible JDK on mac without scouring the internet or brew formulas.

You can directly do it via Android Studio (or intellij IDEA), just go into the preferences and on the build tools > gradle menu, you can select which version of the JDK you want to use, if you open the dropdown you will see there is also an option to download a JDK.

![Android Studio 1]({{site.url}}/assets/androidStudio1.png)

Click on it and you will get a small dialog were you can select the flavor of JDK you want, I know for certain that the Azul versions are arm compatible.

![Android Studio 2]({{site.url}}/assets/androidStudio2.png)

(BTW I'm using the Android Studio Preview to get native arm android images)

Very convenient!
