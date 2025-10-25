---
layout: post
title: React Native, Android emulator prevent janky bluetooth output
date: 2023-08-11 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

When the Android emulator starts it causes microphones to start recording, if you are using Bluetooth headphones, this causes a significant drop in quality.

You can disable audio input permanently on the emulator by editing:

`~/.android/avd/<emulator-device-name>.avd/config.ini`

Change the following lines:

```
hw.audioInput = no
hw.audioOutput = no
```
