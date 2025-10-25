---
layout: post
title: React-i18next trans component explained
date: 2021-04-20 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

Recently I had to use the react-i18next [trans component](https://react.i18next.com/latest/trans-component), here is the first line of the documentation:

> While the Trans component gives you a lot of power by letting you interpolate or translate complex react elements - the truth is - in most cases you won't need it.

And then it goes on and on about other minutia, but it never explains how it actually works and all the other info I could find is terrible. Nobody actually explains how it works.

# The 30 second pitch

Here is a simple example (ignore the `Trans` tag for now), I basically have a small text, where I need to bold the email of the user.

```tsx
<Trans i18nKey="webOnboarding.signInInstruction3" >
  Enter your email address <span className="font-bold">{{ "{{ email "}} }}</span> and password
</Trans>
```

So how does `Trans` work? it will start with an internal counter at `0`. It will walk until it finds a sub-component (in our case the `span` tag), then increase the counter, when the `span` closes it will increase the counter again.

So basically the string passed to it, ends up something like this:

```tsx
<0>Enter your email address </0><1>{{ "{{ email"}} }}</1><2> and password</2>
```

My translated string looks like this:

```
"signInInstruction3": "Enter your email address <1>{{ "{{email"}}}}</1> and password",
```

So it will do more or less the same algorithm as it did on the JSX code but you have given it a hand to see what needs to go in the `1` tag. Afterwards it can just replace the content and your translation is correctly inserted in your code.