---
layout: post
title: Reset NVRAM on m1 mac
date: 2021-12-21 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.JPG
---

I needed to reset my M1 NVRAM for reasons, here to save you some seconds of googling

```
sudo nvram -c
```

You might see some errors regarding some services that cannot be restarted (fmm-mobileme and fmm-computer-name), but you can ignore those, afterwards restart your computer and it should be fine
