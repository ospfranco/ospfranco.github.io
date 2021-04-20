---
layout: post
title: How to quickly test any JavaScript library in the browser console
date: 2021-02-18 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

Yesterday Guillermo Rauch discovered the date-fns page has their library exposed on their documentation page for you to try it directly

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Brilliant. New bar for every JS/wasm library site I visit. <a href="https://t.co/hh7lIW45aW">https://t.co/hh7lIW45aW</a></p>&mdash; Guillermo Rauch (@rauchg) <a href="https://twitter.com/rauchg/status/1362133298177142784?ref_src=twsrc%5Etfw">February 17, 2021</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

This is definitely good, but I don't know if any other library does this, what if you want to compare the output with another library? waiting for all the library pages to do this is just wishful thinking.

Buy you don't need to wait, you can do this on your own thanks to skypack. Open your browser's console:

![Dynamic import]({{site.url}}/assets/SkypackDemo.png "SkypackDemo")

Very useful for quick testing