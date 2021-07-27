---
layout: post
title: React-native JSI module tutorial
date: 2021-02-24 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.jpeg
twitter:
  username: "ospfranco"
  image: "assets/profile.jpeg"
---

# Before you start

I created a [SQLite react-native library](https://github.com/ospfranco/react-native-quick-sqlite) it's super fast and the reason I could write this article, it would be great if you can leave a star on it!

If you are interested in other react-native content, check out my course of [react-native for macOS](https://www.newline.co/courses/building-react-native-apps-for-mac), it really helps me to put great content if you buy it!

# JSI

JSI is a new translation layer between the JavaScript and C++, it's implemented on the JS engine itself and it's a lot faster than the React-Native bridge. This is step-by-step guide to creating a basic JSI module.

## Creating the base module

We are going to use [react-native-builder-bob](https://github.com/callstack/react-native-builder-bob), to scaffold a new (separate) module, builder-bob already supports creating cpp modules, via the old bridge.

Start by initializing:

```bash
npx react-native-builder-bob create react-native-awesome-module
```

After a bunch of questions, it will also ask you which type of project you want, select the **C++** option, this won't create a JSI module, but it will set up the necessary compilation for C++.

# Start with iOS

Go to the `iOS` folder and modify the created **header file** (.h) and **obj-c file** (.mm).

> Note: Wherever you see "react-native-sequel" just replace your package name.

You should have something like this:

Header file, `react-native-sequel.h`:

```c++
#import <React/RCTBridgeModule.h>
#import "react-native-sequel.h"

@interface Sequel : NSObject <RCTBridgeModule>

@property (nonatomic, assign) BOOL setBridgeOnMainQueue;

@end
```

Implementation file, `react-native-sequel.mm`:

```obj-c
#import "Sequel.h"
#import <React/RCTBridge+Private.h>
#import <React/RCTUtils.h>
#import "react-native-sequel.h"

@implementation Sequel

@synthesize bridge=_bridge;
@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (void)setBridge:(RCTBridge *)bridge {
  _bridge = bridge;
  _setBridgeOnMainQueue = RCTIsMainQueue();

  RCTCxxBridge *cxxBridge = (RCTCxxBridge *)self.bridge;
  if (!cxxBridge.runtime) {
    return;
  }

  installSequel(*(facebook::jsi::Runtime *)cxxBridge.runtime);
}

- (void)invalidate {
  cleanUpSequel();
}

@end
```

Without going into detail, a couple of things to notice:

- We are importing the **React/RCTBridge+Private** header file, which is the one that exposes the jsi bindings.
- The important work is done on the **setBridge** function, here we get a reference to the `cxxBridge.runtime`, this is a **runtime** object that is necessary for all the manipulations in the C++ code to create JavaScript values. We pass this runtime into a `installSequel` (you can rename it later) function where we will create the JSI bindings.

### Actual bindings

You can now go to the `cpp` folder in the root of the project, there builder-bob should have created some basic c++ for you to use, you can delete it and create a header file (react-native-sequel.h in my case) and it's implementation (react-native-sequel.cpp).

For our header file:

```c++
#include <jsi/jsilib.h>
#include <jsi/jsi.h>

void installSequel(facebook::jsi::Runtime& jsiRuntime);
void cleanUpSequel();
```

> We are basically exposing the two functions we used in the bridging code inside the iOS folder

For our implementation:

```c++
// Import our header file to implement the `installSequel` and `cleanUpSequel` functions
#include "react-native-sequel.h"
// sstream contains functions to manipulate strings in C++
#include <sstream>

// The namespace allows for syntactic sugar around the JSI objects. ex. call: jsi::Function instead of facebook::jsi::Function
using namespace facebook;

// We get the runtime from the obj-c code and we create our native functions here
void installSequel(jsi::Runtime& jsiRuntime) {
  // jsi::Function::createFromHostFunction will create a JavaScript function based on a "host" (read C++) function
  auto multiply = jsi::Function::createFromHostFunction(
    jsiRuntime, // JSI runtime instance
    jsi::PropNameID::forAscii(jsiRuntime, "multiply"), // Internal function name
    1, // Number of arguments in function
    // This is a C++ lambda function, the empty [] at the beginning is used to capture pointer/references so that they don't get de-allocated
    // Then you get another instance of the runtime to use inside the function, a "this" value from the javascript world, a pointer to the arguments (you can treat it as an array) and finally a count for the number of arguments
    // Finally the function needs to return a jsi::Value (read JavaScript value)
    [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {

      // the jsi::Value has a lot of helper methods for you to manipulate the data
      if(!arguments[0].isNumber() || !arguments[1].isNumber()) {
        jsi::detail::throwJSError(runtime, "Non number arguments passed to sequel");
      }

      double res = 42;
      return jsi::Value(res);
    }
  );

  // Registers the function on the global object
  jsiRuntime.global().setProperty(jsiRuntime, "multiply", std::move(multiply));
}

void cleanUpSequel() {
  // intentionally left blank
}
```

As of this writing there is little documentation for the JSI bridge and it's bindings, the [JSI source code](https://github.com/facebook/react-native/blob/master/ReactCommon/jsi/jsi/jsi.cpp) is the best source of information, but some descriptions:

### jsi::Value

Is a wrapper for javascript values, there are some values you can create directly by just calling it, for example booleans and numbers, other stuff like strings are a bit more complex, they require encoding (ex. UTF8) to decode/encode (here is an [example](https://github.com/craftzdog/react-native-quick-base64/blob/master/cpp/react-native-quick-base64.cpp))

### jsi::detail::throwJSError

To throw a JS error to the javascript code. Note that the function we created is synchronous, and because it can throw an error, you need to wrap it in a try/catch when you call it from the JavaScript side.

### Careful with C++ and memory management

There are other convenience methods for dealing with JSIValues such as `isNumber`, `isString` (do note that javascript numbers are always doubles). Once you start dealing with objects things get more complicated, you need to be able to move (`std::move`) values around, so that they don't get wiped from memory once your function ends.

### Exposing a sensible API

Finally, on our index.ts file we can create bindings for this function (I'm not sure if they also get exposed to the wrapper app, for now I created a dumb wrapper), having typescript also allows for type checking on the JS level

```ts
// /src/index.tsx
declare function multiply(a: number, b: number): number;

export function multiplyA(): number {
  return multiply(2, 2);
}
```

and finally on the react-native app that uses this module:

```tsx
import * as React from "react";

import { StyleSheet, View, Text } from "react-native";
import { multiplyA } from "react-native-sequel";

export default function App() {
  const [result, setResult] = React.useState<number | undefined>();

  React.useEffect(() => {
    setResult(multiplyA());
  }, []);

  return (
    <View style={styles.container}>
      <Text>Result: {result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
```

# Android side

Now that we have a working iOS implementation, we can take a look into android.

We are going to start by modifying the file inside `android/CMakeLists.txt`, this file tells the android compilation process which c++ files to compile, you should have something like this:

```
cmake_minimum_required(VERSION 3.4.1)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 11)

include_directories(
            ../cpp
            ../../../node_modules/react-native/React
            ../../../node_modules/react-native/React/Base
            ../../../node_modules/react-native/ReactCommon/jsi
)

add_library(sequel
  SHARED
  ../../../node_modules/react-native/ReactCommon/jsi/jsi/jsi.cpp
  ../cpp/sequel.cpp
  ../cpp/sequel.h
  ../cpp/react-native-sequel.cpp
  ../cpp/react-native-sequel.h
  cpp-adapter.cpp
)

target_link_libraries(sequel)
```

> Basically, I upgraded C++ to version 14, the include directories needs to contain the folder where your .cpp files are, then declare a 'library' with the exact files that need to be compiled and finally, link that library.

Then we can move on to the `android/cpp-adapter.cpp` file, this is similar to `react-native-sequel.mm` file we created for iOS, it's the entry point to register the bindings. Modify it to include the `react-native-sequel.h` header file (or whatever you will call your package), and you should have something like this:

```cpp
#include <jni.h>
#include "react-native-quick-sqlite.h"

extern "C" JNIEXPORT void JNICALL
Java_com_reactnativesequel_SequelModule_initialize(JNIEnv *env, jclass clazz, jlong jsiPtr, jstring docPath)
{
  jboolean isCopy;
  const char *docPathString = (env)->GetStringUTFChars(docPath, &isCopy); // This is might not be necessary, but my library moves files in the android file system, so this is just how to pass an android variable to the C++ size

  installSequel(*reinterpret_cast<facebook::jsi::Runtime *>(jsiPtr), docPathString);
}

extern "C" JNIEXPORT void JNICALL
Java_com_reactnativesequel_SequelModule_destruct(JNIEnv *env, jclass clazz)
{
  cleanUpSequel();
}
```

> You can see we get an instance of the JSI bridge and again we have two functions that install and clean up the bindings, I won't bore you with the details, the only detail you need to be careful is that the functions names will be converted into the Java package name to be imported later on (Java_com_reactnativesequel_SequelModule_initialize -> com.reactnativesequel)

### Initialize the C++

The previous file initializes the C++ as a callable Java module, but unlike on iOS, it's not automatically registered, create a new file `android/src/main/java/com/reactnativesequel/SequelModule.java` and put this inside of it:

```java
package com.reactnativesequel;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

class SequelModule extends ReactContextBaseJavaModule {
  static {
    System.loadLibrary("sequel");
  }

  private static native void initialize(long jsiPtr, String docDir);
  private static native void destruct();

  public SequelModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return "Sequel";
  }


  @NonNull
  @Override
  public void initialize() {
    super.initialize();

    SequelModule.initialize(
      this.getReactApplicationContext().getJavaScriptContextHolder().get(),
      this.getReactApplicationContext().getFilesDir().getAbsolutePath()
    );
  }

  @Override
  public void onCatalystInstanceDestroy() {
    SequelModule.destruct();
  }
}
```

> builder-bob probably created a kotlin version of this file, you can delete that one (or make it work if you like kotlin)

Android being android will also require an additional `Package` file, `android/src/main/java/com/reactnativesequel/SequelPackage.java`:

```java
package com.reactnativesequel;

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;


public class SequelPackage implements ReactPackage {
  @NonNull
  @Override
  public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
    return Arrays.<NativeModule>asList(new SequelModule(reactContext));
  }

  @NonNull
  @Override
  public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }
```

## And voila!

Done, both iOS and Android bindings should now be working!

Partial code (only iOS) [github](https://github.com/ospfranco/react-native-jsi-template) if you want to explore it on your own.

Many thanks to [Takuya](https://twitter.com/inkdrop_app) for creating his [base64 implementation](https://github.com/craftzdog/react-native-quick-base64)

You also want to check [this snippet](https://github.com/react-native-async-storage/async-storage/issues/291) by [Jarred Sumner](https://twitter.com/jarredsumner), which also contains a lot usage about the JSI methods.
