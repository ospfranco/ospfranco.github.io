---
layout: post
title: How to build a React-Native macOS menu bar app
date: 2020-05-23 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
excerpt: A guide to create your own menu bar app using React Native
---

**UPDATE**
I have now launched an online class on how to make macOS apps using react-native, this article is only a tiny part of all the knowledge in the course, [sign up now!](https://www.newline.co/courses/building-react-native-apps-for-mac).

-------

So I first saw a tweet about creating a Expo-Electron based macOS menu bar apps, which I found the idea interesting, since Tempomat has been on the market for a couple of weeks already but the process of learning and mastering native APIs, swift and SwiftUI was not easy at all

After sucessfully porting my native SwiftUI app to react-native-macos, here are the steps you can follow too
## 1. Create a RN project


```npx react-native init myApp --template react-native-template-typescript```

A simple rn project, nothing fancy here

## 2. Add macOS support


This is bound to change, you should always follow the instructions on the microsoft react-native-macos site, but for now you can do:

```
cd myApp
npx react-native-macos-init
```

Afterwards you should have a basic RN mac os app, you can try to run it and it will open a normal window

## 3. Start by removing Objective-C

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

> Since we are using Swift, the normal flags preprocessor flags (DEBUG) won't work, you need to set new Swift flags on the project settings in xcode, go to build settings and search for `Other swift flags` on the macOS target and add `-DDEBUG` to te debug config

> You have to change the module name when registering the root view, in the above snippet it is "tempomat" should be w/e you named your react-native project.

That should get you started to have a working status bar item that you can click on.

## 4. Clean up a few other things

If you don't want your app to appear on the macOS dock and sit on the background (you won't be able to alt-tab to it): on your info.plist you need to set the value `Application is agent (UIElement)` to `YES`

On your `Main.storyboard` file, delete the old references to the ViewController and the window, and you also have to change the app delegate on the right side attribute panel and give it your macos module, otherwise it won't be picked up, here is a screenshot that should guide you on where to look 👀:

![AppDelegate Module]({{site.url}}/assets/AppDelegateattribute.JPG "AppDelegate Module")

I did run into some weird swift compilation chain error, I think it was because of Flipper support in RN 0.62, make sure that on your target settings `DEAD_CODE_STRIPPING` is set to `YES` and `Always embed swift libraries` is also set to `YES`

## 5. Profit

Done, you should be able to hit the run button via xcode (or run the app via `npx react-native run-macos`) and should see your RN menu bar running!

![Menubar App]({{site.url}}/assets/RNMENUBARAPP.JPG "Menubar App")

> a lot of libraries have added macos support since this article was published, this steps may no longer be necessary, but it is still useful if you need to work around some issue, react-navigation should work fine out of the box now for example

BUT, there is catch, right now react-native-macos is so fresh... pretty much none of the existing libraries are working, and sometimes that will also mess up your `pod install` react native vector icons work fine if you follow the macOS steps, but I ended up creating the following yarn command to being able to run pod install without autolinking messing with it:

```json
"macos:install": "cd node_modules/react-native-vector-icons && mv RNVectorIcons.podspec X && cd ../../macos && pod install && cd ../node_modules/react-native-vector-icons && mv X RNVectorIcons.podspec"
```

You also won't have the latest version of react-navigation working, I got the latest version of the v2 working and that is fine for now... so yeah, a lot of compromises, but the future looks bright!

Here is a [template repository](https://github.com/ospfranco/rn-macos-menubar-template) with all the changes in this article, surely you will find it useful, you can also check out [Tempomat](https://github.com/ospfranco/tempomat) for more advanced code.


