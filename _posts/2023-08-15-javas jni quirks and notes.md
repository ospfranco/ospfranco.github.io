---
layout: post
title: Javas JNI quirks and notes
date: 2023-08-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/oscar.jpg
---

The JNI is Javas compatibility layer with C. It follows a strict syntax to blindly call the (ABI-compatible) functions. It has however arcane syntax and conventions. Here are some useful notes every time I work with it I need to check.

# Type conversions

When declaring a Java JNI function you need to declare the types with single characters that will be mapped to C types. The conversion is as follows:

Z = boolean
B = byte
C = char
I = short
J = long
F = float
D = double

Non scalar types need to be declared by their corresponding package:

```java
// Will be passed to the C side as a JString
Ljava/lang/String;
```

# Extern C

C++ code needs to be within a `extern "C"` to prevent name mangling by the compiler and allow the JNI to call the function blindly.

# JNIEXPORT & JNICALL

`JNIEXPORT` ensures function is visible on the symbols table
`JNICALL` ensures function uses the correct calling convention. On Android JNICALL has a different value based on the architecture where it is running.
