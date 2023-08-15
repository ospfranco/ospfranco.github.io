---
layout: post
title: JSI Cheatsheet&#58; Part 3 - JSI API Reference
date: 2023-08-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.JPG
---

JSI Documentation is lacking, I already learned quite a bit of tricks to achieve the most common operations, so here is cheatsheet.

# Table of contents

# JSI Source Code

Due to the lack of serious documentation JSI source code will be your best friend:

[JSI.cpp](https://github.com/facebook/react-native/blob/main/ReactCommon/jsi/jsi/jsi.cpp)

[JSI.h](https://github.com/facebook/react-native/blob/main/ReactCommon/jsi/jsi/jsi.h)

Even if it doesn’t tell you **HOW** to do certain operations, both the header file and the source file are important as some of the functionality is implemented on the header file directly and can be used as a reference.

# Setting up a JSI module

The tutorial is free and is up on my website, just [follow the instructions](https://ospfranco.com/post/2021/02/24/how-to-create-a-javascript-jsi-module/) to set up your own module

# JSI Runtime

The Runtime object is your direct reference to the JavaScript context, think of it of an object representing a JavaScript Virtual Machine. You create/read/operate values by passing it to functions.

A lot of the operations you use with JSI require you to pass the runtime, you will either get it from your initialization code, or it will be passed to you when executing your JSI functions:

```cpp
void initializeMyModule(jsi::Runtime &rt)
```

Whenever you see `rt` on this cheatsheet, assume you have to pass the `rt` object from wherever you get it.

# jsi::Value

the jsi::Value struct is the bread and butter of JSI objects, everything you get from the javascript side is a jsi::Value, it's up to you then to interpret it to the correct C++ variables.

```cpp
jsi::Value *args = ... // Pointer to first elem in memory of jsi::Values

if (!args[0].isString()) {
	cout << "The first argument needs to be a string!" << endl;
	return;
}

const string dbName = args[0].asString(rt).utf8(rt);
```

jsi::Value has a lot of methods inside of it to help you with a bunch of operations:

- isNull
- isBool
- isNumber
- isString
- strictEquals
- asObject
- asSymbol

and many more, check the header file to know all the available operations, but this cheatsheet should guide you through the most used ones.

# Numbers/Floats/Booleans

## From jsi::Value

```cpp
// value is a jsi::Value
if(value.isNumber()) {
	double doubleVal = value.asNumber();
}

// All javascript numbers are doubles
// but sometimes you might want to operate on ints
// (you will loose precision, be careful)
int intVal = (int)doubleVal;
```

## To jsi::Value

```cpp
// Conversion is done implicitly for you
int age = 19;
jsi::Value jsAge = jsi::Value(age);
```

This same rules apply for bools and floats

```cpp
int doubleAge = 19.0;
jsi::Value jsDoubleAge = jsi::Value(doubleAge);

bool myBool = true;
jsi::Value jsMyBool = jsi::Value(myBool);
```

# Strings

Strings are not quite so straight forward because you need to take encoding into consideration

## From jsi::Value

```cpp
jsi::Value value = ... // you will get it from somewhere

// Get a C++ std::string
string strVal = value.asString(rt).utf8(rt);
```

## To jsi::Value

```cpp
string myString = "hello from C++";
// Older versions of the JSI library only took C-like strings
jsi::String::createFromUtf8(rt, myString.c_str());
// Newer version might accept a std::string directly
jsi::String::createFromUtf8(rt, myString);
```

# Null

## to jsi::Value

```cpp
jsi::Value(nullptr)
```

# Undefined

## Create

```cpp
jsi::Value::undefined()
```

You can also return `{}` on some functions directly and it will act as a shortcut to create a `undefined` value

# Arrays

## Create

```cpp
// Your arrays need to be fixed in size... no auto grow for you
auto array = jsi::Array(rt, 20);
```

Since arrays need to be created with a fixed size, you might want to delay their creation on the C++ until you are ready to return data to Javascript, and use a vector meanwhile:

```cpp
std::vector<int> myNumbers = std::Vector<int>();
myNumbers.push_back(1);
myNumbers.push_back(2);
myNumbers.push_back(3);

auto array = jsi::Array(rt, myNumbers);
for (int i = 0; i < myNumbers.size(); i++)
{
  array.setValueAtIndex(rt, i, myNumbers[i]);
}
```

# Objects

## Create

```cpp
// in javascript this would equal: module = {}
jsi::Object module = jsi::Object(rt);
```

## Set property

```cpp
jsi::Object module = jsi::Object(rt); // module = {}
module.setProperty(rt, "age", jsi::Value(19)); // module = {age: 19}
```

## Global object

JSI exposes the globalThis object for you to register your module

```cpp
rt.global().setProperty(rt, "myModule", move(module));
```

# Functions

You create invokable javascript functions using the `createFromHostFunction` method

```cpp
// create a javascript function
auto getTheAnswerToLifeTheUniverseAndEverything = jsi::Function::createFromHostFunction(
      rt, // you need to pass the JSI runtime
      jsi::PropNameID::forAscii(rt, "getTheAnswerToLifeTheUniverseAndEverything"), // internal prop name
      1, // Number of parameters function takes
      [](jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) -> jsi::Value // C++ lambda
      {
				// rt: the JSI runtime for you to pass down/use
				// thisValue: is the function context ("this" value in javascript)
				// *args: the arguments passed to your function
				// count: the number of arguments passed
        return jsi::Value(42);
      });

// You can later register this function in the globalThis scope (for example)
rt.global().setProperty(rt, "getTheAnswerToLifeTheUniverseAndEverything", move(getTheAnswerToLifeTheUniverseAndEverything));

// Then in javascript you can call this global.getTheAnswerToLifeTheUniverseAndEverything() and should return 42
```

## Validation

So you can see creating functions is quite raw due to the dynamic nature of javascript, your function could be called with anything, so it's up to you to make sure you got the correct values.

Here is a sample function that validates that the passed params are strings:

```cpp
auto open = jsi::Function::createFromHostFunction(
      rt,
      jsi::PropNameID::forAscii(rt, "sequel_open"),
      1,
      [](jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) -> jsi::Value
      {
        if(count == 0) {
          jsi::detail::throwJSError(rt, "[react-native-quick-sqlite] database name is required");
          return {};
        }

        if (!args[0].isString())
        {
          jsi::detail::throwJSError(rt, "[react-native-quick-sqlite] database name must be a string");
          return {};
        }

        string dbName = args[0].asString(rt).utf8(rt);
        string tempDocPath = string(docPathStr);
        if(count > 1) {
          if(!args[1].isString()) {
            jsi::detail::throwJSError(rt, "[react-native-quick-sqlite] database location must be a string");
            return {};
          }
          
          tempDocPath = tempDocPath + "/" + args[1].asString(rt).utf8(rt);
        }

        SequelResult result = sequel_open(dbName, tempDocPath);

        if (result.type == SequelResultError)
        {
          jsi::detail::throwJSError(rt, result.message.c_str());
          return {};
        }

        return move(result.value);
      });
```

# Throwing Errors

In the previous snippet you probably saw how to throw a Javascript error

```cpp
jsi::detail::throwJSError(rt, "[react-native-quick-sqlite] database location must be a string");
// You still have to cleanly terminate your lambda
return {};
```

```cpp
jsi::detail::throwJSError(rt, "[react-native-quick-sqlite] database location must be a string");
// You still have to cleanly terminate your lambda
return {};
```

# std::move ⚠️🚨

I already teased in the [JSI Cheatsheet Part I: C++](https://www.notion.so/JSI-Cheatsheet-Part-I-C-f1872d77ee4c4dc3b9563fa6cb3005f6?pvs=21) that moving objects in memory would be important.

> 🚨 Wherever you create your JSI objects (and specially if you do it inside of lambda functions) the memory can/will be overwritten, therefore it is important to pass your created JSI objects to the JSI runtime to avoid memory being overwritten and your data being lost

```cpp
// LOOK! move([blah blah])!!! DON'T FORGET IT!
rt.global().setProperty(rt, "sqlite", move(module));
```

> 🚨 This is important I'm going to say it again, make sure you std::move your data to avoid memory de-allocation, here is another example

```cpp
vector<jsi::Object> results = ... // pretend here is a vector of jsi::Objects

auto array = jsi::Array(rt, results.size());
for (int i = 0; i < results.size(); i++)
{
  array.setValueAtIndex(rt, i, move(results[i])); // 🚨 MOVE THEM! JUST MOVE THEM!
}

jsi::Object rows = jsi::Object(rt);
rows.setProperty(rt, "length", jsi::Value((int)results.size()));
rows.setProperty(rt, "_array", move(array));
```