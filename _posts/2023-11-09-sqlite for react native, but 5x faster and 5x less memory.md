---
layout: post
title: SQLite for React Native, but 5x faster and 5x less memory
date: 2023-11-09
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

I created a new sqlite module for react-native: [op-sqlite](https://github.com/OP-Engineering/op-sqlite). Although it started as some exploration of possibilities, the performance gains where so large that it turned out to be a entire re-write of the module.

# quick-sqlite

I wrote [quick-sqlite](https://github.com/ospfranco/react-native-quick-sqlite) last year after I learned about React Native JSI, a way to bridge C++ code to JavaScript. The idea was simple and I took a peek at existing libraries. One basically takes the arguments passed from JavaScript, and then just call the SQLite APIs, then collect the results of the queries and pass them back to JavaScript.

quick-sqlite already produced a major improvement in performance over the old bridge modules, where data had to be serialized to JSON and then passed between native and JavaScript. The flow was pretty simple:

![quick-sqlite-flow]({{site.url}}/assets/quick-sqlite-flow.png "Quick SQLite flow")

# Where quick-sqlite fell short

There were, however, some issues with quick-sqlite. People complained although it was fast, queries would run out of memory or it would not be fast enough. Given that this was open source work and I already gotten what I wanted I did not pursue further optimizations further. At some point it was not fun and I handed over quick-sqlite to Margelo and went for a long vacation.

I've been back at work for a few months and I have seen the value quick-sqlite provides to companies large and small. But people [kept asking if it could be made faster](https://github.com/margelo/react-native-quick-sqlite/pull/30#issuecomment-1801378465). They already had some good ideas: try to reduce the amount of created strings, use HostObjects to reduce memory foot-print, and so on. Just out of curiosity I decided to try a few things.

In order to really see differences, I set up a test of a database of 300k records, mix of strings, ints and doubles. At lower scales the differences might be so tiny that they don't really matter.

# Migrate to HostObjects

The first obvious idea was migrating to HostObjects (if you don't know what they are, [I made a video about them](https://www.youtube.com/watch?v=_BNinSbzZTE), but think C++ classes bridged to JS). HostObjects are not a cure to all, but they would immediately provide a big benefit: memory consumption would be reduced. On the old flow, I would get the results from SQLite, store them in a vector, and then when I got access to the JS context again, iterate and recreate all the data again in JSI (read: plain JS) objects. This meant that all the price of converting/transfering data from native to JS, was paid upfront. By using HostObjects one can avoid paying this price of copying strings and other values. They would be created once and then stored in memory, when the JS side reaches inside them then they do the conversion of data at that point in time.

It is not perfect, since I'm shifting the price paid before upfront into some cost when accessing the data. But testing showed that access was just the same, and memory consumption was halved! This meant queries that would OOM before now could be run without problem.

# Get rid of holding struct

Another issue was I created a Struct to hold different type of data, due to the nature of JS any value you receive can be of these types:

```c++
struct QuickValue {
  int intVal;
  double doubleVal;
  std::string strVal;
  bool boolVal;
  std::string type; // used to store which type of data this was holding
}
```

There is no justification for this structure other than: I didn't knew any better, my c++-fu was weak. I knew that using this struct would allocate too much extra memory and was wasteful, I just didn't imagine how much. Allocating memory and moving objects around in the heap has a big cost, not only in memory but sometimes in performance!

When browsing the web and other peoples code, I came to learn about [std::any](https://en.cppreference.com/w/cpp/utility/any), which was introduced in C++ 17. It basically functions the same as my struct to hold data (internally it just stores a pointer `void *`). I got rid of the struct and swapped all references for `std::any` and the performance gains were amazing, all of the sudden the performance of the module was 3x as fast. It came with a cost however. `std::any` is awkward to use, it doesn't really store any type information, and at best you can only run code when you know the type of the thing you put in there.

When reading on how to do certain operations, a lot of answers pointed towards [std::variant](https://en.cppreference.com/w/cpp/utility/variant). After getting the code to compile with `std::any` I decided to give `std::variant` a try. Although on the surface it looked the same, it is bounded to types one declared, because it cannot hold any type of data, the compiler can get a little smarter about it. The performance gain was also staggering here, all of the sudden I was almost reaching 6x times the performance.

```c++
#include <variant>

struct ArrayBuffer {
    std::shared_ptr<uint8_t> data;
    size_t size;
};


using JSVariant = std::variant<nullptr_t, bool, int, double, long, long long, std::string, ArrayBuffer>;
```

# Turning the problem around

I had a nagging feeling that somehow I was just wasting so much memory by creating HostObjects that are basically maps, therefore store the same keys over and over again (remember, I switched from creating JS objects to keeping them in HostObjects, but each HostObject contained the same keys). Then I realized I could turn the entire thing around. Instead of thinking of each HostObject as a completely stand alone entity, they could all share the same key set, and only store the actual values!

It took a little while for me to wrap my head around shared pointers. How to store the key set in a vector, that by using a shared_pointer in the HostObjects instances would not get de-allocated. The final result is a combination of what I call a [DumbHostObject](https://github.com/OP-Engineering/op-sqlite/blob/main/cpp/DumbHostObject.h) and [DynamicHostObject](https://github.com/OP-Engineering/op-sqlite/blob/main/cpp/DynamicHostObject.cpp), the dumb objects only hold data, and the dynamic objects can hold anything (that can also be accessed from the JS side), but by combining the two, one can save memory by sharing the key set (in a DynamicHostObject) among many results (DumbHostObjects).

As it turns out, this slightly decreased performance (completely unexpected, who would have thought passing shared pointers around was so expensive), but memory allocation was halved again! That in my opinion is a worthy trade. The original query in quick-sqlite took over two seconds and required 1.2 gbs in memory on iOS. This now runs in ~500ms and requires only 250mbs of memory. The Android performance gains are masive as well, reaching almost 8x the speed.

| Library      | iPhone 15 Pro | Galaxy S22 |
| ------------ | ------------- | ---------- |
| quick-sqlite | 2719ms        | 8851ms     |
| expo-sqlite  | 2293ms        | 10626ms    |
| op-sqlite    | 507ms         | 1125ms     |

# Troubles in paradise

Remember what I said that HostObjects are not perfect? Turns out property access is quite slow, not only because the objects store the keys in a Vector (I tried an `std::unordered_map`, it's even slower, hashing functions and memory layout uh?). So in a way I'm bullshitting you a bit. When running a 300k query, this numbers are fantastic, but if you are running something that returns a couple of hundred of results, you might see no difference at all.

As it turns out, this slow access, might not be even related to the HostObject itself, but any object that is created with the `jsi::Object()` API, when I tested `quick-sqlite` the numbers accessing data are quite similar. `expo-sqlite` was super fast on accessing data, but it zips the data on the JS side, so it seems that is the only way to create fast access objects. This means however you will always pay the price upfront for such large queries.

There are a few final optimizations that can be done, such as inserting keys in the shared vector with some sorting, so then accessing can be done via binary search, but I will leave it for later. Other optimizations include trying to inline more functions, but I think I have reached the end of what is possible with the JSI.

The next big step in performance will come from Static Hermes, where we can finally call SQLite code directly from JS without the need of HostObjects, shared pointers and so on. There will be one major difficulty though, static hermes is still single threaded, so getting React Native to call large queries without hanging will require creating a multi-threaded messaging system, AKA web-workers. I would definetely would like to tackle this problem and then create a new version of op-sqlite with that!
