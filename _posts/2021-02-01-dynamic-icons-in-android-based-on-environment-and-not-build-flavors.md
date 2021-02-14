---
layout: post
title: Dynamic icons in android based on environment and not build flavors (react-native)
date: 2021-02-01 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

On a previous [post](/post/2020/09/17/replace-ios-icon-based-on-environment/) I described how replace your mobile application's icon based on environment variables on iOS, now is the turn for android!

Unlike many of the tutorials you will find out there, this is not based on `ProductFlavors`, because ProductFlavors force you to use different package names, which means you have to change not only your CI but also your distributables on the play store, etc. If you already have your infra set up, this is way too much work for a simple icon replacement.

## Gradle...

So, I stumbled my way with Gradle, short rant: who the hell thought Gradle was a good idea? it's like a language without a strict syntax, it's is mega obscure, because there is so many commands and definitions and... jesus, the amount/quality of questions and answers on StackOverflow, anyways I'll save you the work if you are not a seasoned android developer of fumbling through obscure documentation Gradle docs.

We are going to hook into two points in time, pre build phase, where we will replace our icons and then hook up into the last part of the install phase (on the android device) to clean up our mess.

## 1. Create the icon sets

So for this all I did was take the contents of `android/app/main/res` and create 2 copies in the root folder, one for `production` (unedited icons, copied as is) and one for `staging` (change the colors, add a text, use whatever image editing tool you want).

We will use these icon sets to dumb replace and restore the app icons

## 2. Create a replace script and a restore script

So here are the contents of my scripts

### Replace script

```bash
#!/bin/bash

if [ $ENVFILE = ".env.staging" ]; then
  SOURCE_PATH="../storage/app_icons/android/staging/."
  TARGET_PATH="../android/app/src/main/res"

  cp -a "${SOURCE_PATH}" "${TARGET_PATH}"
  # You have to emit a string at the end for gradle to continue building the app
  echo "Replaced STAGING icons on android app"
fi
```
> So, like all the posts I write, you have to use your head a bit, in my case, the "flavor" of my app is determined by which env file is being used, in you case it could be something else entirely, adjust the scripts as you must

### Restore script

```bash
#!/bin/bash

SOURCE_PATH="../storage/app_icons/android/production/."
TARGET_PATH="../android/app/src/main/res"

cp -a "${SOURCE_PATH}" "${TARGET_PATH}"
# You have to emit a string at the end for gradle to continue building the app
echo "Restored PRODUCTION icons on android app"

```

So done, if you run this files in your own and then build your app you can see clearly it is just dumbly replacing the icon of your app before building the final artifact and the other one will be restoring the original icons

### Hookin' into Gradle

Now comes the most fun part if you are not an android dev or know nothing of Gradle (or want to... I sincerely don't want to learn more of it), we just have to hook up our scripts at the correct points

so in your `app/build.gradle` file, add the following tasks:

```gradle
// Custom tasks for icon replacement
task iconReplacement {
  doLast {
    def proc = (projectDir.getPath() + "/../../scripts/androidIconEnvReplace.sh").execute()
    proc.waitForProcessOutput(System.out, System.err)
  }
}

task iconRestore {
  doLast {
    def proc = (projectDir.getPath() + "/../../scripts/androidIconRestore.sh").execute()
    proc.waitForProcessOutput(System.out, System.err)
  }
}
```
> You can add them anywhere (top of the file, outside of the android main body)

> Don't ask me why you need the `doLast` thing, if you don't the task automatically runs (why in the name of god...), there is a bunch of weird sintax flowing in the internet (some of it has to do with Groovy? wtf?), just don't worry about it and use them as is

And then within the body of the `android {` thingy, add this:

```gradle
    // preBuild seems to be a pure Gradle step, no android stuff, we just replace the icons
    preBuild.dependsOn iconReplacement

    // For some unholy reason, the android gradle tasks are dynamic (if you used flavors or signing configs you know this)
    // So basically we have to hook up to the lifecycle methods after they have been created
    tasks.whenTaskAdded {
      addedTask ->
        // if you have a install task means you are running this on your local machine and we need to discard our changes (restore icons)
        // otherwise Git gets dirty, on the cloud builds we don't care, the build folder gets discarded anyways
        if(addedTask.name.contains('install')) {
          addedTask.finalizedBy {
            iconRestore
          }
        }
    }
```

And voila, now your android apps should be reflecting the environment it is running against (according to your own definition 😉)