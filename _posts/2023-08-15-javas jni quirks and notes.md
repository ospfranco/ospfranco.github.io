---
layout: post
title: Javas JNI quirks and notes
date: 2023-08-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

The JNI is Javas compatibility layer with C. It follows a strict syntax to blindly call the (ABI-compatible) functions. It has however arcane syntax and conventions.

# Cpp-adapter

The entry point (at least for React Native modules) is the `cpp-adapter` file. This file receives a `jobject thiz` reference, which maps to the Java/Kotlin instance/class that has created it. You can use this reference to call the methods to the class/instance.

Calling the methods however is a bit tedious, since you have to first reference the method via signature using a weird string syntax, then convert any type of C++ integral type to the Java equivalent. Perform the conversion, call, handle any exceptions, etc.

Here is one example

```C++
void set(const char* key, const char* value, bool withBiometrics)
{
    JNIEnv *jniEnv = GetJniEnv();
    java_class = jniEnv->GetObjectClass(java_object);
    jmethodID mid = jniEnv->GetMethodID(java_class, "setItem", "(Ljava/lang/String;Ljava/lang/String;Z)V");
    jstring jKey = string2jstring(jniEnv, key);
    jstring jVal = string2jstring(jniEnv, value);
    jvalue params[3];
    params[0].l = jKey;
    params[1].l = jVal;
    params[2].z = withBiometrics;


    jniEnv->CallVoidMethodA(java_object, mid, params);

    jthrowable exObj = jniEnv->ExceptionOccurred();
    if(exObj) {
        jniEnv->ExceptionClear();

        jclass clazz = jniEnv->GetObjectClass(exObj);
        jmethodID getMessage = jniEnv->GetMethodID(clazz,
                                                "toString",
                                                "()Ljava/lang/String;");
        jstring message = (jstring)jniEnv->CallObjectMethod(exObj, getMessage);
        const char *mstr = jniEnv->GetStringUTFChars(message, NULL);
        throw std::runtime_error(std::string(mstr));
    }
}
```

Here is a convenience method to convert from a CString to a Java String

```c++
jstring string2jstring(JNIEnv *env, const char *str)
{
    return (*env).NewStringUTF(str);
}
```

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
