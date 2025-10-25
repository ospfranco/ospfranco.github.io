---
layout: post
title: ZSH configuration files load order
date: 2023-08-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

The order of files being loaded by ZSH is the following:

1. `.zshenv`
2. `.zprofile` if login
3. `.zshrc` if interactive
4. `.zlogin` if login
5. `.zlogout`sometimes

Why? sometimes variables might be replaced by subsequent files or some other configuration that you don't desire might be applied.

Be careful when setting things on `.zshenv` since it can be overriden by subsequent scripts. Also, only `.zshrc` should be used for things like prompt colors and user scripts.
