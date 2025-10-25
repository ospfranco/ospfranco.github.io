---
layout: post
title: Get iOS simulator local home folder on macOS
date: 2023-11-13
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

Sometimes you want to really see what is on the file system of iOS. Even the simulator file system is useful to check if files are correctly downloaded or sometimes you might want to check a database file manually.

You can easily get the directory printed out from the XCode console. When you application is paused or a debugger breakpoint is hit, you can type `po NSHomeDirectory()` and it will print out the local directory.

![home directory print out]({{site.url}}/assets/pohomedirectory.png "PO NSHomeDirectory")
