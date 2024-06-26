---
layout: post
title: Client guide to React Native modules
date: 2024-06-25
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

Let's play the following scenario: You are my client and I'm me. You ask "Oscar, we want to port our SDK/Library/module to React Native, but all this `JSI`/`Turbo Module`/`new arch` stuff is confusing, can you help us?" the answer dear client is obviously yes. However, I'm a bit tired of explaining the same concepts again and again, so I will point you to this article.

> If you are a RN dev you can skip this, this is an overview of React Native modules meant for people not in the React Native ecosystem. No new information or in-depth technical knowledge is here, just enough for adjacent people can get a grip of the terminology

# Old arch

How do you pass data between JavaScript, a interpreted language that runs on C++ to native runtimes of iOS (Swift/ObjC) and Android (Java/Kotlin)? easy! JSON. You serialize your data and every native function that you need to call can pass through a narrow tube of message passing. This is what we call the `old arch` (the usage of JSON message passing is also called the `bridge`) of React Native.

## Pros

- It is easy to create modules with it. Due to the ease of marking methods and the runtime registration, there is not a lot of setup necessary.
- ❗ Old modules are still supported in the `new arch` (we will talk about it in a bit). In fact there has been a special work put onto them so that they remain compatible at least for extra year while libraries and apps migrate to the new arch.
- If your SDK sends a small amount of data, actually should be more than enough for your needs.
- ⭐ If you use `bridgeless` (will talk about it in a second), they are as fast as `new arch` modules.

## Cons

- It is slow and can get stuck when there is a large amount of data being serialized between the JS code and the native runtimes.
- It's being phased out

# New arch

React Native used to have a bad reputation for having bad performance. In order to solve this, one of the key problems was the JSON bridge. So a bunch of concepts/modules/ideas where introduced. The conjunction of the following terms form what is called `new arch`:

## JSI

The first thing to solve is the slow passing data between JS and native. To fix this, the JavaScript Interface = `JSI`. It's basically a bunch of C++ functions that allow to interact with JavaScript from C++ without paying for serialization costs of JSON. You can think of it as Node-API (NodeJS protocol to call native code) but a bit shittier since it is not a binary communication protocol but rather a bolt-on with some higher costs.

The problem when interacting with C++ code though is that it introduces a gap between JS and native. Whenever you run JS code it runs on a JavaScript engine (JavaScript Core or Hermes in React Native's case), but actually one should think about this "context" as a virtual machine (my own words). It is a VM that can be instantiated multiple times, though your UI will run on just one of them. Multiple JS VMs are how `Web Workers` (though they are not available in RN) and certain level of parallelism in JavaScript is achieved. It reads your JS and keeps a internal state of the code it runs, has it's own heap and can die out. Most importantly, you cannot just fiddle with it while is interpreting your JS. The functions provided by `JSI`, allow to do work with this virtual machine/context/runtime by allowing to enqueue callbacks, cast JS values into C++ values, etc.

`JSI` is the corner stone of the new arch.

## Fabric

Forget about fabric, it's about how UI components are rendered using the `JSI` and it's mostly internal. It will have very little influence on your module, with the exception on how your UI components are registered.

## Bridgeless

It's just a configuration flag that completely removes the JSON bridge. `old arch` modules will still work (in fact they will use the JSI too). It's just part of the migration to kill the old bridge once and for all.

# Turbo Modules

All the internals of RN started to migrate from JSON to interacting with C++. So we now need a new way to create native modules for React Native. Turbo Modules are a solution to this problem. Is it important to know: `Turbo Modules` are **built** on top of `JSI`. You can have `new arch` modules (that use the JSI) without Turbo Modules, but not the other way around. Turbo Modules take a Typescript or Flow file, and then with a ungodly amount of JavaScript generate a bunch of C++ code, that react native then includes in your project. They are also a DSL of TypeScript/Flow (😥).

> `Turbo Modules` are **built on top** of the `JSI`

## Pros

- Lazy initialization
- Much faster runtime performance
- Synchronized function definitions between JS and native

## Cons

- Much more harder to setup
- Lack of documentation
- Require C++ knowledge and good knowledge of the internals of RN if you deviate from the golden path

# Expo modules

`Turbo Modules` and the necessary knowledge to make use of `JSI` is not trivial at all. It requires knowledge of C++, ObjC, Kotlin/Java, Java's JNI, the build systems and knowledge of the internals of RN. The great guys at expo saw from a mile away that for a company/team building an app in React Native, it is pretty much an impossible task to learn how to code all of these by themselves. Therefore they also applied ungodly amounts of Kotlin/Swift magic and created their own module system.

## Pros

- Much more easier to expose native (Swift/Kotlin) functions to JS
- They still use the JSI, so they are quite fast
- Much easier to create and move around

## Cons

- **Only run on expo apps**
- JSI is C++, Expo Modules are Swift/Kotlin, so **there is** a runtime performance cost. It's not nothing, might or might not be critical depending on your module. I posted benchmarks in my Twitter.
- The signatures of functions need to be adjusted manually between native and the JS side

# C++ Turbo Modules

It's notable to mention that there are a lot of cases where you don't want to interact with the native languages (Swift/Kotlin) but you might want to do pure C++ bindings. For some libraries like `sqlite`, `libsql`, Rust modules. This is what you want. JSI is C++, your code is C(++). This will be the fastest option in terms of runtime cost, but documentation is super scant, outdated. They are also tricky to setup.

# Which should you pick?

It depends.

You have a small team and want to just call some native Swift/Kotlin and are running Expo already: go for Expo Modules.

You have a C/C++/Rust library and require the most amount of performance: Go for C++ Turbo Module or a custom JSI module.

You want JSI, have some expertise, not on expo: go for Turbo Modules, documentation is scant so this is the least option I recommend

You want to get the ball rolling for now: go for an old arch module

# QA

Q: Is it possible to have a `new arch` (i.e. Turbo Module) that is compatible with `old arch`?

A: Yes, but it's terrible, it takes a lot of work, copying the generated files and modifying the compilation process so that everything runs on both archs. You will definitely need help from one of the agencies or me to get this working properly and maintain it.

Q: Do you like Turbo Modules

A: I don't, they are tricky to setup with code generation step and cryptic native errors. I would much rather stick to pure C++ modules. Also, codegen sucks, never do codegen.

Q: But Expo [insert your comment here]

A: Expo Modules are great if they work for you. Use them. It's fine. Go ask them for issues.

Q: You say JSI is C++, how come Turbo Modules are ObjC/Kotlin/Java?

A: The same way Expo Modules are Swift/Kotlin. Ungodly amount of jumping between languages. Swift → ObjC++ → C++. Kotlin/Java → `JNI` (which is SLOW) → C++. You might be returning native objects/scalars when writing your code, but there is a lot of work later to cast stuff all the way to the right C++ abstractions.

Q: Can I write my Turbo Module in Swift?

A: No (kinda). Latest versions of Swift (5.9+) improved compatibility with C++, but it still ways to go. The codegen scripts and all the internal tooling works with ObjC. You can write a very thin ObjC façade that will call your Swift code. So yes, there is a way to make it work.

Q: When will I be able to write my Turbo Module in Swift?

A: Some day, who knows, go work at Meta and make this a reality :)

Q: Can I write a native module in Rust?

A: Yes, but not directly. Your Rust code needs to expose a C-ABI compatible API, which will then be called from a C++ turbo module, [here is a guide](https://ospfranco.com/post/2024/05/08/react-native-rust-module-guide/). There is also this [repo](https://github.com/laptou/jsi-rs) in case you really want to write everything in rust, but I haven't managed to get it to run, my Rust-Fu is not advanced enough, but it seems to bridge all the JSI code into Rust so you can call all the functions directly from Rust.

Q: What are the pitfalls when writing my native module?

A: There are many, for example you cannot just invoke a JSI/JS function in the middle of your native code. The JS VM might be busy doing something else, if you all of the sudden ask it to allocate memory for a JS object for example, you might corrupt the stack and your entire thing will go kaput. In order to get this you need to schedule a callback using a call invoker, then await on your native code, etc etc. It's complex to get all of the moving parts working nicely.
