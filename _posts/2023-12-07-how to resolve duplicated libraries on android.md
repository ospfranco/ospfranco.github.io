---
layout: post
title: How to resolve duplicated libraries on Android
date: 2023-12-07
categories: post
permalink: /:title/
---

If you have developed on Android long enough, you might have found an error like this:

```sh
A failure occurred while executing com.android.build.gradle.internal.tasks.MergeNativeLibsTask$MergeNativeLibsTaskWorkAction
2 files found with path 'lib/arm64-v8a/libcrypto.so'
```

This is caused by two libraries/dependencies generating the same artifact (in this case, depending on OpenSSL which generates `libcrypto.so`). If you haven't declared your dependency on OpenSSL, then the problem is a transitive dependency (you require A and B, and both require C).

There are a number of workarounds, but they all have potential issues, so here are some short explanations.

# Exclude

The first solution you might try is the `exclude` command of gradle. This will only work if you are modifying the sources of one of the conflicting libraries. This basically tells Gradle: whenever you are packaging this library, exclude this files from the final bundle merge.

```groovy
packagingOptions {
      excludes = [
        // ... other excluded files
        "**/libcrypto.so"
      ]
}
```

This will basically force your final application to contain one `libcrypto.so` and avoid any potential conflicts. The problem is than, if you remove the other dependency and no one is left to generate the .so, then you are out of luck and you will get an error saying the file is missing.

# Pick first

Another possible strategy is using `pickFirst`, it basically tells Gradle: "whatever you find first, just link against that". The problem with this however is that it cannot be included in the offending library `build.gradle` but must be specified in the application's `build.gradle` (since that is the parent scope that faces the conflict when compiling the dependencies)

```groovy
packagingOptions {
  pickFirst '**/libcrypto.so'
}
```

# Other strategies

There are other strategies that work on pure gradle dependencies, which might or might not work on React Native but you can give them a try.

## Excluding group

Change the declared dependency to exclude the internal dependency

```groovy
implementation ('junit:junit:4.12'){
    exclude group: 'org.hamcrest', module:'hamcrest-core' // exclude the transtive dependency
}
```

## Explicitely requiring the dependency

```groovy
implementation 'junit:junit:4.12'
implementation 'org.hamcrest:hamcrest-core:1.3' // force the shared dependency version
```

## Force resolution

This might force an older version into the dependencies

```groovy
android {
    configurations.all {
        resolutionStrategy.force 'org.hamcrest:hamcrest-core:1.1'
    }
}
```

# Version missmatch

The problem with this solutions is that you are forcing a single version upon your dependencies, which might break because they might rely on the API of a particular version. I don't know how to include two versions of the same library unfortunately, so the actual solution is to make sure you are on the latest versions and they all depend on the same transitive dependency version.
