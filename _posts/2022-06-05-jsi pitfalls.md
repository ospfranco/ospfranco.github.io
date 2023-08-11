---
layout: post
title: React Native JSI/TurboModules pitfalls
date: 2022-06-05 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.JPG
---

Here is the latest information dump my findings with React Native's JSI.

# Speed is relative

C++ is the fastest but Swift is fast, Java ByteCode is also fast. Using JSI/TurboModules won't necessarily make your module faster. **The JSI is a communication layer**, therefore it excels in situations where you **transfer** a lot of data between native and JavaScript.

If you need to pass a few bytes once (or a few times), the old APIs are easier to work with and the performance penalty might be small enough that you might be better off skipping the JSI. Reading a small piece of data from AsyncStorage takes 5ms on release mode, so this extrapolates to any package that does a lot of calculation on the native side and then only returns a small chunk of data to JavaScript.

Here is a comparison, reading a small string ("hello"), one time (release mode -O2 optimized):

| Framework     | Time  |
| ------------- | ----- |
| MMKV          | > 0ms |
| Quick SQLite  | > 0ms |
| WatermelonDB  | > 8ms |
| Async Storage | > 5ms |

Artificial benchmarks testing reading the same value or calculating something thousands of times are... disingenuous.

Most frameworks have caches implemented to them, reading anything more than once results in testing if the cache is there. Other important details cannot be ignored: MMKV is a key/value storage, whereas Quick SQLite and WatermelonDB are relational databases on top of SQLite, comparing them is comparing apples to oranges.

Calculating data thousands of times will also mix JSI performance with C++/Swift/Kotlin performance, hard to tell when one ends and the other begins.

IMO it is better to test **transferring a large amount of data**. However, it is hard to find a test that actually makes sense, because details can affect the performance. Returning one large string will only mem-copy (Strings on your native code are not returned directly to JavaScript, but the memory needs to be copied to JSI Strings) once, whereas returning a lot of strings, will have allocate memory multiple times.

I can share some anecdotic experience of some people using Quick SQLite. [Takuya experienced 2x to 5x speed boost](https://dev.to/craftzdog/a-performant-way-to-use-pouchdb7-on-react-native-in-2022-24ej) when switching from the old bridge SQLite driver, user [@sallar](https://twitter.com/sallar) experienced 2x - 2.5x speed improvement, query time reduced from 600ms to ~250ms, with large SQLite queries. The larger your SQL results the better will Quick SQLite perform for you.

Just to be clear **JSI does cuts the overhead of communication**, transferring a few bytes once is just not the best use-case. It will also excel in cases where you transfer a small chunk of data but you need to do it very often, e.g. reanimated.

# I want to use XYZ programming language

Among the questions that get repeated over and over is "how can I use my favorite language?". I even made a video about it, [go watch it](https://www.youtube.com/watch?v=_I6bH5_rO2k&t=178s).

In the video I made a mistake, I made it sound like there is no possibility to use any other language, which is not technically correct. So here it is explained in a list so hopefully it will be clearer for everyone:

- Everything is based on the JSI.
- The JSI is C++.
- TurboModules generates C++ headers (meant to be used with ObjC++ and JNI C++).
- TurboModules currently only allow to use implement the generated headers with ObjC++ and JNI C++.
- **You can use any language you want, if you can call it from the native mobile languages**. If you can compile your code (and link it as a static library if necessary), you can just call it. It just misses the point of TurboModules, because a big reason is to give auto-generated type safety. Your compilation process might also become complex (e.g. using Rust)

You can use w/e you want, it's just that you will have to manually modify and sync your function signatures. And to be clear this is partly a limitation of JSI and in some cases compatibility between languages (e.g. Swift and C++ interoperability).

# It's so complex! Flutter is easy

Don't drink this cool-aid, all frameworks abstract the heavy-lifting for you. Even if you would write your app in native there would be occasions where you will have to deal with some complexity. If not on the language level, it would be on the API level, on some integration, on some framework model. etc. I have written a fair amount of native code at this point and I it doesn't get any easier.

I have already seen tweets from flutter devs complaining they are writing dart/swift/kotlin/c++ code at the same time. If you are interested in this topic you are going deep into the inner working of the frameworks, this is usually what it takes to build software at this level.

As far as I can see here are the options:

- Wait and hope someone solves your problem
- Create your own framework (With time you will hit the C++/Swift/Kotlin problem anyways)
- Pay someone to solve the problem for you
- DIY and enjoy the process

[Get in touch if you need help with the JSI](mailto:ospfranco@gmail.com).
