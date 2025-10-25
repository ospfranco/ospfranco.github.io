---
layout: post
title: React Native RCTRootViewFactory (Brownfield apps)
date: 2025-01-21
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

As I was upgrading one of my RN macOS projects I was having crashes when bumping to the latest version of RN. My app is heavily customized and uses a brownfield approach. The view which hosts React Native is not the entry point of the app, but rather I manually create it an load it into an NSPanel.

There has been a lot of changes with the new architecture of React Native and a class `RCTRootViewFactory` has been introduced to help brownfield apps having to initialize a bunch of internal objects. However, there is a lack of documentation.

The base class was contributed by Oskar and [announced on twitter](https://x.com/o_kwasniewski/status/1764971481778323529), there is also this [callstack article](https://www.callstack.com/blog/simplify-your-ios-brownfield-integration-with-rootviewfactory), but both are a bit incomplete or not indexable

I'll just dump you the code right here (for a Swift entry point)

```swift
import Foundation
import React_RCTAppDelegate

// Inhering from RCTAppDelegate instead of NSAppDelegate and/or NSObject
@NSApplicationMain
@objc
class AppDelegate: RCTAppDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
      RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
      Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }

  // Use this one to customize the rootview before it is returned
  override func customize(_ rootView: RCTRootView) {
    rootView.wantsLayer = true
    rootView.backgroundColor = .clear
    rootView.layer?.backgroundColor = .clear
  }


  // didFinishLaunching for macOS apps, for iOS it is slightly different (returns a BOOL) just overload the correct one
  override func applicationDidFinishLaunching(_ notification: Notification) {
    self.automaticallyLoadReactNativeWindow = false // Important to prevent RCTAppDelegate from trying to init the default RN View
    super.applicationDidFinishLaunching(notification) // Needs to be called on the latest versions to initialize all the internal RN variables and state

    let rootView = self.rootViewFactory.view(withModuleName: "[Your bundle name]") // Finally create a RN Hosting View`
    // add it to your NSWindow or HostingNSView
  }
}
```

The beauty of this abstraction is that it should be future proofed whenever the framework changes, preventing weird crashes and errors. If you turn on the flags you can do it programmatically from the constructor.
