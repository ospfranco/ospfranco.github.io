---
layout: post
title: C++ and XCode notes
date: 2023-08-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/oscar.jpg
---

Random notes I go making as I get to compile C++ with XCode

# Header paths

Xcode settings show two different path variables for headers:

- `User Header Search Paths` are the paths searched when you use `#include "..."`
- `Header Search Paths` are the paths searched when you use `#include <...>`

The option `Always Search User Paths` will force `#include <...>` to search in the `User Header Search Paths`.
