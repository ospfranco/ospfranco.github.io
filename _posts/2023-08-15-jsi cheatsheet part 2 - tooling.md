---
layout: post
title: JSI Cheatsheet&#58; Part 2 - Tooling
date: 2023-08-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/oscar.jpg
---

Now that you know C++ ([JSI Cheatsheet Part I: C++](https://www.notion.so/JSI-Cheatsheet-Part-I-C-f1872d77ee4c4dc3b9563fa6cb3005f6?pvs=21)) you are ready to tackle some of the other delicacies of coding in C++, namely how compilation and linking works.

# Contents

# Basics

Same as before, there are many resources how basic C++ compilation work, but here are the basics

The compilation of a C++ program involves three steps:

1. Preprocessing: the preprocessor takes a C++ source code file and deals with the `#include`s, `#define`s and other preprocessor directives. The output of this step is a "pure" C++ file without pre-processor directives.
2. Compilation: the compiler takes the pre-processor's output and produces an object file from it.
3. Linking: the linker takes the object files produced by the compiler and produces either a library or an executable file.

## Preprocessing

The preprocessor handles the _preprocessor directives_, like `#include` and `#define`. It is agnostic of the syntax of C++, which is why it must be used with care.

It works on one C++ source file at a time by replacing `#include` directives with the content of the respective files (which is usually just declarations), doing replacement of macros (`#define`), and selecting different portions of text depending of `#if`, `#ifdef` and `#ifndef` directives.

The preprocessor works on a stream of preprocessing tokens. Macro substitution is defined as replacing tokens with other tokens (the operator `##` enables merging two tokens when it makes sense).

After all this, the preprocessor produces a single output that is a stream of tokens resulting from the transformations described above. It also adds some special markers that tell the compiler where each line came from so that it can use those to produce sensible error messages.

Some errors can be produced at this stage with clever use of the `#if` and `#error` directives.

## Compilation

The compilation step is performed on each output of the preprocessor.

The compiler parses the pure C++ source code (now without any preprocessor directives) and converts it into assembly code. Then invokes underlying back-end(assembler in toolchain) that assembles that code into machine code producing actual binary file in some format(ELF, COFF, a.out, ...). This object file contains the compiled code (in binary form) of the symbols defined in the input. Symbols in object files are referred to by name.

Object files can refer to symbols that are not defined. This is the case when you use a declaration, and don't provide a definition for it. The compiler doesn't mind this, and will happily produce the object file as long as the source code is well-formed.

Compilers usually let you stop compilation at this point. This is very useful because with it you can compile each source code file separately. The advantage this provides is that you don't need to recompile _everything_ if you only change a single file.

The produced object files can be put in special archives called static libraries, for easier reusing later on.

It's at this stage that "regular" compiler errors, like syntax errors or failed overload resolution errors, are reported.

## Linking

The linker is what produces the final compilation output from the object files the compiler produced. This output can be either a shared (or dynamic) library (and while the name is similar, they haven't got much in common with static libraries mentioned earlier) or an executable.

It links all the object files by replacing the references to undefined symbols with the correct addresses. Each of these symbols can be defined in other object files or in libraries. If they are defined in libraries other than the standard library, you need to tell the linker
about them.

At this stage the most common errors are missing definitions or duplicate definitions. The former means that either the definitions don't exist (i.e. they are not written), or that the object files or
libraries where they reside were not given to the linker. The latter is obvious: the same symbol was defined in two different object files or libraries.

# CMake

That's the theory, by now you probably know how you compile and execute a single C++ file:

```jsx
gcc -o hello hello.cpp
```

Now, if you have multiple files you need to compile you need to cram them into a single command and then quickly spin out of control, since the order on which you define your files might produce compilation errors of missing symbols

So, we are going to jump a bit ahead and talk about [CMake](https://cmake.org/).

CMake takes care of many things for you: building, packaging, testing, etc. It's like some parts of npm for the c++ world. If you want to write C++ for android you will use CMake and more specifically a `CMakeLists.txt` that will define your compilation process

CMake is not used on iOS.

Since we are trying to be practical, you care about the `CMakeList.txt` file, here is an example:

```jsx
// Tell which version of CMake is required
// Check your android version, since they come bundled with the build-tools
cmake_minimum_required(VERSION 3.4.1)

set (CMAKE_VERBOSE_MAKEFILE ON)
// set the version of C++ you are going to use
set (CMAKE_CXX_STANDARD 11)

// Include all the directories with .cpp files that will need to be compiled
include_directories(
  ../cpp
  ../../react-native/React
  ../../react-native/React/Base
  ../../react-native/ReactCommon/jsi
)

// create a library "sequel", which needs to compile all the following files
add_library(sequel
  SHARED
  ../../react-native/ReactCommon/jsi/jsi/jsi.cpp
  ../cpp/sequel.cpp
  ../cpp/sequel.h
  ../cpp/SequelResult.h
  ../cpp/react-native-quick-sqlite.cpp
  ../cpp/react-native-quick-sqlite.h
  ../cpp/sqlite3.h
  ../cpp/sqlite3.c
  cpp-adapter.cpp
)

// link the following libraries together
// in this case I link android specific libraries and logging library
// so I can log to the android console from my CPP code
// on iOS this is not necessary (iOS doesn't even use CMakeLists)
target_link_libraries(sequel android log)
```

CMake is a world on it's own, [the wikipedia article](https://en.wikipedia.org/wiki/CMake) gives a good high level overview, but if you are developing your JSI module this should be more than enough: just include all your header and cpp files in your CMakeLists and link any android libraries as necessary

# C++ on 📱

Let's go back to some of the basic stuff, you now know: how to write C++, how to compile C++, the question is now, how do you run C++ on iOS or Android? Is this some new RN-only feature?

No, the truth of the matter is that, every single computer out there can run C/C++ (as long as there is a compiler for it) but you as a JavaScript developer probably never heard of this, the mechanisms which allow you to run C++ code on each platforms are a bit different though

## iOS and Obj-C

Obj-C is actually a subset/compatible with C++ code... it's just kinda weird. You have obj-c files (`.m`) and if you change their extension (`.mm`) you can use C++ code inside of the obj-c code, this also means you don't need to set up any tooling to compile C++ code.

Just put your `cpp` files in your project and you can include them just fine.

## Android JNI

Android is a bit different, since Android works with Java/Kotlin, it does not produce binary code and cannot interact with native code written in C++. Therefore you need a translation/interaction layer called [JNI](https://developer.android.com/training/articles/perf-jni).

It's super cumbersome and has it's own syntax, but it's all we have to expose our functionality to the Java/Kotlin/Javascript side of things.

Here is an example of JNI code that exposes a couple of functions to the Java (which is necessary for you to register your JSI callbacks)

```cpp
#include <jni.h>
#include "react-native-quick-sqlite.h"

extern "C" JNIEXPORT void JNICALL
Java_com_reactnativequicksqlite_SequelModule_initialize(JNIEnv *env, jclass clazz, jlong jsiPtr, jstring docPath)
{
  jboolean isCopy;
  const char *docPathString = (env)->GetStringUTFChars(docPath, &isCopy);

  installSequel(*reinterpret_cast<facebook::jsi::Runtime *>(jsiPtr), docPathString);
}

extern "C" JNIEXPORT void JNICALL
Java_com_reactnativequicksqlite_SequelModule_destruct(JNIEnv *env, jclass clazz)
{
  cleanUpSequel();
}
```

You can see your function names need to have a defined structure:

- `java_` = expose this to the java side
- `com_reactnativequicksqlite` = name of the package that will be created for you
- `SequelModule` = Module name
- `initialize` = final function name

Like all things Android/Google the documentation is piss poor and written by robots, but if you are only interested in writing JSI module, the two functions above are all you will need

Another interesting pain point, is that you cannot just use any C++ dynamic library on android, android has it's own flavor of dynamic libraries (.AAR) if you know how to generate them... you are a god, if not you have to rely on the ones published by google... there is 2 of them, I opted for the easy path and completely included the sqlite.c code in my library

To be honest compilation and native toolchains are so f\*\*\*\* complicated I cannot dive deeper without confusing you even more (even I'm confused until this day), however feel free to reach out if you need some other point explained.

# IDE support

Now, if you are about to embark into writing your own JSI module I can give you some useful pointers here

## VSCode is 💩 for C++

I tried to set up code for developing my own JSI module, there is a plugin works well enough, but does not correctly resolve the native dependencies and the compilation chain, so all you will get is errors saying it cannot find the header files.

You could try to manually pass the include paths to vscode somehow to try to guide it into correctly resolving the dependencies... but this was too much work for me because:

## XCode is 💩 but works

XCode is a terrible code editor, period. But it already knows how iOS/C++ works, if you open your project in it, it will immediately pick up your C++ files, autocompletion works, error detection (before compilation) works... so I just went with this. You can even manually format your code... if that is some consolation.

![Open your cpp files with the quick-open tool (Cmd + Shift + O)](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/796e9467-4ab9-4cf5-bddb-2338e3f9612c/Screen_Shot_2021-08-15_at_10.40.41.jpg)

Open your cpp files with the quick-open tool (Cmd + Shift + O)

![Autocompletion, error detection, etc. works](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/2fc26234-64b9-4b47-a13a-52d09e5acd90/Screen_Shot_2021-08-15_at_10.41.10.jpg)

Autocompletion, error detection, etc. works

## Android Studio 🤷🏽‍♂️

If you are a big android fan you can probably make it work, but once I had the iOS version of my JSI package working, the only code I needed was the glue to compile and link the library to the android side of things, so here you can use whatever you want to write java/kotlin.
