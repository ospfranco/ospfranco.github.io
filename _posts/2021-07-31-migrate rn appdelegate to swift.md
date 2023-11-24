---
layout: post
title: Migrate React Native's AppDelegate to Swift
date: 2021-07-31 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/oscar.jpg
---

It's no secret that JS developers run away from Objective-C, why not migrate the entry point of your app to Swift?

Just bare in mind, this won't make your app completely run on Swift, just the entry point, but at least it should be easier to understand at least the basic methods and entry points of other libraries/functionalities.

This tutorial was created with RN 0.64

# 1. Delete AppDelegate.h, AppDelegate.m and main.m

Just delete this files, we won't need them. There is one caveat here though, as time passes the code inside of the original AppDelegate might change to what is on this post, so pay attention on your own to see if any changes are necessary.

# 2. Create an AppDelegate.swift

Right-click the base folder -> New file... -> Swift file -> AppDelegate.swift, after you create it XCode should ask you if you want to create a Bridging header file, click on yes.

The content of the new `AppDelegate.swift` file:

```swift
import Foundation
import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?
  var bridge: RCTBridge!

  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    let jsCodeLocation: URL

    jsCodeLocation = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index", fallbackResource:nil)
    let rootView = RCTRootView(bundleURL: jsCodeLocation, moduleName: "YOUR_PROJECT_NAME", initialProperties: nil, launchOptions: launchOptions)
    let rootViewController = UIViewController()
    rootViewController.view = rootView

    self.window = UIWindow(frame: UIScreen.main.bounds)
    self.window?.rootViewController = rootViewController
    self.window?.makeKeyAndVisible()

    return true
  }
}
```

# 3. Fill the bridging header

On your bridging header put the following content:

```swift
#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTRootView.h>
#import <React/RCTUtils.h>
#import <React/RCTConvert.h>
#import <React/RCTBundleURLProvider.h>
```

# 4. Fix swift compilation

If you try to build the application you will get some errors regarding missing swift dependencies, I can't really explain why this is happening, but in order to solve it go to your project build setting's and change the library search paths as follows:

**On the project wide settings**

![Project settings]({{site.url}}/assets/swift_project_settings.jpg "Project settings")

Delete the old entries and replace them with a single entry looking for the swift-5.2 libraries

**On the target settings**

![Target settings]({{site.url}}/assets/swift_target_settings.jpg "Target settings")

Add a new entry just like the one you left at the project level settings

# 5. Profit

You should now be able to compile your React Native application!

As stated this doesn't mean that your app is now running on Swift, but might make it easier for you to add functionality on the native side of things. I started this work because I'm looking into turbo modules and objective-c is just too damn hard to understand to the untrained eye, so I'm expecting it will help me solve the mysteries of enabling Turbo Modules.

I haven't used technique in production, so integrating other libraries in an open question for me. The lifecycle methods should be easy enough for you to figure out, but importing and calling obj-c libraries might require a bit of work.

**This technique was inspired by the work I did on my React Native for macOS online course, [check it out](https://www.newline.co/courses/building-react-native-apps-for-mac)!**
