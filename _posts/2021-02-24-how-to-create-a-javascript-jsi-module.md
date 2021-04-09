---
layout: post
title: How to create a react-native JSI module
date: 2021-02-24 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

JSI is a new translation layer between the JavaScript and C++, it's implemented on the JavaScript engine itself and it's a lot faster than the React-Native bridge. This is simple guide to creating your own JSI module, there are some tutorials out there and many repos, but they all do a poor job at explaining what is actually going on and what you need to do.

> Please note; **I do not know Objective-C** and I barely know C++, all I did was look at other repos, look at source code and try to understand what is going on.

## Creating the base module

We are going to create a separate module because scaffolding is easier, we are going to use [react-native-builder-bob](https://github.com/callstack/react-native-builder-bob), builder-bob already supports creating cpp modules, via the old bridge.

Start by initializing a new module:

```bash
npx react-native-builder-bob create react-native-awesome-module
```

It will ask you a bunch of questions, at some point it will also ask you which type of project you want, select the **C++** option, this won't create a JSI module, but it will set up the scaffolding necessary for compilation.

### Installing the JSI bindings

Go to the `iOS` folder and modify the created **header file** (.h) and **obj-c file** (.mm), wherever you see "react-native-sequel" just replace your package name. You should have something like this:

Header file.
```c++
#import <React/RCTBridgeModule.h>
#import "react-native-sequel.h"

@interface Sequel : NSObject <RCTBridgeModule>

@property (nonatomic, assign) BOOL setBridgeOnMainQueue;

@end
```

Implementation file.
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
- The important work is done on the **setBridge** function, here we get a reference to the `cxxBridge.runtime`, this is a **runtime** object that is necessary for all the manipulations in the C++ code to create JavaScript values. We pass this runtime into a *install\[YOUR_PROJECT_NAME]* function where we will create the JSI functions.

### Writing our bindings

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

Unfortunately, there is **0** documentation for the JSI bridge and it's bindings... You will have to resort reading the [JSI source code](https://github.com/facebook/react-native/blob/master/ReactCommon/jsi/jsi/jsi.cpp).

`jsi::Value` is a wrapper for javascript values, there are some values you can create directly by just calling it, for example booleans and numbers, other stuff like strings are a bit more complex, they require encoding (ex. UTF8) to decode/encode (here is an [example](https://github.com/craftzdog/react-native-quick-base64/blob/master/cpp/react-native-quick-base64.cpp)). There are also other methods, in the code I present I'm using `jsi::detail::throwJSError` to throw a JS error to the javascript code. Note that the function we created is synchronous, and because it can throw an error, you need to wrap it in a try/catch when you call it from the JavaScript side.

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
import * as React from 'react';

import { StyleSheet, View, Text } from 'react-native';
import { multiplyA } from 'react-native-sequel';

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
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
```

## Conclussion

The code is on [github](https://github.com/ospfranco/react-native-jsi-template) if you want to explore it on your own.

Many thanks to [Takuya](https://twitter.com/inkdrop_app) for creating his [base64 implementation](https://github.com/craftzdog/react-native-quick-base64) (I basically copied and pasted a lot of his code)

You also want to check [this sample](https://github.com/react-native-async-storage/async-storage/issues/291) by [Jarred Sumner](https://twitter.com/jarredsumner), which also contains a lot usage about the JSI methods (looking at that taught me how to cast JS numbers to/from JSIValues).

I created a new [SQLite react-native library](https://github.com/ospfranco/react-native-quick-sqlite), check it out to learn how to do Android bindings and a lot of other neat things! leave it a star too please!