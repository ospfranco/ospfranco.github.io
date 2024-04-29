---
layout: post
title: Why Swift is better than Rust
date: 2024-04-29
categories: post
permalink: /:title/
---

Over the last year, I have been building software in native languages. C++, Swift, Kotlin and most recently Rust. Rust has been particularly tricky to get right and has given me an uneasy feeling.

# Solving memory management

The big promise of Rust is to prevent memory allocation problems. It does this via the Borrow Checker which forces you to avoid leaky patterns from the get-go. The problem is that the borrow checker forces you to write manually safe code ALL THE TIME. Some of my thoughts are expressed at length in this recent [Rust article](https://loglog.games/blog/leaving-rust-gamedev/#rust-being-great-at-big-refactorings-solves-a-largely-self-inflicted-issues-with-the-borrow-checker) that is making the rounds on the internet:

> The most fundamental issue is that the borrow checker forces a refactor at the most inconvenient times. Rust users consider this to be a positive, because it makes them "write good code", but the more time I spend with the language the more I doubt how much of this is true. Good code is written by iterating on an idea and trying things out, and while the borrow checker can force more iterations, that does not mean that this is a desirable way to write code. I've often found that being unable to just move on for now and solve my problem and fix it later was what was truly hurting my ability to write good code.

While the specific use-case of writing Rust games may not be ideal for such a strict system as the borrow-checker I have found the tyrannical nature of it more cumbersome than helpful. On my normal day-to-day, there are very few pieces of code where I want to write the memory-safe code myself. Opening a file, and passing a variable to multiple functions, everything becomes 20x cumbersome.

The borrow-checker on a high level, dumps the responsibility of writing safe code to YOU. It's a very useful helper but it just points at the correct path and doesn't solve the problem.

# Swift has become my favorite language

After working with many languages and tools over the last couple of years I have nothing but praise for Swift. It's not perfect, but it feels like the culmination of the C-like family of languages. It does all the nice-things rust does. Explicit control-flow, and exhaustive checks for branching code, yet it has dynamic syntax and a sensible memory model that will cover 98% of the code you normally write without fuzz.

Swift has taken all the lessons of the last 20 years of software development and dumped them into a useful language.

# The feeling

Whenever I open a Swift file I wrote myself I can immediately pick up where I left. Whereas with Rust every function is a mess of `unwrap`, `clone`, `arc`, `box`. Ultimately, Rust solved the memory management problem at the interface between your hands and the keyboard and that makes coding too hard.
