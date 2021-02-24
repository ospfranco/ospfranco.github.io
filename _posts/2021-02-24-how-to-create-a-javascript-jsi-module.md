---
layout: post
title: How to create a javascript JSI module
date: 2021-02-24 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

Maybe you have heard about the new react-native architecture, the JSI is a new translation layer between the JS code and the native code, it's a lot faster than the bridge, etc etc. go watch the talks, I'm here to provide you with a simple guide to creating your own JSI module, there are some tutorials out there and many repos, but they all do a poor job at explaining what is actually going on and what you need to do.

Basically I will explain how to create a JSI module like you are 5 (or I am 5?). Also, **I do not know obj-c** and I barely know c++, all I did was look at other repos, look at source code and try to understand what is going on, but in the end I got the binding working, so I'm going to share whatever little I know.

## Creating the base module

So, you could do this only for your project if you have some specific functionality, but we are going to create a separate module because scaffolding is easier, we are going to use [react-native-builder-bob](https://github.com/callstack/react-native-builder-bob), builder bob already supports creating cpp modules, via the old bridge.

Just initialize your project:

```npx react-native-builder-bob create react-native-awesome-module```

It will ask you a bunch of questions, at some point it will also ask you which type of project you want, select the c++ option, this won't create a JSI module, but it will set up the c++ compilation for us.

### Installing the JSI bindings

Now, we are going to go to the iOS folder and modify the created header file (.h) and obj-c file, wherever you see "react-native-sequel" just replace your package name, on your header file, you should have something like this:

```c++
#import <React/RCTBridgeModule.h>
#import "react-native-sequel.h"

@interface Sequel : NSObject <RCTBridgeModule>

@property (nonatomic, assign) BOOL setBridgeOnMainQueue;

@end
```

and on the obj-c file (.mm):

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

Important things to notice here:
- We are importing the React/RCTBridge+Private header file, which is the one that exposes the jsi bindings
- The important work is done on the setBridge and invalidate functions, you see we get a reference to the `cxxBridge.runtime` that is the instance of the JSI bridge running, which we will be using for everything, the `installSequel` is a function we will create to expose (install?) our c++ exposed functions.

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
#import "react-native-sequel.h"

#include <iostream>
#include <sstream>

using namespace facebook;

void installSequel(jsi::Runtime& jsiRuntime) {
  std::cout << "Initializing react-native-sequel" << "\n";

  auto multiply = jsi::Function::createFromHostFunction(
    jsiRuntime, // JSI runtime instance
    jsi::PropNameID::forAscii(jsiRuntime, "multiply"), // Create function name
    1, // Number of arguments in function
    [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value { // callable function
      if(!arguments[0].isNumber() || !arguments[1].isNumber()) {
        jsi::detail::throwJSError(runtime, "Non number arguments passed to sequel");
      }

      double res = 42;
      return jsi::Value(res);
    }
  );

  // Registers the function, not on the global object but as a global function
  jsiRuntime.global().setProperty(jsiRuntime, "multiply", std::move(multiply));
}

void cleanUpSequel() {
  // intentionally left blank
}
```

The code comments should clarify what each line does, however there are some blanks that still need some filling, mostly around the API for the JSI, unfortunately, there is **0** documentation for it... You will have to resort reading the [JSI source code](https://github.com/facebook/react-native/blob/master/ReactCommon/jsi/jsi/jsi.cpp) for it (if you are c++ retarded like me, it might be a little difficult)

However, I can explain a few things:

`jsi::Value` is a wrapper for javascript values, there are some values you can create directly by just calling it, for example booleans and numbers, other stuff like strings are a bit more complex, they require encoding (ex. UTF8) to decode/encode (here is an [example](https://github.com/craftzdog/react-native-quick-base64/blob/master/cpp/react-native-quick-base64.cpp)), there are also other methods, in the code I present I'm using `jsi::detail::throwJSError` to throw a JS error to the javascript code (note that this code is also sync, so you need try..catch). 

There are other convenience methods for dealing with JSIValues such as isNumber, isString, to help you cast from javascript values to C++/obj-c values (do note that javascript numbers are always doubles), you might also need to be proficient with pointers to move stuff like strings/arrays around (which I'm not :D anyone wants to teach me?).

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

And that's it, you now have a JSI module, let me know if you have any problems, you can check this exact [implementation](https://github.com/ospfranco/react-native-sequel).

Many many thanks to [Takuya](https://twitter.com/inkdrop_app) for creating his base64 implementation (I basically copied and pasted a lot of his code), you might also want to check [this implementation](https://github.com/react-native-async-storage/async-storage/issues/291) by [Jarred Sumner](https://twitter.com/jarredsumner), which also contains a lot usage about the JSI methods (looking at that taught me how to cast JS numbers to/from JSIValues).

// TODO: Android implementation (will come much later)
// Right now in order to test this, I build the example app from scratch (delete pods, install pods, full build), which is super slow, if anyone knows an easier way to test this, I would be really thankful.
// I want to build a SQLite database implementation with JSI bindings, it will start small and stupid (run SQL queries) but the important thing to me is that it syncs to a REST API, if anyone is a c++ guru and has experience with SQLite, I would love to learn from you. please contact me.