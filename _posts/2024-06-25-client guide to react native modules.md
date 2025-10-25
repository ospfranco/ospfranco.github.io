---
layout: post
title: Client guide to React Native modules
date: 2024-06-25
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

You are my client. You ask "Oscar, we want to port our SDK/Library/module to React Native, but all this JSI, Turbo Module and new arch stuff is confusing, can you help us?" the answer dear client is obviously yes. However, I'm a bit tired of explaining the same concepts again and again, so I will point you to this article.

# Old arch

The old arch is dead. Finito. But it was just a way to serialize data via JSON and pass it between JS and the native runtimes.

# New arch (or now, the arch)

React Native used to have a bad reputation for having bad performance. In order to solve this, one of the key problems was the JSON communication. So a bunch of concepts/modules/ideas were introduced. The conjunction of the JSI, Fabric and Turbo Modules form what is called `new arch`

## JSI

The first thing to solve is the slow passing data between JS and native. To fix this, the JavaScript Interface = `JSI` was introduced. It's basically a bunch of C++ functions that allow to interact with JavaScript from C++ without paying for serialization costs of JSON. You can think of it as Node-API (NodeJS protocol to call native code) but a bit slower/custom, since it's not a binary communication protocol but rather a bolt-on. JSI is not exclusive to RN but needs to be implemented per engine.

The problem when interacting with C++ code though is that it there is a non-abstracted gap between the runtime behavior of the JS engine and your code. Your JS code runs on a JS engine (JSC or Hermes in React Native's case), but actually one should think about this JS "context" as a virtual machine. It's a VM that can be instantiated multiple times (though your UI will run on just one of them) which is a trick used to achieve "parallelism" in JS. Each VM/engine instace reads your JS and internal state, has it's own heap and can die out. Most importantly, you cannot just fiddle with it while is interpreting your JS. The functions provided by `JSI`, allow to do work with this virtual machine/context/runtime by allowing to enqueue callbacks, cast JS values into C++ values, etc.

`JSI` is the corner stone of the new arch.

## Fabric

Forget about fabric, it's about how UI components are rendered using the `JSI` and it's mostly internal. It will have very little influence on your module, with the exception on how your UI components are registered.

# Turbo Modules

Turbo Modules are how we create JSI enabled native modules. Turbo Modules are **built** on top of `JSI`. You can have `new arch` modules (that use the JSI) without Turbo Modules, but not the other way around. `Turbo Modules` take a Typescript or Flow file, and then generate a bunch of C++ code, which React Native then includes in your project. They allow for lazy initialization of modules which makes your app start faster. There are many drawbacks though. The codegen system is finicky at best, it has already had many breaking changes between versions. Documentation is scant and confusing.

# Expo Modules

`Turbo Modules` and the necessary knowledge to make use of the `JSI` is not trivial. It requires C++, ObjC, Kotlin/Java, Java's JNI, build systems and some of the internals of RN. The guys at expo saw from a mile away that for a team building an app in React Native, it is pretty much an impossible task to learn how to code all of these by themselves. Therefore they baked their own module system into the Expo framework.

They require much less boilerplate. Expo itself holds the necessary code to initialize and run the modules so the code you write is pretty minimal. They do not contain any codegen step so that's a bit of a drawback, but given the frequency to which codegeneration fails, it can actually be a good thing. Expo really tried to make the DX of them as easy as posible.

They do have a drawback though, compared to TurboModules they are slow. Compared to Nitro Modules and raw C++ JSI modules they are way way slower. They are good enough for the general use case and expo themselves use their bindings for their native code so it's GOOD ENOUGH for the general use case but if performance is your #1 priority, you probably should not use them.

# JSI C++ Modules

It's notable to mention that there are a lot of cases where you don't want to interact with the native languages (Swift/Kotlin) but you might want to do pure C++ bindings. For some libraries like `sqlite`, `libsql`, Rust modules, some C library you CAN write a pure C++ module that does not go through the Turbo Module sub system. This will be the fastest option in terms of runtime cost, but documentation is super scant, outdated. They are also tricky to setup. [op-sqlite] is an example of a library written in (mostly) pure C++. But even though they are super difficult to setup they will almost never break (with the exception of the initialization which requires a stub Turbo Module) because you are directly interacting with the raw C++ code.

# Nitro Modules

Nitro Modules were created by Marc Rousavy. Him being a master of raw JSI C++ coding, started abstracting away many of the patterns in pure C++ code to make it easier to create modules. They are faster than either Turbo or Expo Modules. However, it is yet a third-party system supported by a smaller organization (or rather individual) and they do have their own quirks. With regards to speed they are probably on par with pure JSI C++ Modules but they do allow to call Swift/Kotlin far far more easier without the necessity of a lot of hand typed boilerplate. They have their own code generator but seems to work more reliably than the Turbo Modules one.

# Node API Modules

The most experimental of the libraries. Allows to create RN modules using Nodes NAPI interface. The benefits are quite clear, you now can use any module existing for node-js inside of RN. I don't know if they are faster than turbo modules or JSI C++ Modules as they are still experimental and require the upmost latest versions of Hermes to work. The upsides are huge but only time will tell if they gain mainstream adoption. In theory they should allow you to test your native modules in a Node environment plugin a huge gap with the introduction of the JSI which is not being able to test your custom native modules without the whole of a React Native runtime environment.

# Which should you pick?

It depends.

You want to just call some Swift/Kotlin, already on Expo and are ok with their performance: Expo Modules

Require the most amount of performance and have extensive C++/Java/Android/ObjC/iOS knowledge: JSI C++ Modules

Require the best performance but afraid of native monsters and ok with the risk of smaller third party module system: Nitro Modules

If you want most of the perfomance without expo or third party packages: Turbo Modules

Risky but with node compatibility: NAPI Modules

# QA

**Is it possible to have a `new arch` (i.e. Turbo Module) that is compatible with `old arch`?**

The old arch is gone.

**Do you like Turbo Modules?**

I don't, they are tricky to setup, but most importantly codegen has been very brittle. 

**But Expo [insert your comment here]**

Expo Modules are great if they work for you. For further questions go ask the Expo team.

**You say `JSI` is C++, how come `Turbo Modules` are ObjC/Kotlin/Java?**

The same way Expo Modules are Swift/Kotlin. Jumping between languages. Swift → ObjC++ → C++. Kotlin/Java → `JNI` (which is SLOW) → C++. Your simple returning functions require a lot of casting stuff all the way to the right C++ abstractions.

**Can I write my Turbo Module in Swift?**

No... kinda... The latest versions of Swift (5.9+) improved compatibility with C++. Nitro Modules took advantage of this compatibility layer but neither Turbo or Expo Modules take advantage of this (yet) as it is not mature enough.

**When will I be able to write my `Turbo Module` in Swift?**

Don't know, go ask Meta very nicely to do this.

**Can I write a native module in Rust?**
 
Yes, but not directly. Your Rust code needs to expose a C-ABI compatible API, which will then be called from a C++ turbo module, [here is a guide](https://ospfranco.com/post/2024/05/08/react-native-rust-module-guide/) there are guides in this website and some other packages, but again, smaller orgs/teams, you can take the risk.


**What are the pitfalls when writing my native module?**
 
There are many, for example you cannot just invoke a JSI/JS function in the middle of your native code. The JS VM might be busy doing something else, if you all of the sudden ask it to allocate memory for a JS object for example, you might corrupt the stack and your entire thing will go kaput. In order to get this you need to schedule a callback using a call invoker, then await on your native code, etc etc. The different modules systems protect you against this, but there is so many details there that you might face dragons every once in a while.

