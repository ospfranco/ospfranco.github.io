---
layout: post
title: SQLite for React Native, but 5x faster and 5x less memory
date: 2023-11-09 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.JPG
---

I love a good technical write-up, so here is one for [op-sqlite](https://github.com/OP-Engineering/op-sqlite) my new SQLite module for React Native.

# quick-sqlite

I wrote quick-sqlite last year after I learned about React Native JSI, a way to bridge C++ code to JavaScript. The idea was simple and I took a peek at existing libraries. One basically takes the arguments passed from JavaScript, and then just call the SQLite APIs, then collect the results of the queries and pass them back to JavaScript.

quick-sqlite already produced a major improvement in performance over the old bridge modules, where data had to be serialized to JSON and then passed between native and JavaScript. The flow was pretty simple:

![quic-sqlite-flow]({{site.url}}/assets/quick-sqlite-flow.png "Quick SQLite flow")

In order to really tests the numbers at a good scale, I set up a test of a database of 300k records, mix of strings, ints and doubles. At lower scales the differences might be so tiny that they don't really matter. But when, large I could better see if the changes I was making made sense.

# Where quick-sqlite fell short

There were however some issues with quick-sqlite. People complained although it was fast, queries would run out of memory or queries would not be fast enough. Given that this was open source work and I already gotten what I wanted I did not pursue further optimizations further. At some point it was not fun and I handed over quick-sqlite to Margelo and went for a long vacation.

I've been back at work for a few months and I have seen the value quick-sqlite provides to companies large and small. But people [kept asking if it could be made faster](https://github.com/margelo/react-native-quick-sqlite/pull/30#issuecomment-1801378465). They already had some good ideas: try to reduce the amount of created strings, use HostObjects to reduce memory foot-print, and so on. Just out of curiosity I decided to try a few things.

# Migrate to HostObjects

The first obvious idea was migrating to HostObjects (if you don't know what they are, [I made a video about them](https://www.youtube.com/watch?v=_BNinSbzZTE)). HostObjects are not a cure to all, but they would immediately provide a big benefit: memory consumption would be reduced. On the old flow, I would get the results from SQLite, store them in a vector, and then when I got access to the JS context again, iterate and recreate all the data again in JSI (read: plain JS) objects. This meant that all the price of converting/transfering data from native to JS, was paid upfront. By using HostObjects one can avoid paying this massive price of copying strings and other values. They would be created once and then stored in memory, when the JS side reaches inside them then they do the conversion of data at that point in time.

It is not perfect, since I'm shifting the price paid before upfront into some cost when accessing the data. But testing showed that access was not necessarily too slow, and memory consumption was halved! This meant queries that would OOM before now could be run without problem.

# Get rid of holding struct

Another issue was I created a Struct to hold different type of data, it was `QuickValue`;

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

When browsing the web and other peoples code, I came to learn about `std::any`, which was introduced in C++ 17. It basically functions the same as my struct to hold data. I got rid of the struct and swapped all references for `std::any` and the performance gains were amazing, all of the sudden the performance of the module was 3x as fast. It came with a cost however. `std::any` is awkward to use, it doesn't really store any type information, and at best you can only run code when you know the type of the thing you put in there. When reading on how to do certain operations, a lot of answers pointed towards `std::variant`. After getting the code to compile with `std::any` I decided to give `std::variant` a try. Although on the surface it looked the same, because it cannot hold any type of data (internally it just stores a pointer `void *`), the compiler can get a little smarter about it. The performance gain was also staggering here, all of the sudden I was almost reaching 6x times the performance.

# Turning the problem around

Still not satisfied, I had a nagging feeling that somehow I was just wasting so much memory by creating HostObject that store the same key data over and over again (Remember I switched from creating JS objects to keeping them in HostObjects, but each HostObject contained the same keys). Then with a good ol' flashback to my programming contest days, I realized I could turn the entire thing around. Instead of thinking of each HostObject as a completely stand alone entity, they could all share the same key set, and only store the actual values!

It took a little while for me to wrap my head (really this time) around shared pointers. How to store the key set in a vector, that by using a shared_pointer in the HostObjects instances would not get magically de-allocated, but I finally managed to do it. The final result is a combination of what I call a [DumbHostObject](https://github.com/OP-Engineering/op-sqlite/blob/main/cpp/DumbHostObject.h), an object that only holds data but has a pointer to the shared keys between all of the DumbObjects created when executing a SQL query.

As it turns out, this slightly decreased performance (completely unexpected, who would have thought passing shared pointers around was so expensive), but memory allocation was halved again! That in my opinion is a worthy trade.

# Troubles in paradise

Remember what I said that HostObjects are not perfect? Turns out property access is quite slow, not only because the objects store the keys in a Vector (I tried an `std::unordered_map`, it's even slower, hashing functions and memory layout uh?). So in a way I'm bullshitting you a bit. When running a 300k query, this numbers are fantastic, but if you are running something that returns a couple of hundred of results, you might see no difference at all. As it turns out, this slow access, might not be even related to the HostObject itself, but any object that is created with the `jsi::Object()` API, when I tested `quick-sqlite` the numbers accessing data are quite similar. `expo-sqlite` was super fast, but it zips the data on the JS size, to it seems the only way to get super fast access is to create objects on the JS side. This means however you will always pay the price upfront for such large queries.

There are a few final optimizations that can be done, such as inserting keys in the shared vector with some sorting, so then accessing can be done via binary search (o nlogn time), but it seems overkill for me atm, doubt it will make a real difference. Other optimizations include trying to inline more functions, but I think I have reached the end of what is possible with the JSI.

The next big step in performance will come from Static Hermes, where we can finally call SQLite code directly from JS without the need of HostObjects, shared pointers and so on. There will be one major difficulty though, static hermes is still single threaded, so getting React Native to call large queries without hanging will require creating a multi-threaded messaging system, AKA web-workers. I would definetely would like to tackle this problem and then create a new version of op-sqlite with that!
