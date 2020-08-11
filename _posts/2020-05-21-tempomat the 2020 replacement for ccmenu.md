---
layout: post
title: How to build a macOS Menu Bar/Tray app with SwiftUI
date: 2020-05-21 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
excerpt: How I iterated, came up and the coded Tempomat
location: Munich
image: assets/tempomat/TempoBanner.png
twitter:
  username: ospfranco
  card: "summary_small_image"
  image: "assets/taco.png"
---



A small recount of how I came up/built [Tempomat](https://tempomat.dev), native macOS menu bar app to keep track of continuous integrations pipelines right from your Desktop.

![Tempomat Banner]({{site.url}}/assets/tempomat/TempoBanner.png "Tempomat banner")

## In the beginning there was... CCMenu

So, if you are on the market for such a niche product, you have probably ran across [CCMenu](http://ccmenu.org), CCMenu came out of ThoughtWorks for their Cruise Control project (or something like that), it basically uses CCTray, a XML schema tied to a specification to fetch status information from various systems that might have nothing in common, but, by having a standard, you can write a single application that reports the status on various systems without dealing with different response shapes and APIs.

And that is great! however... it is very limited, CCTray is great, don't get me wrong, but it is now fairly old and very limited in it's capabilities, not all systems support it, for example, CircleCI does support it, but there are two major problems to get it to work (1) it has very very poor documentation, you have to scour some old forum posts and do a lot of trial and error to get it working and (2) it offers very limited information, mainly it only offers status on your master branch.

Now on the other hand of the spectrum you have the good old email notification systems (and it's more modern variant: Slack notifications), but IMHO, I don't find them that useful, you are already bombarded with emails and slack notifications every day, everything from your co-worker sending you cat pictures to JIRA filling your email with more mails than you will be ever able to read.

Due to the limitations of CCTray (or it's implementations via 3rd parties) or it's analogous email counter part, I felt like there was really a hole to be filled here in the developers productivity tool belt.

## Enter Tempomat

You can think of tempomat as CCMenu for the year 2020, it takes a more laborious approach, namely it needs to manually integrate with each API, but the results are far more richer than what CCTray could do, instead of being a one way communication channel you can actually have some interactivity (triggering a rebuild for example) or far more nuanced information (depending on the system) like having the steps of each build (for CircleCI).

I took over the job of going through the API documentation of a few systems, integrating them, parsing them and putting into a representable shape in order to deliver a powerful yet simple menu bar app for the power(?) developer, like CCMenu it sits on your menu bar and you are always one click away from seeing the status of your build jobs and branches (all of them), I have now seen some customers with hundreds of branches/repos/jobs, to whom this having this information always available represents a huge time save.

I'm also quite happy with the way the product developed, the goal is clear and the architecture kinda flowed on it's own, by now adding more systems is trivial albeit time consuming, that being said I can continue expanding it as long as the tool remains simple and that is my goal anyways.

## Ok, that is dandy and all, but I came here to learn to build a Menu Bar app!

Sure, to be honest, I'm now gonna going to show you any code, but I will provide a general overview of how I did it, and also provide you with some links that will be useful.

Let's get the tech stack out of the way, I used Swift and SwiftUI, to be honest I didn't know what I was getting myself into, I didn't even know swiftUI existed, all I did was waking up one morning with the IDEA of making a replacement for CCMenu and then sat down and starting reading the possibilities, Obj-c is horse-shit, period, but as it turns out churning out an app in SwiftUI is fairly straightforward, now don't get me wrong, developing so close to the metal after being a web dev for years, is quite refreshing and it was even fun, but there is many many years of cruft on macOS APIs, and, SwiftUI while going in the right direction, is YEARS behind react and other declarative UI libraries.

So I started with the first thing, how the heck do you create a menu bar app, as it turns out, it is super simple, [here](https://medium.com/@acwrightdesign/creating-a-macos-menu-bar-application-using-swiftui-54572a5d5f87) is one of the many articles on the web about the topic, I followed that one and I was then pretty much left to my own, afterwards there was a lot of things I had to learn, some are very SwiftUI specific and are just a waste of time, [like removing a List background](https://stackoverflow.com/questions/60454752/swiftui-background-color-of-list-mac-os) or dealing with combine published objects, or dealing with UIKit and how to adapt old components for SwiftUI to work or just other native macOS APIs, so here are some of the highlights:

1. Network requests are of the stone age, after doing a lot of work on typescript and modern javascript in general, I have come to expect async/await syntax, yep... not possible on swift, like a barbarian you have to work with callbacks, I was pleasantly surprised however to discover [PromiseKit](https://github.com/mxcl/PromiseKit), from the same guy that created Brew!, while not as nice as Async/await and least it allowed me to have a little bit of sanity back and create promise based code.
2. There is a [SwiftLint](https://github.com/realm/SwiftLint), it's useful, but XCode is horse-shit, you either have two options, have the linter whine and you have to manually fix everything yourself or have it auto-fix and lose history every time you run/save the file, both options suck, but hey... at least I have a linter that helps... kinda
3. There are some good libraries out there, some I would like to mention, the already mentioned PromiseKit, [HotKey](https://github.com/soffes/HotKey), [KeychainAccess](https://github.com/kishikawakatsumi/KeychainAccess) and I can also see the community is working hard to make SwiftUI suck less, for Tempomat I ended up using KeychainAccess only, which provides a very simple API for people dumb like me
4. While I did not ended using it on this project I ended up creating a [TextView](https://github.com/osfrnc/SUITextView) component for macOS SwiftUI, it was very painful and it took many hours to get it working, which I didn't want to let them go to waste, apple has really put very little love into macOS...

You will have to scour the internet every time you hit a roadblock, you can check out my [StackOverflow profile](https://stackoverflow.com/users/3107926/oscar) and you will se what I mean, especially if you have no experience with Swift before, you will hit roadblocks which should otherwise be simple, but I guess you can say that out of every language

## One last thing
So the last part I want to talk about is not technical at all, and you could say is more of a personal lesson but: I wasn't sure what I was expecting when I started this projects, one the one hand after working on companies where I wasn't happy for years and working on products I felt no connection I just wanted to create a tool I would be happy to use everyday, and on that regard, Tempomat is a success, I'm super proud of how it turned out and how it works.

I have gotten amazing feedback from the (few) people that have bought it and find it useful, the problem is... I've only sold like 10 copies so far, and that is a let down, at the very least I would like to make for the time I spend on the project, I don't want to make millions but something I can have for myself and I can proudly say that I built it, but if nobody uses it I'm not sure I can even say that.

I've been considering maybe adding ads to the product or calling it quits and open sourcing it, but I have to much love for the product to let it go so easily (or turn it into a shitty ad based product)

## Ok ok, so you want to build something similar
Go for it, if you have better marketing skills than me and build the same thing, you probably will do beat me, all can say is, I made this product with love and to help people be more productive.

- It's super easy to do a (simple) native menu bar app, go learn swift/swiftUI, even with all it's quirks you can get something working in a couple of weeks, it's never been easier
- React-native (or expo or w/e) support macOS as a target, I just saw a tweet this morning saying you can easily create a tray app with that, also very valid options, all I can say is, I'm happy I don't depend on shitty web technology to get some of the low level stuff working
- I already gave you a bunch of links, read up!

There is a bunch of obvious stuff I will only tangentially mention: apple cut, dealing with updates, dealing with some outdated tooling (when coming from the JS world) are a hard pill to swallow but having a native app running after a couple of weeks is super satisfying, also please check out [Tempomat](https://tempomat.dev)! or share it with your friends, you would make me a great favour if you do!