---
layout: post
title: Cocoapods, use_frameworks with static linking
date: 2023-10-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.JPG
---

`use_frameworks!` tells CocoaPods that you want to use Frameworks instead of Static Libraries. Swift didn't support frameworks back in the day, but now it should work. However, every once in a hilw you might need to turn it on and might face compilation error in some other library (e.g. vision-camera).

In this case, you can actually use frameworks, yet still force static compiling. Replace `use_frameworks!` with:

```ruby
use_frameworks! linkage: :static
```

# Frameworks

In case you didn't know frameworks are just an Apple concept to package different architectures into a single file. Nothing fancy to it. Inside the `.framework` file you might find folders per architecture and a `.plist` file. So there should be no reason not to able to statically link the dependency.
