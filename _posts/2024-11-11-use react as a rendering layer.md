---
layout: post
title: Use React as a Rendering Layer
date: 2024-11-11
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

A couple of tweets caught my eye this week:

[Kitze tweet]

[Tweet about dan leaving twitter]

I have tweeted extensively in the past how React state management is too complex and easy to get wrong. The fact that one has to read long threads of tweets to getting some amount of understanding of how to operate it just speaks volumes.

# Render cycles is a bad state update mechanism

At the core of the problem lies the fact that React is a UI library. Being a UI library it first concern was to render state efficiently. To render state efficiently it came up to render cycles. Change your state, your component re-renders itself (and its children). As the library matured, we've migrated from classes to hooks. It's hard to decompose the problem, but it boils down to state-updates now ticks at the rythm of the render cycles:

- Render
- Update variable
- Trigger re-render
- Trigger useEffect
- Potentially update variable
- Trigger re-render

We have fallen in this cycle, where every variable change (state update) is now thought in terms of React renders. And this is a hard, complex and non-sensical way of programming. Because, everything depends on everything. It quickly explodes in complexity. You have to prevent re-renders (useMemo), try to avoid function re-creation (useCallback) while at the same time triggering side-effecty code (useEffect). This also triggers re-renderings on large parts of the UI as the prop comparisson is naive. Comically enough, React doesn't properly react to changes, at least not smart enough. The so-called React compiler is an implicit acceptance that this model is fundamentally broken and we know need to statically analyse code to get untangle this mess.

# Way out

I could ramble more and more but there is no point. If you live through the pain of maintaining a mid to large React app with lots of hooks and contexts this problem is self evident. So here is one way out: use mobx.

Mobx bring sanity to state management by using a simple observer pattern. You modify a variable, things that use the variable get re-rendered. As simple as that. Not even entire trees of things get re-render, JUST THE THINGS THAT USE IT. This means no more `useMemo`.

You can declare model classes once, this contains variables (`useState`), functions declared once (meaning no more `useCallback`) and calculated values. Side-effects are no longer a weird `useEffect` with a list of variables that might affect it, code can just be triggered when variables are set. Some times it might be a more code duplication, but it's no longer React programming, it's just programming.

It has some quirks, like having to use `runInAction` after using `await` but the trade-off is more than worthy. Your React code is just a rendering layer. NO HOOKS, NO CONTEXT. React excels at manipulating the DOM and giving you a re-usable abstraction, let it do just that.
