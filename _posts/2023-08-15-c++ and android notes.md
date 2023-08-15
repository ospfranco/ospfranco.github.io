---
layout: post
title: C++ and Android notes
date: 2023-08-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.JPG
---

Random notes I take as I write C++ for Android

# Standard Template Library (STL)

The Standard Template Library (STL) is a set of C++ template classes to provide common programming data structures and functions such as lists, stacks, arrays, etc. It is a library of container classes, algorithms, and iterators. It is a generalized library and so, its components are parameterized.

To use the STL, one would have to depend on a “shared library” (for simplicity, we’ll call it `libc++.so`) in the system one is executing the binary in. There are two ways to link this “shared library”, either statically or dynamically.

## Static vs Dynamic Linking

Statically means that the C++ runtime will be bundled with the C++ binary.

Dynamically means that the C++ binary will *not* include C++ runtime, but will utilize the system’s dynamic linker in order to find the necessary STL methods.

# One STL per-app

Quoting from the relevant pages in [developer.android.com](https://developer.android.com/ndk/guides/cpp-support#one_stl_per_app):

> An application should not use more than one C++ runtime. The various STLs are not compatible with one another.

### Nuclear explosion example

- You try to compile your app with `ANDROID_STL=gnustl_static`
- 3rd-party library foo has `ANDROID_STL=c++_shared`

Two STLs, GNU’s and LLVM’s, will exist in one app. Both STLs have functions and structures that will go through different [name mangling](https://www.ibm.com/support/knowledgecenter/en/ssw_ibm_i_72/rzarg/name_mangling.htm) processes which would produce unique function names. So for example, `std::to_string` could exist with the mangled name of `_ZN9to7string6E` in LLVM’s STL and `_AX8to2string5D` in GNU’s STL. This is actually good. When calling one `std::to_string` from a native function that is expecting GNU’s mangled name, it will get GNU’s version of `std::to_string` and vice versa.

The issues occur when both STLs produce **the same** mangled name, which is very much the case in `std::exception`, for example. Or another issue occurs when `[std::to_string` exists in one STL and does not exist at all in another STL](https://stackoverflow.com/questions/22774009/android-ndk-stdto-string-support).

### Not so nuclear example

- App has `ANDROID_STL=gnustl_static` 

- 3rd-party library foo has `ANDROID_STL=c++_static`

This situation differs from Case #1 since there is no dynamic linking neither in the app nor in the 3rd-party library foo. This is gonna cause two STLs to exist in the same app space where all global data, static constructors and imported functions to also exit in the app space, but that still should not cause any linkage issues **only as long as** the two runtimes have zero communication between each other.

To note, [Facebook’s Yoga](https://github.com/facebook/yoga/) builds two shared libraries natively, `libfb.so` and `libyoga.so`, both of which are built with, as of the time of writing, `c++_static`, which is LLVM’s C++ static runtime variant. This means that they don’t have to worry about the app developer including GNU’s STL or some other STL in the mix. More on this issue [here](https://github.com/facebook/yoga/issues/813)

# Android header libraries

The NDK exposes some libraries out of convenience, but unfortunately not all of them (curl, sqlite, etc are not available)

https://developer.android.com/studio/projects/configure-cmake

After much trial and error I found no easy-to-break way of linking against the OS libsqlite. It’s just not worth it also because each vendor can potentially modify them and also on older OS versions you are using outdated versions.