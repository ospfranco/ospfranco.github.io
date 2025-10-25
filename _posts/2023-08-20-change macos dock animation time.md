---
layout: post
title: Change macOS dock animation time
date: 2023-08-20 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

I auto-hide the dock on macOS, however the animation delay is a waste of time. You can set the animation time with the following command:

```bash
defaults write com.apple.dock autohide-time-modifier -float 0; killall Dock
```
