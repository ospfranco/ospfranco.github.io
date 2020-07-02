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

So I first saw a tweet by [Kaiyes Ansary](https://twitter.com/Kaiyes_Ansary), about creating a Expo-Electron based macOS menu bar apps, which I found the idea interesting, since Tempomat has been on the market for a couple of weeks already but the process of learning and mastering native APIs, swift and SwiftUI was not easy at all, I also saw the microsoft just added macOS support for React native and I thought... I think I can make that work, and I did, so now I'm sharing the joy

# 1. Create a RN project


```npx react-native init myApp --template react-native-template-typescript```

A simple rn project, nothing fancy here

# 2. Add macOS support


This is bound to change, you should always follow the instructions on the microsoft react-native-macos site, but for now you can do:

```
cd myApp
npx react-native-macos-init
```

Afterwards you should have a basic RN mac os app, you can try to run it and it will open a normal window

# 3. Start turning the app into a menu bar app... by removing obj-c


Ok, this step is not 100% necessary, you could just set up the statusbar button on obj-c but I don't know objective-c, so I had to do it, therefore delete:

```
AppDelegate.h
AppDelegate.m
main.m
ViewController.h
ViewController.m
```

And instead create an AppDelegate.swift, Xcode will ask you if you want to create a bridging header, say yes, and that the following contents:

On the bridging header file
```swift

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

On the AppDelegate.swift
```swift
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

    #if DEBUG
      jsCodeLocation = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index", fallbackResource:nil)
    #else
      jsCodeLocation = Bundle.main.url(forResource: "main", withExtension: "jsbundle")!
    #endif
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

Not gonna give away too much of my own code, but that should get you started to have a working status bar item that you can click on.

**PLEASE DO NOTE** You have to change the module name when registering the root view, in the above snippet it is "tempomat" should be w/e you named your react-native project.

# 4. Clean up a few other things

If you don't want your app to appear on the macOS dock and sit on the background (you won't be able to alt-tab to it): on your info.plist you need to set the value `Application is agent (UIElement)` to `YES`

On your `Main.storyboard` file, delete the old references to the ViewController and the window, and you also have to change the app delegate on the right side attribute panel and give it your macos module, otherwise it won't be picked up, here is a screenshot that should guide you on where to look 👀:

![AppDelegate Module]({{site.url}}/assets/AppDelegateattribute.JPG "AppDelegate Module")

I did run into some weird swift compilation chain error, I think it was because of Flipper support in RN 0.62, make sure that on your target settings `DEAD_CODE_STRIPPING` is set to `YES` and `Always embed swift libraries` is also set to `YES`

# 5. Profit

Done, you should be able to hit the run button via xcode (or run the app via `npx react-native run-macos`) and should see your RN menu bar running!

![Menubar App]({{site.url}}/assets/RNMENUBARAPP.JPG "Menubar App")

BUT, there is catch, right now react-native-macos is so fresh... pretty much none of the existing libraries are working, and sometimes that will also mess up your `pod install` react native vector icons work fine if you follow the macOS steps, but I ended up creating the following yarn command to being able to run pod install without autolinking messing with it:

```
"macos:install": "cd node_modules/react-native-vector-icons && mv RNVectorIcons.podspec X && cd ../../macos && pod install && cd ../node_modules/react-native-vector-icons && mv X RNVectorIcons.podspec"
```

You also won't have the latest version of react-navigation working, I got the latest version of the v2 working and that is fine for now... so yeah, a lot of compromises, but the future looks bright!

I have also created a ready to go [template](https://github.com/ospfranco/rn-macos-menubar-template) for you to play around, just clone it and hit the run button!

Now that you made it here (and I'm sure you like menu bar apps), check out [Tempomat](https://tempomat.dev), if you work with CIs I'm sure it will make your life easier! also coming to iOS and Android soon!

# 6. P.D. Fixes

1. After some weeks I discovered a couple of problems, one is, I forgot to load the production bundle when using the app on release mode, I updated the contents of AppDelegate on this article to reflect the change.
2. Since we are using Swift, the normal flags for the change in (1) won't work so easily, you need to set new Swift flags on the project settings in xcode, go to build settings and search for `other flags` and add -DDEBUG

The template project has been updated to reflect this changes