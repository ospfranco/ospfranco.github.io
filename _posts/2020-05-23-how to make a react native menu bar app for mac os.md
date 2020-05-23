---
layout: post
title: How to make a React Native Menu Bar app for mac OS
date: 2020-05-23 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
excerpt: A guide to create your own menu bar app using React Native
location: Munich
image: assets/taco.png
twitter:
  username: "ospfranco"
  card: "summary_large_image"
  image: "assets/taco.png"
---

So I'm going to write this in a hurry, also with the hope that more people get to see Tempomat and buy a copy! :)

So I first saw a tweet by [Kaiyes Ansary](https://twitter.com/Kaiyes_Ansary), about creating a Expo-Electron based macOS menu bar apps, which I found the idea interesting, since Tempomat has been on the market for a couple of weeks already but the process of learning and mastering native APIs, swift and SwiftUI was not easy at all, I also saw the microsoft just added macOS support for React native and I thought... I think I can make that work, so here are the steps to get your own app running as a menu bar app:

1. Create a RN project
```npx react-native init myApp --template react-native-template-typescript```
A simple rn project, nothing fancy here

2. Add macOS support
This is bound to change, you should always follow the instructions on the microsoft react-native-macos site, but for now you can do:

```
cd myApp
npx react-native-macos-init
```

Afterwards you should have a basic RN mac os app, you can try to run it and it will open a normal window

3. Start turning the app into a menu bar app... by removing the obj-c
Ok, this step is not 100% necessary, but I don't know objective-c, so I had to do it, delete:

```
AppDelegate.h
AppDelegate.m
main.m
ViewController.h
ViewController.m
```

And instead create an AppDelegate.swift, Xcode will ask you if you want to create a bridging header, say yes, and that the following contents:

On the bridging header file:
```swift
//
//  Use this file to import your target's public headers that you would like to expose to Swift.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTRootView.h>
#import <React/RCTUtils.h>
#import <React/RCTConvert.h>
#import <React/RCTBundleURLProvider.h>

```

On the AppDelegate.swift:
```
//Author: Oscar Franco, created on: 23.05.20

import Foundation
import Cocoa

@NSApplicationMain
class AppDelegate: NSObject, NSApplicationDelegate {
  var popover: NSPopover!
  var bridge: RCTBridge!
  var statusBarItem: NSStatusItem!

  func applicationDidFinishLaunching(_ aNotification: Notification) {
    let jsCodeLocation: URL

    jsCodeLocation = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index", fallbackResource:nil)
    let rootView = RCTRootView(bundleURL: jsCodeLocation, moduleName: "tempomat", initialProperties: nil, launchOptions: nil)
    let rootViewController = NSViewController()
    rootViewController.view = rootView

    popover = NSPopover()

    popover.contentSize = NSSize(width: 700, height: 800)
    popover.animates = true
    popover.behavior = .transient
    popover.contentViewController = rootViewController

    statusBarItem = NSStatusBar.system.statusItem(withLength: CGFloat(60))

    if let button = self.statusBarItem.button {
        button.action = #selector(togglePopover(_:))
      button.title = "Tempomat"
    }

  }

  @objc func togglePopover(_ sender: AnyObject?) {
      if let button = self.statusBarItem.button {
          if self.popover.isShown {
              self.popover.performClose(sender)
          } else {
              self.popover.show(relativeTo: button.bounds, of: button, preferredEdge: NSRectEdge.minY)

              self.popover.contentViewController?.view.window?.becomeKey()
          }
      }
  }
}

```

Not gonna give away too much of my own code, but that should get you started to have a working status bar item that you can click on

4. Clean up a few other things
On your info.plist you need to set the value `Application is agent (UIElement)` to true, that means the app will run on the "background" and users cannot alt-tab into it

On your `Main.storyboard` file, delete the old references to the ViewController and the window, and make sure the app delegate is pointing to the correct file

I did run into some weird swift compilation chain error, I think it was because of Flipper support in RN 0.62, make sure that on your target settings DEAD_CODE_STRIPPING is set to `YES` and `Always embed swift libraries` is also set to YES

5. Profit

Enjoy! and please do check out [Tempomat](https://tempomat.dev) sales have not been great and I would really like to continue the project! Cheers!