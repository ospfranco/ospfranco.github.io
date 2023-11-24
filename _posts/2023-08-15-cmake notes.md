---
layout: post
title: CMake notes
date: 2023-08-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

CMake is a meta build system, can automate everything including running tests and taking screenshots.

It has 3 stages:

- Configuration
- Generation
- Building

# Configuration

CMake will read project details in the _source tree_ directory and preparing the output directory, called _build tree,_ for the generation stage. It collects info about the env (compilers, linkers, variables, etc) into a CMakeCache.txt.

# Generation

After reading the configuration a _build system_ is generated. Since CMake is a meta build system, the output is a cut-to-size configuration for other build tools (make, ninja, IDE files for Visual Studio or Xcode).

# Building

To produce the final artifacts, the build tool needs to run. The beauty lies in the ability to produce buildsystem on demand for every platform with a single configuration.

```swift
cmake --build // CMake does not build anything, but the platform build tool does
```

# Useful flags

`-S` Source tree target directory

`-B` Build tree target directory

`-G` Generator to use (cmake --help outputs the list of available generators)

`-D CMAKE_BUILD_TYPE=Release` Important flag to compile for the right level

> 💡 Some generators are able to generate debug AND release builds at the same time (Xcode and Visual Studio)

> 💻 Cmake can run certain commands in a platform independent way:
> _capablities, cat, chdir, compare_files, copy, copy_directory, copy_if_different, echo, echo_append, env, environment, make_directory, md5sum, sha1sum, sha224sum, sha256sum, create_symlink, etc_

> 📂 Cmake supports sub directories which can have their own compilation process:
>
> `add_subdirectory(api)`

# Variables

CMake performs recursive variable expansion. Setting is done via function.

```swift
set(MyString1 "Text1")
set([[My String2]] "Text2")
set("My String 3" "Text3")
message(${MyString1})
message(${My\ String2})
message(${My\ String\ 3})
```

Depending on the type of variable, they get accessed differently

- `${}` syntax is used to reference normal or cache variables
- `$ENV{}` syntax is used to reference environment variables
- `$CACHE{}` syntax is used to reference cache variables

# Commands

## include

Will try to read a cmake file and execute it

## file

Set of file manipulations

```swift
file(READ <filename> <out-var> [...])
file({WRITE | APPEND} <filename> <content>...)
file(DOWNLOAD <url> [<file>] [...])
```

## execute_process

Allows to execute an external process. TIMEOUT can be used. RESULT_VARIABLE allows to collect the exit status code.

## option

Provide a variable that the user can overwrite:

```swift
option(BUILD_SHARED_LIBS "Build libraries as shared libraries" ON)
```

# Sub directories

Allow for the natural inclusion of a file structure.

## add_subdirectory

Will simply execute any nested cmakelists.txt found in the passed directory. This does not imply automatic linking.

## target_link_libraries

It’s used to link the artifacts generated to the target. Root `cmakelists.txt`:

```swift
cmake_minimum_required(VERSION 3.20.0)
project(Rental CXX)

add_executable(Rental main.cpp)

add_subdirectory(cars)
target_link_libraries(Rental PRIVATE cars)
```

Child `cmakelists.txt`:

```swift
add_library(cards OBJECT
	car.cpp
# car_maintenance.cpp
)

target_include_directories(cars PUBLIC .)
```

## add_library

Produces a globally visible target `cars` (basically: will link the symbols). By using the **OBJECT** keyword, only the object files will generated (not a library).

## target_include_directories

Will allow cpp code to include the headers (without providing a relative path. e.g. `#include “myheader.h”`)

# Cross-compilation

Compiling code on one machine-art to be run in another is called **cross-compilation**. The **host** system information variables always have _HOST_ in their name.

## 64 bits

CMake uses the pointer size to gather information about the target machine.

```swift
if (CMAKE_SIZEOF_VOID_P EQUAL 8)
	message(STATUS "Target is 64 bits")
endif()
```

# Cxx standard

```swift
// Pick C++ (11, 14, 17, 20, 23) version
set_property(TARGET <target> PROPERTY CXX <standard>)
set(CMAKE_CXX_STANDARD_REQUIRED ON) // Forces CMake to check the compiler supports the standard
```

## try_run

Command that allows to quickly run an artifact to check after compilation it runs without runtime errors.

# Targets

It’s a recipe that a buildsystem uses to compile a list of files into another file. CMake can create three targets:

- `add_executable()`
- `add_library()`
- `add_custom_target()` → doesn’t necessarily produce an output file

Targets have properties that work similar way to fields of c++ objects.

```swift
get_target_property(<var> <target> <property-name>)
set_target_properties(<target1> ... PROPERTIES <prop1> <value1> ...)
```

## Aliases

Useful if some specific target requires a specific name.

```swift
add_executable(<name> ALIAS <target>)
add_library(<name> ALIAS <target>)
```

# Building

Including header files

```swift
#include <path-spec> // Will check standard include directories, including system directories
#include "path-spec" // Will start searching for the included file in the directory of the current file and then check directories for the angle-bracket form
```

Cmake provides a command to manipulate paths being searched for included files

```swift
target_include_directories(<target> [SYSTEM] [AFTER|BEFORE] <INTERFACE|PUBLIC|PRIVATE> [items...])
```

The `SYSTEM` keyword informs the compilers that the provided dirs are meant as standard system directories (to be used with angle-brackets)

# Linking

Linking relocates individual object files into a single executable (needs to literally relocate pieces of the files together, contains sections headers, sections, and a section header table). Secondly, it needs to resolve references from differenten translation units (each cpp file is a translation unit).

All libraries have a common prefix `lib`.

## Libraries

## Static libraries

Will simply create a static library. Static libraries are a collection of _raw object files_ in an archive. Use them if you want to avoid separating your dependencies from the executable, at the price of increasing size and memory consumed.

```swift
add_library(<name> [STATIC] [sources...])
```

## Dynamic libraries

Shared libraries are built using a linker. This libraries will contains proper section headers, sections, etc. The OS will load a single instance into memory and all subsequently started programs will be provided with the same address.

```swift
add_library(<name> SHARED [sources...])
```

## Shared modules

This is a version of a shared library that is intended to be loaded during runtime, rather than linked during compilation. A shared module is not loaded automatically at the start of a program (like dy libs). This only happens when a program explicitly requests it via system call.

```swift
add_library(<name> MODULE [sources...])
```

## Namespaces

I’ll spare you the details, depending on the linker implementation sometimes symbols/definitions/variables might be resolved or merged or just fail when compiling your program. Namespaces were created for the purpose of encapsulating translation units without having to worry about this collisions. Just use them.

# Fetch content

CMake can also help taking care of fetching dependencies not in your machine:

```swift
// Includes Fetch content plugin
include(FetchContent)
// Declare dependency from a git repo and a specific tag
FetchContent_Declare(cpr GIT_REPOSITORY https://github.com/libcpr/cpr.git
                         GIT_TAG 871ed52d350214a034f6ef8a3b8f51c5ce1bd400)
// Make dependency available as a target
FetchContent_MakeAvailable(cpr)
// Link target with cpr
target_link_libraries(<target> PRIVATE cpr::cpr)
```
