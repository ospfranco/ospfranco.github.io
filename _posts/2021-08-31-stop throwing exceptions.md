---
layout: post
title: Stop throwing exceptions
date: 2021-08-31 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/preview.jpg
---

Throwing exceptions completely breaks the control flow of programs and turns them unpredictable. Let's explore their side-effects.

I'm going to use TypeScript/JavaScript, so some of these points will apply to JavaScript alone.

# Exceptions can leak memory

![errorStack]({{site.url}}/assets/errorStack.png "errorStack")

> The error keeps the function frames around until it the stack string is created or it is garbage collected

It's a bit of an edge case, but given a large enough application this make your app run out of memory.

# Exceptions stab you in the back

Let start with simple axiom: **unexpected things happen all the time**. Some unexpected things are fairly common: users input weird characters, things get deleted, libraries have nested behaviors we are not aware of, etc. Yet some other unexpected things are more serious and cannot be recovered from: disks get full, some dll is missing, program is missconfigured, etc. The way the ecosystem today works is by throwing exceptions whenever unexpected things happen.

The problem comes when we forget to handle these exceptions. For example: user inputs weird character that fails to parse as an int in some dependency of the dependency, **OOPS!**

```js
// oops forgot to sanitize my input
let userInput = "10a";

// APPLICATION CRASH! 10a cannot be parsed as a int!
let date = originalDate.setDay(userInput).toISO();

// it might not even be thrown by the date library, but some second level dependency...
```

The problem with this kind of exceptions is that a lot of times they are completely implicit and invisible to the final user of the code. The path the exception has taken back is also completely implicit, did the error generate in some deeply nested function? It has bulldozed its way to your code and if unhandled will promptly crash your application.

**How do I know which function can throw? do I have to try...catch every single line of code I have not written myself?**

# Some exceptions are real exceptions

So if exceptions are so disruptive to the flow of a program, why do we use them?

So let's go back in history a bit, in the earlier days of computing, programs were not as brittle as they are nowadays, that is because exceptions were reserved for kernel panic calls. If your program succesfully executed its task it would end with a 0 integer and anything else meant a unsuccessful execution. Besides C, this is still visible in shell scripts, where if a command fails with a non-zero exit code, it means it has not succesfully completed.

Why did we start using exceptions? Well, seems like somebody looked at them and went something like "that's a neat trick! I can just throw an exception here and catch it somewhere above my stack! It even unwinds the call stack for me!". Other than that there is no good reason to use them in our user code.

But if we adopt the philosphy of "exceptions are meant for true panic calls" we can adopt a far better coding styling, one that would bring back the stability of the software of the 70s.

# Error carrying monads

Forget the fancy title for a bit, we can basically skip all the ceremony and adopt the following coding style:

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

Many of the new languages, like Rust or Swift, have now used composite types that carry this information, which will even force you to handle code that can fail.

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

Using this on the JavaScript world would maybe look something like this:

```ts
let userInput = "10a";

let dateResult = originalDate.setDay(userInput).toISO();

switch (dateResult) {
  case Ok:
    // do my thing dateResult.value
    break;

  case Err:
    console.log("Could not parse date!", dateResult.err);
    break;
}
```

That my friend, is an `Error Monad`. Now you know a bit of functional programming too! This struct is not available in JavaScript yet, but you can return tuples or objects and the result is just as good!

# Use exceptions for real panics

So now you can let real "exceptions" be what they were meant from... exceptional stuff. Things a program cannot recover from (full disk, wrong params, corrupted data, etc.), and therefore should crash the application. Whereas the rest of your code can communicate intent better, be more readable, explicit and easier to debug.

As a matter of fact there are several libraries that already follow this pattern: joi is one of them, as well as some API libraries like Stripe I believe.

# References

Although I tweeted about this issue before, it was only after reading [Barise's article](https://humanlytyped.hashnode.dev/away-from-exceptions-errors-as-values) that I decided to write my own. And there are many more articles on the topic: [some against exceptions](https://mattwarren.org/2016/12/20/Why-Exceptions-should-be-Exceptional/) some [for them](https://blog.plan99.net/what-s-wrong-with-exceptions-nothing-cee2ed0616).

I believe some of the claims **for** exceptions are quite missguided, such as: fast prototyping! Stack traces! etc. Exceptions are definitely useful and as stated some of this mechanisms are golden for real exceptional situations, but hurt so much when used freely and carelessly.
