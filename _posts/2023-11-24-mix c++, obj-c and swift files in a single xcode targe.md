---
layout: post
title: Mix C++, Obj-C and Swift files in a single XCode targe
date: 2023-11-24 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.JPG
---

If you have an XCode project where you are trying to mix C++, Obj-C and Swift, things will not work. If you only deal with Obj-C++ everything compiles fine, but the moment you add Swift into the mix you might start getting a slew of errors on your header files.

The root issue is the [Swift compiler](https://stackoverflow.com/questions/47788422/cannot-use-namespace-and-cannot-include-standard-c-library-in-my-h-files), it doesn't support C++, yet it still tries to compile C headers on its own. Whenever you have Swift files together with C++ files, it's the Swift compiler that will kick-in in a first pass (followed by CLang? maybe before? doesn't matter) and will try to compile the headers as C headers independently of what you tell it, file extensions, etc.

You will then start getting errors based on the C++ syntax (if you used any). For example if you are using namespaces (which don't exist on C), you will get [invalid syntax errors](https://github.com/CocoaPods/CocoaPods/issues/12105#issuecomment-1824455557).

There are a couple workarounds. First you can wrap every single bit of C++ syntax in your headers around a macro that checks if the compiler supports C++:

```C++
#if defined __cplusplus
extern "C" {
#endif

#if defiend __cplusplus

class Foo
{
    void bar(int c);
}
#endif
struct FooHandle;

void Foo_bar(struct FooHandle* foo, int c);

#if defined __cplusplus
}
#endif
```

But this is time consuming and annoying, since every header you create you will have to manually modify to check for syntax errors.

Another alternative is to hide the header files from the XCode file system, yet still provide them via flags that will get passed to the compilers:

```ruby
require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name           = "matrix"
  s.version        = package["version"]
  s.summary        = package["description"]
  s.homepage       = package["homepage"]
  s.license        = package["license"]
  s.authors        = package["author"]
  s.platforms      = { :ios => "13.0" }

  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "SWIFT_COMPILATION_MODE" => "wholemodule",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
    # ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
    "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/cpp/\"/** " # This will link the headers at compile time, flag passed directly to the compiler
  }

  # ↓↓↓↓↓↓↓↓↓↓↓↓
  s.source_files = "ios/**/*.{mm,swift}", "cpp/**/*.{cpp,c}" # Do not include the headers in the sources, then XCode won't try to compile them

  # ↓↓↓↓↓↓↓↓↓↓↓↓↓↓
  s.preserve_paths = [
    "cpp/**/*.h",
    "ios/**/*.h"
  ]

  s.dependency "React"
  s.dependency "React-Core"
  s.dependency "React-callinvoker"
end
```

One side effect is that the headers will not appear on the project explorer view on XCode, which is annoying if you are developing something from scratch, you can still ⌘ + click to open it, but it won't show navigation side bar.

# Cocoapods

Cocoapods has a special problem with this, since it generates an umbrella header that will also get compiled by the Swift compiler and it will fail. Either of the methods described above will workaround the issue for now.
