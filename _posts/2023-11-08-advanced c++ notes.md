---
layout: post
title: Advanced C++ notes
date: 2023-11-08 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/oscar.jpg
---

# Noteworthy Types

`uint8_t` = `byte` = a type of unsigned integer of length 8 bits

# References

## Printf

`printf` is legacy C, type unsafe, meaning you should REALLY NOT USE IT. `cout` seems to be accepted but android logging does not use it.

> 💡 printing a `size_t` is done via `printf(”%zu”, sizeVar)`

## DEFINE pre-processors

In various C code, I see constants defined like this:

```c++
#define T 100
```

Whereas in C++ examples, it is almost always:

```c++
const int T = 100;
```

**THEY ARE BAD PRACTICE IN C++**

Because all macros (which are what `#define`s define) are in a single namespace and they take effect everywhere. Variables, including `const`-qualified variables, can be encapsulated in classes and namespaces.

Macros are used in C because in C, a `const`-qualified variable is not actually a constant, it is just a variable that cannot be modified. A `const`-qualified variable cannot appear in a constant expression, so it can't be used as an array size, for example.

In C++, a `const`-qualified object that is initialized with a constant expression (like `const int x = 5 * 2;`) *is* a constant and can be used in a constant expression, so you can and should use them.

# Libraries

After your code is compiled to a static lib (`.a` on macOS and `.so` on linux)

One useful tool is `nm`. Displays the symbol label inside of your so file, which is useful for debugging any missing symbols.

```bash
nm -gDC myLibrary.so
```

> `-g` Displays only global (external) symbols

Each symbol name is preceded by its value, followed by the following description character:

| Symbol | Object                                          |
| ------ | ----------------------------------------------- |
| U      | undefined                                       |
| A      | absolute                                        |
| T      | text section symbol                             |
| D      | data selection symbol                           |
| B      | bss section symbol                              |
| C      | common symbol                                   |
| -      | Debugger symbol entries (only with -a)          |
| S      | Symbol in a section other than those above(???) |
| I      | indirect symbol                                 |

If the symbol is local (non-external), the symbol’s type is instead represented by the corresponding lower case letter. A lowercase `u` in a dynamic shared library indicates an undefined reference to a private external in another module in the same library. Meaning your symbol is missing in the headers and cannot be linked/called.

If the symbol is a Objective-C method, the symbol name is `±[Class_name(category_name) method:name:]`, where `+` is for class methods, `-` is for instance
methods, and (category_name) is present only when the method is in a category.

# Type aliases

The old c style of introducing a type-alias is via `typedef`

```c++
typedef std::vec<int> vInt;
```

Starting in C++ 11 the `using` keyword was introduced

```c++
using vInt = std::vec<int>;
```

# Virtual functions

Virtual function is a member function that we expect to redefine in a derived class. It ensures **overriding** even if you cast a pointer to the base class.

```c++
#include <iostream>

using namespace std;

class Base {
public:
    virtual void print() {
        cout << "Base function" << endl;
    }
};

class Derived: public Base {
public:
    virtual void print() {
        cout << "derived function" << endl;
    }
};

int main() {
    Derived d;

    Base *b = &derived;

    b->print(); // prints "derived function"

    return 0;
}
```

# Smart pointers

Whenever the context where you create the variables ends, the variables you created will get de-allocated. This is a big problem if you want to keep resources alive. e.g.

```c++
function foo() {
    std::vector<int> a{1, 2, 3};
    ...
    // function ends, a gets de-allocated
}
```

Smart pointers will help you keep things alive depending on how you want to keep those objects alive

## Unique pointer

```c++
unique_ptr<int> p(new int);
// p <-------->  object
```

`p` owns the object and the object has only one owner, `p`. A unique pointer cannot be copied or passed by value. However, the ownership of its object can be transferred.

```c++
auto q = std::make_unique<int>(); // q created with an int object on the heap
auto p = std::move(q); // p owns the q's object, q lost it (null pointer).
```

Here is a more complete example

```c++
#include<iostream>
#include<memory>
using namespace std;

struct A{
    ~A(){
        std::cout << "Deleted.";
    }
};

void PassIn(std::unique_ptr<A> a)
{
    cout<< "Pointer received."<<'\n';

} // a and its object are deleted.

int main(){

    auto x = std::make_unique<A>();
    PassIn(std::move(x)) // Pointer received.
    ; // Deleted.

    if (!x) cout<< "x is empty."; // true: x is empty.

    return 0;
}
```

A unique pointer is useful if you want to **ensure** only a single copy of your data is kept alive in your code. Once somebody has taken over the pointer (via std::move) the previous reference/owner will completely loose it.

## Shared pointer

A shared pointer is useful when you want to keep data around as long as any of the owners of the data are alive (e.g. multiple lamdas or multiple objects pointing to a common shared object). The semantics of passing a shared pointer however are subtle and prone to errors.

### Pass by value

Passing a shared pointer by value will actually add an owner to the pointee (keeping it alive) and is the main use case. In the following code, the vector `a` will have the count of owners bumped when foo is called and decreased when `foo` finishes running. So the semantics don't change.

```c++

function foo(std::shared_ptr<std::vector<int>> ints) {
    // Do something with ints
}

int main() {
    std::shared_ptr<std::vector<int>> a{1,2,3};

    foo(a);
}
```

But if you would have a long lived structure and you pass the pointer too it, then the vector will be kept alive as long as the struct is also alive:

```c++
class A {

    // You get a shared vector from some external source
    // as long as the instance of this class is alive then a will also be kept alive
    A(std::shared_ptr<std::vector<int>> a) {
        this->a = a;
    }

    std::shared_ptr<std::vector<int>> a;
}
```

There is a small price to performance price to pay when owning the pointer. So if you only need to access it but not copy it you can pass by reference or by passing the underlaying pointer

### Pass by reference

Passing by reference does not increase the owner count, you can however create a shared pointer and become an owner. The benefit of not taking ownership is that you don't pay the price of copying and owning the shared pointer.

```c++
// Does not take ownership (copy the std::shared_ptr) only uses it while this function is alive
function foo(std::shared_ptr<std::vector<int>> &ints) {
    // Do something with ints
}

int main() {
    std::shared_ptr<std::vector<int>> a{1,2,3};

    foo(&a);
}
```

### Pass the underlaying pointer

Similar to passing by reference except you cannot create a shared_ptr (doing so will create a new shared_ptr but will not increase the owner count)

### Lambdas

With this the capture semantics of lambdas are much clearer:

```c++
std::shared_ptr<std::vector<int>> a{1,2,3};

// Because a is a shared pointer, it will not be de-allocated until myLambda itself is de-allocated, which could be much later down the life of the program
auto myLambda = [a]() {
    // Do something with a
}
```

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

# NULL vs nullptr

`NULL` is C legacy, `nullptr`` is idiomatic C++. Null is convertible to integral types (int, bool, etc) whereas nullptr is not

```c++
int x = NULL; ✅
int y = nullptr; ❌ // it is however castable to bool
```

The reason why NULL is legacy is because it causes ambiguity when functions are overriden.

```c++
// this both match calling a(NULL);

function a(int x) ...

function a(char* s) ...
```

# std::any and std::variant

## std::any

Sometimes you don't know which object you are going to receive. Starting on C++ you can use `std::any`. `std::any` is basically a pointer and a type information, you could do the same yourself but you can type cast to anything and get into trouble, while `std::any` can prevent you from gunfoot. It is useful to pass data data around to which you don't know the exact type/size and you don't care until it is time to cast it and do something useful with it. You can imagine how this is super useful with dealing with JS values that can have anything inside of them.

```c++
std::any myAnyInt = 4;
std::any myAnyStr = std::string("this is a string");
```

The problem with `std::any` however is you can only run code if you know the type ahead of time (read in your head and not in runtime). You can try to do casting and comparissons but it's kinda shit.

```c++
std::any myAny = 4;

// Later down the line
if(myAny.type == typeid(int)) {
    int myInt = std::any_cast<int>(myAny);
}

// You cannot really check the type of the thing you held if not by raw comparisson
// and the types you get are implementation dependent

struct A {}

std::any myA = A();

std::cout << myA.type().name() << std::endl; // Might output "x"
```

## std::variant

If you already know what your bag of holding will hold you can use std::variant. It is much better because it will only accept a set of types you define. It will also apply compiler optimizations.

```c++
using MyBagOfHolding = std::variant<int, double, long long, std::string, nullptr_t>;

MyBagOfHolding bag = 4;

// .. much later down in the code

if(std::holds_alternative<int>(bag)) {
    return std::get<int>(bag);
}
```

This example is simple and might look as good as `std::any`, but the compiler optimizations and the type warnings are worth it on it's own.

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
