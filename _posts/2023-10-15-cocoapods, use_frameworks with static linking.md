---
layout: post
title: Cocoapods, use_frameworks with static linking
date: 2023-10-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/oscar.jpg
---

`use_frameworks!` tells CocoaPods that you want to use XCFrameworks instead of Static Libraries. However, turning on use_frameworks will try to link all dependencies as dynamic, every once in a while you might need to turn it on and might face compilation error in some other library (e.g. vision-camera).

In this case, you can actually use frameworks, yet still force static compiling. Replace

```ruby
use_frameworks!
```

with

```ruby
use_frameworks! linkage: :static
```

# XCFrameworks

In case you didn't know frameworks are just an Apple concept to package different architectures into a single file. Nothing fancy to it. Inside the `.xcframework` file you might find folders per architecture and a `.plist` file.
