---
layout: post
title: JSI Cheatsheet&#58; Part 1 - C++
date: 2023-08-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.JPG
---

With JSI bindings RN devs will have to deal with the delicacies of memory management, more specific types and so on. Having written my own JSI library had to learn as I ran, painful process, so here are all the parts where I cut myself.

I'm going to try to use small code snippets to show you, because written explanations get convoluted fast.

## Contents

## The basics

Not gonna go over the basics, how to declare an int, double, functions, etc. I'm trying to teach you how to run, not how to walk, go to youtube look at any of the basic tutorials, a couple of hours is more than enough

This is what I watched for like 20 mins:

https://www.youtube.com/watch?v=vLnPwxZdW4Y&t=11682s

I can write a lot but at the end of the day you will need to write the code, you can set up the toolchain in your machine or you can just go to [replit with c++](https://replit.com/languages/cpp), you won't be able to test JSI code, but you can play around with the basics.

Before we start I need to teach your JavaScript brain some of the not so basic yet not so advanced stuff.

# Not basic yet not advanced stuff

## Namespaces

TypeScript also has a concept of namespaces, but they are not widely used (unless you wrote them for your library). Therefore it is somewhat confusing seeing them all over the place on C++.

Example without namespace:

```cpp
#include <iostream>

int main() {
	std::string = "my string!";
	return 0;
}
```

> 🚨 The `::` operator is similar to a `.` but is meant to be used with namespaces only

You can use a namespace module wide and life becomes prettier:

```cpp
#include <iostream>

using namespace std;

int main() {
	string = "my string!";
	return 0;
}
```

You can use more than one namespace in each file. This (of course) breaks down if you have two namespaces that use the same names.

## Macros

Unlike on JavaScript which is the WYSIWYG equivalent of programming languages, on C++ you can dynamically modify your code before it gets compiled, you do this via macros.

```cpp
/**
 * Portable wrapper for mkdir. Internally used by mkdir()
 * @param[in] path the full path of the directory to create.
 * @return zero on success, otherwise -1.
 */
int _mkdir(const char *path)
{
#if _POSIX_C_SOURCE
  return mkdir(path);
#else
  return mkdir(path, 0755);
#endif
}
```

Ignore everything except the stuff with `#`, here the macro is checking for the `_POSIX_C_SOURCE` environment variable, if the flag is present when you compile the code, then the code inside the true branch will be inserted and compiled, if not the false branch will be compiled.

## Auto type

C++ actually has dynamic allocation type... but be careful! Useful if you are a C++ noob with types or you are quickly testing, but I just try to stay away from it when possible

```cpp
auto a = 19; // auto here will take the int type
```

## Constant variables

You can declare a constant variable by using the `const` type, when you are declaring your functions this will be important to make sure you don't overwrite the variable (on the direct memory address) for the rest of your code

```cpp
// dangerous
void doSomethingFunny_wrong(int &foo) {
	foo = 20; // ⚠️ modifies the direct memory address, will mess up your program
}

// safer(ish)
void doSomethingFunny(const int &foo) {
	foo = 20; // doesn't compile, cannot modify const
}

// to declare a variable as constant
const int foo = 19;
```

## Vectors (variable size arrays)

JavaScript makes you think that your arrays are infinitely growable, when in reality the one that needs to grow is you (👊), so now you will have to deal with arrays like a real man (or real woman), arrays are fixed the moment you create them, you cannot just append stuff to them... that is if you are using pure C, C++ gives us the `vector` class:

```cpp
#include <vector>
#include <iostream>

using namespace std

int main() {
	vector<string> res;
	res.push_back("Hello");
	res.push_back("I miss");
	res.push_back("Javascript");
	return 0;
}
```

Just be careful, the vector will hold a chunk of memory for you to insert stuff, once you go over the reserved space, it will have to reserve a bigger chunk and copy all the data to it

## Maps

Needless to say there is also maps for those among you who cannot even without JavaScript

```cpp
#include <map>

map<string, string> myMap = map<string, string>();

myMap["I miss"] = "Javascript";
```

## Structs

The time might come where you need to bundle more data in a more complex structure than maps or vectors, there you need to create a struct. Be orderly and create it in it's own header file.

```cpp
// myStruct.h
struct MyLittleStruct
{
	string message;
	int age;
}
```

You can later use it in your other files

```cpp
MyLittleStruct createALittleStruct()
{
	return MyLittleStruct{
		"I'm ready to cry",
		12
	}
}
```

> ⚠️ JavaScript will not understand any of this vector/map/struct mumbo jumbo, you will need to convert it at a later point to the appropriate JSI objects.

# The advanced stuff

## A **pointer is a memory address**

Once you go beyond simple functions becomes super important, but only Einstein levels of intellect have the brain power and time to really understand the topic, you and me as mere mortals need to know only this:

> 🚨 **A pointer is a memory address**

Get a tattoo of it if you can, whenever you use pointers it will also subtly change the semantics of your functions, but let's just start with the basics:

```cpp
// A regular integer variable
int age = 19; // 19

// The "&" operator returns the pointer (memory address) of a variable
cout << &age; // "0x6ef07b"

// A pointer variable (that points to an integer)
int *pAge = &age; // 0x6ef07b

// Why does the pointer also have an int?
// because just a memory address is not useful
// You need to be able to cast it back into the original data
// The "*" operator "dereferences" the pointer = reads memory and casts it back to the original data
cout << *pAge; // "19"
```

## Pass by value and by reference

While Javascript also has pass by value and by reference, there you cannot modify the semantics, but on C++ you can:

```cpp
#include <iostream>

// The "&" operator here does not mean to get the pointer
// but that the argument passed should not copied but rather "referenced"
int sumByReference(int &result) {
	result = 10 + 9;
	return result;
}

// A normal function
int sumByValue(int result) {
	result = 10 + 9;
	return result;
}

int main() {
	int result = 0;

  std::cout << "result variable: " << result << std::endl; 	// result variable: 0
  std::cout << "Sum by value: " << sumByValue(result) << std::endl; 	// Sum by value: 19
  std::cout << "result variable: " << result << std::endl; 	// result variable: 0
  std::cout << "Sum by reference: " << sumByReference(result) << std::endl; // Sum by reference: 19
  std::cout << "result variable: " << result << std::endl; 	// result variable: 19

  return 0;
}
```

## Strings

On C there is no string class, it's all done with raw bytes and pointers, C++ has `std::string` which makes it easier, but a lot of APIs still deal with C-like strings, so it's important to understand them

```cpp
// in C++
std::string hello = "I'm a Javascript princess";

// Create a C-Like string
char *myString = hello.c_str();
```

This means the `*mystring` pointer → points to the first byte (ASCII → 1byte = 1char, also UTF-8 but other encodings need more bytes) of the string, you can "reconstruct" your string by walking byte by byte

![Frame 1.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/c787b649-7083-43da-929e-5f23165a4127/Frame_1.png)

But how do you know when the string ends? by convention you mark the end of a string by using a null pointer (`\0`)

So then when you need to pass c_like strings in functions, you pass only the pointer

```cpp
std::string takesAString(char* myCString) {
	return std::string(myCString); // convert to a c++ std::string
}
```

> ⚠️ This is not only used for strings, but whenever to pass arrays of stuff in without C++ fancy classes (no vectors, maps, etc). E.g: `jsi::Value *args` = array of `jsi::Values`, but unlike strings for other types of arrays you will have to pass/receive the length of the array as an integer (sometimes with a special `size_t` type).

## Scope/context Lifecycles / Memory de-allocations  ⚠️

This is one **WILL BITE YOU IN THE ASS.** Important topic because unlike JS where you can just pass stuff around and it will (mostly) be fine, on C++ your variables will be de-allocated and you will end up with trash.

But it's important to note, C++ does not have a garbage collector, it just re-uses memory as the stack/heap get re-used.

It is specially important for JSI since current API operates with lambdas and the context (calling function) were they are created is garbage collected and they need capture semantics.

Let's say you have an initialization function, that function has some variables declared inside:

```cpp
void initMyModule() {
	// using a char* just to illustrate my point and keep the direct memory reference
	char *docPath = "/usr/osp/Documents/";

	initDatabaseModule(port, docPath);
}
```

In order to initialize your module you call another module where you pass such variables, BUT inside that module you have functions that will outlive the original scope of the calling module:

```cpp
// ATTENTION: Pseudo-code

// my database module

// remember the pass by reference (&) part? 
// This function takes a pointer via the "*" operator
void initDatabaseModule(char *docPath) {
	
	// this is a function with a lambda inside
	std::function openDatabase(string dbName) {
		// some code to initialize a database
		return createDbFile(dbName, docPath);
	}

	// Then let's say you make this function globally available to the JS context
	// (Foreshadowing to JSI 😉)
	exposeToJS(openDatabase());
}
```

Well... this will compile just fine, but when you try to call `openDatabase` from JavaScript, the `docPath` variable (pointer) will no longer contain a string, it will contain random bytes, that is because the context of the `initMyModule` function has been freed up, and some other piece of code has (could have) re-written that space.

> ⚠️ **Unlike JS, you need to be really careful on the references you are passing, because they can be moved/garbage collected.**

This brings us to capture semantics and how to work around this issues, for this type of module level variables one workaround is to declare a module variable:

```cpp
// ATTENTION: Pseudo-code

// my database module

// non-deallocatable reference
std::string myDocPath;

void initDatabaseModule(char *docPath) {
	// We create a copy 
	myDocPath = std::string(docPath);

	std::function openDatabase(string dbName) {
		// some code to initialize a database
		return createDbFile(dbName, myDocPath.c_str());
	}

	exposeToJS(openDatabase());
}
```

Another workaround is to use pass by value semantics, but this might not always work, but at least now you know why your strings are garbage characters.

## Lambdas

[Doc Reference](https://en.cppreference.com/w/cpp/language/lambda)

A C++ lambda follows the syntax:

```cpp
[ captured variables ]( params ) { body }
```

Here is a very simple lambda example of a curried function ([currying](https://javascript.info/currying-partials) =  fancy word for partially applying functions )

```cpp
#include <iostream>
#include <functional>

std::function<int(int)> createSumN(int n) {
	return [=](int x) {
		return x + n;
	};
}

int main() {
	std::function sum4 = createSumN(4);

	std::cout << "result of sum4: " << sum4(10) << std::endl;
	
  return 0;
}
```

### Captured variables

In the example I used `[=]` as my capture value, this basically copies the entire context of the parent function into the lambda function context, you might want to capture specific values, in that case you want to do something like:

```cpp
// pass by value/reference still applies here

// pass by value (will create a copy in the lambda context)
std::function<int(int)> createSumN(int n) {
	return [n](int x) {
		return x + n;
	};
}

// pass by reference (will use the same memory address) will basically create garbage if you are not careful and call after parent memory has been re-used
std::function<int(int)> createSumNWrong(int n) {
	return [&n](int x) {
		return x + n;
	};
}

std::function sum4 = createSumN(4);
std::function sum4Wrong = createSumNWrong(4);

std::cout << "result of sum4: " << sum4(10) << std::endl // "14"
std::cout << "result of sum4: " << sum4Wrong(10) << std::endl // who knows, I got "3660"
```

So whatever you are trying to capture by reference make sure that it will be long lived

## std::move

There is another trick you need to know that will keep your variables (and lambdas) from being de-allocated: `std::move` takes a variable or reference and tells the compiler it is safe to move it's memory space to whatever you are passing it to, JSI (and probably the code you will write) uses this extensively:

```cpp
// Assume you are initializing your JSI module, in this case a database module
// you create a JSI function and now you need to move it to JavaScript global object

auto myOpenFunction = jsi::Function::crea... // creates a JSI (read Javascript) function

rt.global()
	.setProperty(rt,
							 "open", 
							 std::move(myOpenFunction)); // This will safely move the memory chunk of "myOpenFunction" from the context of this function to the global object
```

If your library returns anything but basic types (int, doubles, etc) you will also have to std::move their structs to avoid them from being thrashed:

```cpp
auto myOpenFunction = jsi::Function::create... // creates a JSI (read Javascript) function
											// bunch of mumbo jumbo
											{
												jsi::Object response = jsi::Object(rt); // creates a JavaScript {} (empty object)
												response.setProperty(rt, "foo", "bar"); // {foo: "bar"}
												return std::move(response); // Moves the "response" object from this function scope to the JavaScript runtime to avoid the memory being deleted
											}
```

## Void returns

Unlike Javascript, **you need to return your lambda functions** (not to Javascript, just on the C++ side):

```cpp
auto myOpenFunction = jsi::Function::create..
											// bunch of mumbo jumbo
											{
												[]() -> void {
													cout << "I did some side-effect" << endl;
													return {}; // void return
												}
											}
```

# Advanced advanced stuff

## Bitwise operations (masks)

While it is possible to do bit level operations on Javascript is not very common, so you might don't know how it works, it is however a fairly standard trick in the C/C++ world

```jsx
int a = 1; // = 0000...01 (binary)
int b = 2; // = 0000...10 (binary)

// Do an AND on the bits
cout << a & b << endl; // 0 = 0000...00

// Do an OR on the bits
cout << a | b << endl; // 3 = 0000...11
```

What kind of madman would use this beside the magicians... well, a lot of devs use for single flag configurations, here is a theoretical example:

```jsx
// Let's say I'm creating a user/role module
// instead of creating enums, string or w/e
// I can model my permissions as a series of flags
int HAS_READ_PERMISSION = 1; // 0000...01
int HAS_WRITE_PERMISSION = 2; // 0000...10
int HAS_EXECUTE_PERMISSION = 4; // 000..100
// ...
int HAS_CHESEE_WAREHOUSE_PERMISION = 32; // 000...10000

// So then when I want to create permissions for an specific user I can do this cute trick
int myUserPermissions = HAS_READ_PERMISION | HAS_WRITE_PERMISSION | HAS_CHESEE_WAREHOUSE_PERMISION; // 000...10101
```

## Revisiting pointers

I superficially introduced pointers to you, I did not want to go deeper because it can be super confusing, however it is important to know everything you can do (and be careful of) with pointers.

For your reference here is the [cplusplus tutorial](https://www.cplusplus.com/doc/tutorial/pointers/) on pointers.

Here are some patterns that you might encounter, instead of reading you the theory like the bible, I think it is better to plain explain it

```jsx
// SQLite example to "open" a database

// Remember bit masks?
int sqlOpenFlags = SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE;

sqlite3 *db; // Declare a pointer to a sqlite3 type variable, currently empty

// Exit code to be used by sqlite
// 0 is considered by everyone and their grandma to be the code when a program has correctly executed it's function
int exit = 0;

// Mash everything together! 😮‍💨
// 1) The success (or failure) of the operation will be saved on the exit variable
// 2) notice the &db: we are passing a pointer to the pointer! Yes that is possible!
//    sqlite3 will initialize a sqlite3 object and then cram the memory value into the pointer we passed!

exit = sqlite3_open_v2("my_database_path", &db, sqlOpenFlags, nullptr);

// The code above will not throw a memory exception, but it will return the return code
// it falls to us to check the function has correctly opened a SQLite database
// (SQLITE_OK is just 0)
if (exit != SQLITE_OK) {
...
```

## Host Objects

Host objects are just C++ (class) instances that have methods exposed to the JS context. They do not necessarily have a performance advantage, but rather allow to encapsulate and use most of C++ class semantics easily.

To expose a C++ as a HostObject you need to take care of the following:

1. Inherit from jsi::HostObject
2. Override `get` and `set` to allow access to methods and properties
3. Register object on the global object

Here is a simple example:

```swift
#include <jsi/jsi.h>
#import <React/RCTBridge+Private.h>

using namespace facebook::jsi;
using namespace std;

// Store key-value pairs persistently across launches of your app.
class NativeStorage : public HostObject {
public:
  /// Stored property
  int expirationTime = 60 * 60 * 24; // 1 day
  
  // Helper function
  static NSString* stringValue(Runtime &runtime, const Value &value) {
    return value.isString()
      ? [NSString stringWithUTF8String:value.getString(runtime).utf8(runtime).c_str()]
      : nil;
  }
  
  Value get(Runtime &runtime, const PropNameID &name) override {
    auto methodName = name.utf8(runtime);
    
    // `expirationTime` property getter
    if (methodName == "expirationTime") {
      return this->expirationTime;
    }
    // `setObject` method
    else if (methodName == "setObject") {
      return Function::createFromHostFunction(runtime, PropNameID::forAscii(runtime, "setObject"), 2,
                                                        [](Runtime &runtime, const Value &thisValue,const Value *arguments, size_t count) -> Value {
        NSString* key = stringValue(runtime, arguments[0]);
        NSString* value = stringValue(runtime, arguments[1]);
        if (key.length && value.length) {
          [NSUserDefaults.standardUserDefaults setObject:value forKey:key];
          return true;
        }
        return false;
      });
    }
    // `object` method
    else if (methodName == "object") {
      return Function::createFromHostFunction(runtime, PropNameID::forAscii(runtime, "object"), 1,
                                                        [](Runtime &runtime, const Value &thisValue,const Value *arguments, size_t count) -> Value {
        NSString* key = stringValue(runtime, arguments[0]);
        NSString* value = [NSUserDefaults.standardUserDefaults stringForKey:key];
        return value.length
          ? Value(runtime, String::createFromUtf8(runtime, value.UTF8String))
          : Value::undefined();
      });
    }
    return Value::undefined();
  }
  
  void set(Runtime& runtime, const PropNameID& name, const Value& value) override {
    auto methodName = name.utf8(runtime);
    
    // ExpirationTime property setter
    if (methodName == "expirationTime") {
      if (value.isNumber()) {
        this->expirationTime = value.asNumber();
      }
    }
  }
  
	// You can call this method from the entry point where you install the bindings
  // or call it in another method, we will take a look later
  // Install `nativeStorage` globally to the runtime
  static void install(Runtime& runtime) {
    NativeStorage nativeStorage;
    shared_ptr<NativeStorage> binding = make_shared<NativeStorage>(move(nativeStorage));
    auto object = Object::createFromHostObject(runtime, binding);

    runtime.global().setProperty(runtime, "nativeStorage", object);
  }
};
```

# References

So most of what you see here I learned from the library I implemented: [react-native-quick-sqlite](https://github.com/ospfranco/react-native-quick-sqlite), it is a new wrapper for SQLite3 using JSI bindings, the code is MIT and open source, so feel free to check it out, there are also many other JSI libraries out there, with varying grades of difficulty for you to understand:

### Libraries implemented using JSI

- https://github.com/mrousavy/react-native-vision-camera
- https://github.com/mrousavy/react-native-mmkv
- https://github.com/mrousavy/react-native-multithreading
- https://github.com/software-mansion/react-native-reanimated
- https://github.com/BabylonJS/BabylonReactNative
- https://github.com/craftzdog/react-native-quick-base64
- https://github.com/craftzdog/react-native-quick-md5
- https://github.com/greentriangle/react-native-leveldb
- https://github.com/expo/expo/tree/master/packages/expo-gl
- https://github.com/ospfranco/react-native-quick-sqlite
- https://github.com/ammarahm-ed/react-native-mmkv-storage
- https://github.com/Nozbe/WatermelonDB