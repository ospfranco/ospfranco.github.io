---
layout: post
title: React Native, change metro default terminal
date: 2023-08-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.JPG
---

Metro will open a new Terminal window everytime you start your RN app. If you are using other terminal app this is however very annoying. You can change the terminal used to run the initial script:

1. Open finder window and navigate to `<your_project/node_modules/react-native/scripts`
2. Locate `launchPackager.command`, right click the file, select `Get info` and then change the `Open with:` value to your terminal, then click on `Change All`