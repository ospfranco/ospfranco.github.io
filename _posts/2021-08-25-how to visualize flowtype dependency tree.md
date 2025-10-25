---
layout: post
title: How to visualize Flowtype dependency tree
date: 2021-08-25 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

At work we use [FlowType](https://flow.org) on our JavaScript application. I'm a fan of JS type checkers, flow is not my favorite, but what is important is that it works.

However, when I joined the company I was surprised on how slow Flow was in our project. The project is large but not extremely large. Facebook codebase is orders of magnitude bigger, yet this is the performance I see sometimes

<iframe width="560" height="315" src="https://www.youtube.com/embed/hloQX8wG0t0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

Upon saving this file, flow triggers a ~420 file dependency check and takes ~10 seconds to actually report any type errors.

# Check that nothing else is wrongly set up

First I started checking nothing was poorly set up in our project. A lot of the debugging [help came from Stack Overflow](https://stackoverflow.com/questions/68833468/how-to-debug-flowtype-extreme-slow-performance?noredirect=1#comment121793043_68833468) and other people with flow experience.

Some of the things I tried:

- Deleting flow-typed definitions: sometimes they contain cycles or redundant definitions which can slow down flow
- Got rid of circular dependencies: we had 2 - 3 circular dependencies in our code
- Shuffled around types: Moved types here and there to no avail
- Messed around with the .flowconfig: set up LSP, lazy mode FS, changed max workers, toggled various flags
- Blamed the plugin: I'm using the FB plugin for flow on VSCode, which does seems to over-query the flow server on each keystroke, tried another plugin which only queries on save, feels like a minor improvement but still slow
- Tried several small flow repos: none experienced this slow down

# Assume flow is actually right

Flow is a large project and facebook depends on it, so the chances that it is doing something wrong are slim, but I couldn't believe making a change on certain file, did indeed trigger a 400+ file check. I needed to make sure.

I scoured the web trying to find out how debug the type dependency tree, but found nothing. The biggest pain point for me about flow, is the utter lack of documentation and community, the flow team also pays very little attention to the outside world and their priority is to support the facebook codebase.

After many hours ended up figuring out the right command to output the entire dependency graph for the app:

```bash
yarn flow graph dep-graph --strip-root --out ./output
```

This however it only produces the entire app graph... you can imagine this file is hundred thousand of lines of dependencies. In any case, this outputs a DOT file (from graphviz), which in theory you can easily visualize by using the right command:

```bash
# install dot via "brew install graphviz"

# I tried a png first... it just fails

dot -Tsvg output -o graph.svg
```

This produces an svg so massive and so filled with squigly lines it is effectively useless... so I had to narrow down the output to just an entry file which I'm interested. Unfortunately the `graph` command does not take an entry point to generate the graph, so I had to manually narrow down the graph that I had. Here is the gist with the script I ended up coming up with:

<script src="https://gist.github.com/ospfranco/d599a68f1a2fe1f39a457162238fec78.js"></script>

> Note: I removed the first and last line of the graph file before passing it to the script

This allowed me to crawl through the entries and finally specify an entry point to the sub-tree that interested me. Once narrowed down, I could finally produce another visualization, and the result is:

![flowdep1]({{site.url}}/assets/flowdep1.png "flowdep1")

Terrible! But not all is useless, I can see the direct imports from the file are correct... and I can indeed see things spiral out of control, importing certain files ends up pulling the entire application code!

![flowdep1]({{site.url}}/assets/flowdep2.png "flowdep1")

The count of objects in this sub-graph also seems to match closely the output produced by flow, this sub-graph has 415 nodes and the editor triggers a 420 file re-check.

# Conclusion?

Well... it seems to me Flow is doing nothing wrong, it indeed produces the correct dependency graph, but rather that our import structure has grown unchecked so large over the years that we have some architectural mistakes we cannot escape.

My current analysis is that Redux and Sagas are mostly to blame, the boiler plate nature of it and the coupling of action creators, action definitions and the reducers into single files ends up creating this web of dependencies.

Some very abstract suggestions for those along this path:

- Do not place your action definitions (and creators if you use them) inside the same files as your reducers.
- The moment you start seeing a performance degradation in your type checking, is the time to figure out why, pushing the can down the road will lead to trouble.
- Come up with a sane import architecture, minimizing the dependencies between separate files. I think I will write about this in the future.
