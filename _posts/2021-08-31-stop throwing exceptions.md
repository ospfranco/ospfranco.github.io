---
layout: post
title: Stop throwing exceptions
date: 2021-08-31 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/preview.jpg
---

Throwing exceptions makes programms unpredictable by breaking the normal control flow.

Consider a simple axiom: **unexpected things happen all the time**.

Some unexpected things are "common": users input weird characters, things get deleted, libraries have unexpected behaviors, etc. However, there are other kind of unexpected things, things cannot be recovered from: disks get full, dynamic library is missing, program is missconfigured, etc. Today's ecosystem treats every exception as equal by throwing exceptions.

The real problem comes when we forget to handle these exceptions or we don't know the code we are calling can throw exceptions.

```js
// oops forgot to sanitize my input
let userInput = "10a";

// APPLICATION CRASH! 10a cannot be parsed as a int!
let date = originalDate.setDay(userInput).toISO();

// it might not even be thrown by the date library, but some second level dependency...
```

A lot of times this code is implicit and invisible to the application developer. The exception simply bulldozes and bubbles until it is catched or crashes the programm.

There lies one of the biggest problems: **how do I know which function can throw?** do I have to try/catch every line of code I have not written myself?

# Kernel errors

If exceptions are so disruptive to the flow of a program, why do we use them?

In the earlier days of computing, programs were not as brittle, that is because exceptions were reserved for kernel panic calls. If your program succesfully executed its task it would terminate with a 0 integer and anything else meant a unsuccessful execution. This is still visible in today's shell scripts, where if a command fails with a non-zero exit code, it means it has not succesfully completed. Exceptions where reserved for Kernel panics, exactly those I mentioned (full disk, missing dll, etc.) and were meant to completely halt a program (or even the computer!)

Inspired by this kernel exceptions the developer community seems to have thought: "that's a neat trick! I can just throw an exception here and catch it somewhere above my stack! It even unwinds the call stack for me!". Other words: short-term convenience.

But this short-term convenience carried a price, **it added implicit behavior to ALL code**, you could no longer read the calling code and understand what was going on without understanding the whole.

I believe user code without exceptions makes for a easier pattern to understand, debug and maintain.

# Error carrying monads

What if every function not only returned the output but any error it produces.

```ts
let userInput = "10a";

let { error, date } = originalDate.setDay(userInput).toISO();

if (error) {
  // handle the error gracefully
  return;
}

// do my thing
```

This brings multiple benefits:

- Code that can fail becomes explicit (even better with TypeScript)
- Errors are part of the normal flow of a program
- Easily readable and the intention of the code is clear

Many of the new languages, like Rust or Swift, have now used composite types that carry this information, which will even force you to handle code that can fail. For example in Rust:

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

This is what is called an `Error Monad`. This struct is not available in JavaScript yet, but you can return tuples or objects and the result is just as good!

# Use exceptions for real panics

So now you can let real "exceptions" be what they were meant for **unrecoverable program state** and therefore should crash the application. Whereas the rest of your code will just be better.

I have encountered some libraries that follow this pattern, joi for example, as well as some API libraries like Stripe.

# References

Although I tweeted about this issue before, it was only after reading [Barise's article](https://humanlytyped.hashnode.dev/away-from-exceptions-errors-as-values) that I decided to write my own. And there are many more articles on the topic: [some against exceptions](https://mattwarren.org/2016/12/20/Why-Exceptions-should-be-Exceptional/) some [for them](https://blog.plan99.net/what-s-wrong-with-exceptions-nothing-cee2ed0616).

I believe some of the claims **for** exceptions are quite missguided, such as: fast prototyping! Stack traces! etc. Exceptions are definitely useful and as stated some of this mechanisms are golden for real exceptional situations, but hurt so much when used freely and carelessly.

# Bonus: JS exceptions can leak memory

![errorStack]({{site.url}}/assets/errorStack.png "errorStack")

> The error keeps the function frames around until it the stack string is created or it is garbage collected

It's a bit of an edge case, but given a large enough application it's bound to happen.
