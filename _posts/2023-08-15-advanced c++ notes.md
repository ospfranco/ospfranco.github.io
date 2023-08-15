---
layout: post
title: Advanced C++ notes
date: 2023-08-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.JPG
---

# Noteworthy Types

`uint8_t` = `byte` = a type of unsigned integer of length 8 bits

# References

## Printf

`printf` is legacy C, fairly type unsafe, `cout` seems to be accepted but android logging does not use it.

![Screenshot 000064.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/a8f53b05-b015-4ada-b275-db5407f1b41c/Screenshot_000064.png)

> 💡 printing a `size_t` is done via `printf(”%zu”, sizeVar)`

## DEFINE pre-processors

In various C code, I see constants defined like this:

```
#define T 100
```

Whereas in C++ examples, it is almost always:

```
const int T = 100;
```

**THEY ARE BAD PRACTICE IN C++**

because all macros (which are what `#define`s define) are in a single namespace and they take effect everywhere. Variables, including `const`-qualified variables, can be encapsulated in classes and namespaces.

Macros are used in C because in C, a `const`-qualified variable is not actually a constant, it is just a variable that cannot be modified. A `const`-qualified variable cannot appear in a constant expression, so it can't be used as an array size, for example.

In C++, a `const`-qualified object that is initialized with a constant expression (like `const int x = 5 * 2;`) *is* a constant and can be used in a constant expression, so you can and should use them.

# Libraries

After your code is compiled to a static lib (`.a` on macOS and `.so` on linux)

One useful tool is `nm`. Displays the symbol label inside of your so file, which is useful for debugging any missing symbols.

```jsx
nm -gDC myLibrary.so
```

`-g` Displays only global (external) symbols

Each symbol name is preceded by its value, followed by the following description character:

| U | undefined |
| --- | --- |
| A | absolute |
| T | text section symbol |
| D | data selection symbol |
| B | bss section symbol |
| C | common symbol |
| - | Debugger symbol entries (only with -a) |
| S | Symbol in a section other than those above(???) |
| I | indirect symbol |

If the symbol is local (non-external), the symbol’s type is instead represented by the corresponding lower case letter. A lowercase `u` in a dynamic shared library indicates an undefined reference to a private external in another module in the same library.

If the symbol is a Objective-C method, the symbol name is `±[Class_name(category_name) method:name:]`, where `+` is for class methods, `-` is for instance
methods, and (category_name) is present only when the method is in a category.

# Advanced pointers

## Unique pointer

Help with memory management. They guarantee they delete their object if they are destructed. They follow “Resource Acquisition Is Initialization” (RAII) rule.

```jsx
unique_ptr<int> p(new int);
// p <-------->  object
```

`p` owns the object and the object has only one owner, `p`. A unique pointer cannot be copied or passed by value. However, the ownership of its object can be transferred.

```jsx
auto q = make_unique<int>(); // q created with an int object on the heap
auto p = move(q); // p owns the q's object, q lost it (null pointer).
```

Here is a more complete example

```jsx
#include<iostream>
#include<memory>
using namespace std;

struct A{
    ~A(){cout<<"Deleted.";}
};

void PassIn(std::unique_ptr<A> a)
{
    cout<< "Pointer received."<<'\n';

} // a and its object are deleted.

int main(){
    
    auto x = make_unique<A>();
    PassIn(move(x)) // Pointer received.
    ; // Deleted.
    
    if (!x) cout<< "x is empty."; // true: x is empty.
    
    return 0;
}
```

## Shared pointer

Multiple instance pointer, once all the shared pointers are destructed then the object gets deleted. Passing by value creates a new shared pointer allocation (e.g. count 2)

## Weak pointer

A weak pointer is a smart pointer that does not take ownership of an object but act as an observer. It’s used to observe the object of a shared pointer. It does not participate in reference counting. Weak pointers are mainly used to break circular dependencies.

# Type Aliases

On C++ 11, the keyword is `using`

```jsx
// C++11
using counter = long;

// C++03 equivalent:
typedef long counter;
```

# Object initialization

There is only one way to initialize class consts or reference members, using the the `initialization list` syntax. It initializes the variables of an instance before the body of the constructor is called

```jsx
class Demo
{
    Demo(int& val) : m_val(val)
     {
     }
private:
    const int& m_val;
};
```

## Destructor

You can execute code after an object has been destructured

```cpp
// dispatch_queue.h
class dispatch_queue {

public:
// Explicit constructor (does not allow for argument implicit conversion)
explicit dispatch_queue(std::string name, size_t thread_cnt = 1);
// Destructor
~dispatch_queue();
}
```