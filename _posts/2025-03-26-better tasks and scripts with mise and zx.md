---
layout: post
title: Better repo tasks and scripts with mise and zx
date: 2025-03-26
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

Recently I've been working with repos that have multiple languages and build systems rolled into one. Talking about iOS/Android/Rust/Node/Flutter. The plethora of build systems, tools and quirks brings a lot of complexity, specially when working within a team, where every one needs to be able to run the same commands to build, test, lint, etc.

# Previous Art

From working with other teams, each language/ecosystem have their own way of doing things. Some of the common patterns I've seen are:

- The god awfulness that is cmake, frankensteined to work with modern tools, such as Rust. This was the latest approach that I took, just because I did not know any better tool. Works for simple flows, but brakes down once you need to start parsing params, setting variables, etc.
- Writing lots of Rust to perform as a shell scripting tool. Hard to read/write as one is creating a DSL on top of Rust. Usually, takes the name of xtask, there is even a [crate](https://docs.rs/xtasks/latest/xtasks/) aimed at automating some of this pain.
- Npm scripts, combined with shell scripts
- Raw dogging node scripts that spawn processes
- There are ofc other tools like `make`, `rake`, `jinja`, etc.

You can see the wild west that this endevaour is. These all work but require too much finagling to get right. I wanted something that was simple, easy to read, and easy to write. Preferible in a language/ecosystem that I know. JS is the easiest one, but then it's one more tool in the chain that my team needs to install, but then found a tooling pair that allows for one install command that takes care of everything.

# Mise

I'm a big fan of tool managers. Journey started with `asdf` and I'm now using `mise`. `mise` is a tool manager that allows you to install tools from a single file. It's like a package manager for languages/runtimes/tasks/etc. It basically allows you to define a single `mise.toml` where you can have per folder tools.

Let's say, I can have the specific bun/node version that I need my team to have. Without having to seat down with them to uninstall their manual node installation, install nvm, then update their Rust version. etc etc.

# Zx

[`zx`](https://github.com/google/zx) is a package from Google that allows to write better scripts in JS. Basically invoke shell commands within a JS file without dealing with the idiosincracies of bash/zsh/whatever shell you are using.

# Putting it all together

At the end, I have a `mise.toml` that looks like this (this is just an example):

```toml
[tools]
node = "14.18.1"
bun = "0.1.0"
rust = "1.58.0"

[hooks]
postinstall = "bun install"

[tasks]
build = "bun zx scripts/build.mjs"
```

And a `scripts/build.mjs` that looks like this:

```js
import 'zx/globals'

// You can do more things here, like parse the arguments, import other files, etc
await $`cargo build --release`
await $`flutter build ios`
```

Then on the README for my team it gets simple boils down to:

- `brew install mise`
- `mise settings experimental=true`, this is needed to enable the hooks, will go away in the future
- `mise install`
- `mise build` to build the project. On my project I have extended this with params like `mise build ios debug` to build the iOS app in debug mode.

No more fighting with tool versions, no more fighting with build systems. Everyone is on the same versions, with a reproducible yet native environment, with a single entry point for scripts and the scripts themselves written in a non-retarded language.
