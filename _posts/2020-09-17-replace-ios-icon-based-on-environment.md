---
layout: post
title: Replace iOS icon based on environment
date: 2020-09-17 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

When you have multiple environments it is hard to track which application you might have installed in your phone, in the not so important scenarios it is annoying, your team might be confused and report bugs on WIP builds, but on more serious scenerios you might publish a development build to production and that is a lot more serious.

This is what happened to us at BodyFast this week and here is just one quick way to prevent it: give your app a different icon based on the configuration, now in the past I've done this via app flavors for Android and build configurations for iOS, but that process is technically convoluted and also does not work for our use case, so I needed simpler this time around.

So we are going to highjack the build process of iOS to replace the icons based on some configuration file.

## 1. Get your icons ready

Create all the icons you need, usually to do this I would only change the background or icon color and slap a big "Staging" or "debug" text in front to get rid of all ambiguity, you only need to create a 1024x1024 version and there are many scripts out there that do the resizing for you

## 2. Add a run script

Go to xcode -> select your project -> select "Build Phases" -> Add a new "run script"

Here is the content of the script:

```
IFS=$'\n'

CONFIG=production

function generateIcon () {
  BASE_IMAGE_NAME=$1
  
  SOURCE_PATH="${SRCROOT}/../storage/app_icons/${CONFIG}/${BASE_IMAGE_NAME}"
  TARGET_PATH=$(find "${SRCROOT}/BodyFast/Images.xcassets" -name $BASE_IMAGE_NAME)
  echo "Copying ${SOURCE_PATH} into: ${TARGET_PATH}"
  cp $SOURCE_PATH $TARGET_PATH
}

if grep -q development ../.env; then
  echo "Found debug config"
  CONFIG=debug
fi

if grep -q staging ../.env; then
echo "Found staging config"
  CONFIG=staging
fi

echo "Replacing app icons based on configuration"

generateIcon "AppIcon20x20@2x.png"
generateIcon "AppIcon20x20@2x~ipad.png"
generateIcon "AppIcon20x20@3x.png"
generateIcon "AppIcon20x20~ipad.png"
generateIcon "AppIcon29x29.png"
generateIcon "AppIcon29x29@2x.png"
generateIcon "AppIcon29x29@2x~ipad.png"
generateIcon "AppIcon29x29@3x.png"
generateIcon "AppIcon29x29~ipad.png"
generateIcon "AppIcon40x40@2x.png"
generateIcon "AppIcon40x40@2x~ipad.png"
generateIcon "AppIcon40x40@3x.png"
generateIcon "AppIcon40x40~ipad.png"
generateIcon "AppIcon50x50@2x~ipad.png"
generateIcon "AppIcon50x50~ipad.png"
generateIcon "AppIcon57x57.png"
generateIcon "AppIcon57x57@2x.png"
generateIcon "AppIcon60x60@2x.png"
generateIcon "AppIcon60x60@3x.png"
generateIcon "AppIcon72x72@2x~ipad.png"
generateIcon "AppIcon72x72~ipad.png"
generateIcon "AppIcon76x76@2x~ipad.png"
generateIcon "AppIcon76x76~ipad.png"
generateIcon "AppIcon83.5x83.5@2x~ipad.png"
```

let's break it down:
- First we need to find out which environment is currently being build, for us is fairly simple, we have a `.env` that get's symlinked at the beginning of our compilation process, a simple GREP inside of the file to search for a keyword does the trick of detecting which "environment" is the app going to tbe connected to
- Once we now the environment we can start replacing all the icons, the source path as you can imagine is where you have placed the icons for all the different flavors, you will need to replace it with your own value
- The target path is where we are going to highjack the process, basically we are going to replace the conents of the `.xcassets` file via code, now there are some important caveats here; 1. your icons need to have the same name from the moment you generate them to the moment you replace them, in order to make my life easier [I have forked the script I use](https://github.com/ospfranco/ios-icon-generator) and just generate all of the files with the final naming xcode uses internally, 2. You might not need all the files I presented, we are using an old xcassets file and depending on which devices you support you might need/want to get rid of some of the lines
- Once we have all the icons a simple `cp` command replaces the contents

and there you have it, you should be able to easily tell your different app environments now, if you couple this with your CI/CD it is even more convenient.

Cheers