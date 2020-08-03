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

I was trying to develop app that runs on ALL platforms (iOS, android, windows, mac), I was encouraged by the announcement that react-native recently added support to macOS thanks to the guys at microsoft (facebook has now jumped on the bandwagon), so after a couple of months of development I have to call quits, there is just too much friction, I'm a one man team developing this on my freetime and I have rarely encountered so much problems developing a simple app.

React native promises this utopia, we're you write once and gets executed everywhere, which is true when everything works, however when it doesn't the pain starts, with the current jump into desktop environments there is a lot more friction than the more mature mobile counterparts.

# Lack of library support

I had assumed that despite it's young age microsoft wouldn't announce a "release" if the product was not ready, and I was willing to go the extra mile cutting slack here and there, ignoring the rough edges, I even patched some libraries myself, with my barely passable knowledge about the macOS toolchain, swift, obj-c and cocoapods, but I reached the point of break when trying to draw vector graphics.

Currently if you want to draw vector graphics on react-native the default choice is react-native-svg, surprise surprise it's not supported on macos (or windows), support might come someday, but you are at the mercy of the react-native community until someone takes the time to port it to each platform, and let me tell you the react-native community does not have a great track record of producing well maintained software.

And this is a story that keeps repeating itself for me (and not only on macOS) I've been working with RN for some years now and everytime I reach the point where libraries are abandoned left and right, new functionality or patching requires deep knowledge of the platform and build systems.

Another current paint point React-navigation? you are stuck with version 2.X, which has no native dependencies and has been deprecated for years already, other libraries like camera, location, etc... you can forget them for a few months/years, it's incredibly bold of microsoft to claim their "store" app is built with react-native, it's basically a bunch of webviews cobled together, and it is basically a app that consists of some lists, if that is all your app will need, then you can safely use react-native on desktop.

# One philosphy to rule them all

Current windows and macos ports are being developed with the idea that all supported platforms should have 1 to 1 feature parity, this also includes behavior parity.

On the surface this sounds reasonable, **it's not**, because mobile and desktop do not behave the same, the way you interact with an app using keyboard and mouse is not the same as with mobile, on desktop keyboard shortcut support is a must, being able to detect key combinations is a must, RN does not support any of this, even some of the default behavior with a digital keyboard does not translate well to physical machine, another thing is app lifecycle (focus/blur) are bound to different rules as on mobile

At best you will end up with an app that feels weird to use on desktop (UI not withstanding, just talking about UX here), so far my workaround has been to attach listeners on the native sides and transmit events to the rn side... you can imagine this is time consuming to get right, and sometimes you will just not get it right no matter what

## It's open source!

You want to patch this yourself? here are some of the problems in the order that I found them as I went along:
- I barely learned Swift, I cannot justify learning obj-c, guess what rn is written in obj-c
- You have to learn the macOS specific APIs, most of the content in the internet is written for the iOS APIs
- Apple's documentation is one of the worst I have seen so far
- You have to start digging into the more hardcore parts of the APIs, CoreGraphics?
- If somehow you manage to do all of that, repeat it for other platforms Android, Windows?
- Once you have your piece of native code you have to use the RN bridge, did you know it is also slow? now you have to do TurboModules, which is c++... also no (usable) documentation
- Oh yeah, add one more platform, react-native-web
- Don't forget about each platform build system, I still don't fully grasp everything Gradle does to build an Android app

Now to be completely fair, some of these problems are not unique to react-native, the problem is... there is already a solution out there to run code on every architecture/machine that does not require you to learn a new API every 2 days or so, it's called a web browser

# So what now?

As for react-native, besides the corporations with big pockets taking over the job the community is currently trying to fill, I see no good solution, the disparity of libraries, APIs, platforms makes this a really challenging problem to tackle in the typical OSS manner, and in the end, we are all re-creating chrome with a lesser memory footprint and some performance gains (which I still would debate)

As for my and my project I think the best path forward is web, I can still use react and the web APIs are good enough for what I need to do, electron gets a lot of flak for the size of installation and memory consumption, but chrome is an OS by itself, so much of this small details have been abstracted away and solved by a well paid cohesive team and with webassembly the possibilities are greater than ever, not saying it is perfect, but it sure beats holding your breath for the OSS community and a menage of companies/team (all with different incentives) to catch up

Creating shallow native apps that heavily use embedded webviews seems a good compromise when truly native functionality is needed, I remember I saw a couple of videos of the guys at basecamp, they have tiny native teams that only write small container apps but the bulk of the work is in the web and that can be reused inside the shallow containers, that seems to be the most reasonable thing (even if you have to learn the basic of each OS to create a container app, which you end up doing anyways with RN)