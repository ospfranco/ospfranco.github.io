---
layout: post
title: What react-native is missing to become the default framework to build apps on all platforms
date: 2020-08-03 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
location: Munich
image: assets/taco.png
twitter:
  username: "ospfranco"
  card: "summary_large_image"
  image: "assets/taco.png"
---

So, I was trying to develop app that runs on ALL platforms (iOS, android, windows, mac), I was encouraged by the announcement that react-native recently added support to macOS thanks to the guys at microsoft (facebook has now jumped on the bandwagon), so after a couple of months of development I have to call quits, there is just too much friction and I'm a one man team developing this on my freetime, let me explain some of my pain points.

## Lack of library support

One of the great things in react-native is that it is underpinned by the native components and APIs of each platform, but... it is also a curse, I had accepted that react-native-macos was not ready for prime time and I would be able to work around many of the issues, albeit with compromises, but I reached the point of break when trying to draw vector graphics.

Currently if you want to draw vector graphics on react-native, the default choice is react-native-svg, surprise surprise it's not supported on macos (or windows), support might come someday, but you are at the mercy of the forces of fate and good charity until someone takes the time to port it to each platform, which could be months or years, and that is just the basic stuff, there are hundreds of libraries out there that need to be ported to each platform

And this is a story that keeps repeating itself for me (and not only on macOS) I've been working with RN for some years now and everytime I reach the point where libraries are abandoned left and right, new functionality requires deep knowledge of the platform and build systems, there are major performance problems when you try to do a large enough application, etc.

React-navigation? you are stuck with version 2.X, which has no native dependencies and has been deprecated for years already, other libraries like camera, location, etc... you can forget them for a few months/years

## One philosphy to rule them all

Current windows and macos ports are being developed with the idea that all supported platforms should have 1 to 1 feature parity, this also includes behavior parity.

On the surface this sounds reasonable, **it's not**, because mobile and desktop do not behave the same, the way you interact with an app using keyboard and mouse is not the same as with mobile: on desktop keyboard shortcut support is a must, being able to detect key combinations is a must, RN does not support any of this, even some of the default behavior with a digital keyboard does not translate well to physical machine, another thing is app lifecycle (focus/blur) are bound to different rules as on mobile

At best you will end up with an app that feels weird to use on desktop (UI not withstanding, just talking about UX here)

## What to do

You want to patch this yourself? I can only wish you good luck, do you know obj-c? core graphics? the windows APIs? Android Java? Gradle? do you understand the internal structure of react-native and how to create your own components? creating code using the bridge? it's also slow..., there are turbo modules comming, you can add c++ to the pile of things you need to learn.

What about web? you then have to stack one more framework on top of rn with it's own quirks and bugs... I really think the philosophy here is failing, there is great promise on react-native but on the current path, I just don't see how this can be sustainable for any company not the size of facebook to deal with the issues.

Currently I'm looking into pure web technologies and electron, electron gets a lot of flak for the size of installation and memory consumption, but chrome is an OS by itself, so much of this small details have been abstracted away and solved by a well paid team, written in a low level implementation, it's truly amazing, the web APIs have advanced so much and now with webassembly the possibilities are greater than ever, not saying it is perfect, but it sure beats holding your breath for the OSS community and a menage of companies (all with different incentives) to patch it on it's own...

As for me I will start exploring the possibility of developing the app on pure web and creating shallow native apps that heavily use embedded webviews, I remember I saw a couple of videos of the guys at basecamp, they have tiny native teams that only write small container apps but the bulk of the work is in the web and that can be reused inside the shallow containers, that seems to be the most reasonable thing (even if you have to learn the basic of each OS to create a container app, which you end up doing anyways with RN)