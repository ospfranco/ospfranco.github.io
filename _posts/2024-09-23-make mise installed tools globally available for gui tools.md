---
layout: post
title: Make MISE installed tools globally available for GUI tools
date: 2024-09-23
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

I'm a very big fan of [Mise](https://mise.jdx.dev). It allows me to quickly swap and install system tools in my macOS machine. Node, Ruby, Python, JDKs, etc. Instead of doing installations that can permanently change the OS and are not easy to revert (even with Homebrew), Mise handles all multiple installations on a per folder level.

I usually set a global version for the most common tools I use, one of them being Node:

```
mise global node@20
```

This works perfectly when I run the commands from the terminal. However, the problem comes with GUI apps such as Android Studio or Xcode. This apps do not execute binaries from a terminal session (at least not a sandboxed one). So one has to make the installed tools available to them. One way that works for single binaries (e.g. node) is to create a symlink:

```
sudo ln -s $(which node) /usr/local/bin
```

However, this breaks down when one has to link a binary that might depend on a relative structure import. One example is npx:

```
sudo ln -s $(which npx) /usr/local/bin
```

Will throw an error whenever the GUI program tries to execute an `npx` command. Because `npx` is just a JS script that calls `npm` internally, however it relies on a relative import:

```
#!/usr/bin/env node

const cli = require('../lib/cli.js')

// run the resulting command as `npm exec ...args`
process.argv[1] = require.resolve('./npm-cli.js')
process.argv.splice(2, 0, 'exec')

// ... the rest of the npx script
```

# Create a wrapper script

In order to solve this issue, create a wrapper script in `/usr/local/bin`. The reason to place it there is because most apps default to known locations (without the chance for you to modify the PATH, e.g. Xcode).

```
#!/bin/bash
# do `sudo touch npx`
NODE_BASE_DIR="/Users/osp/.local/share/mise/installs/node/20/bin"
exec "$NODE_BASE_DIR/npx" "$@"%
```

After creating it give it execute permissions:

```
sudo chmod a+x /usr/local/bin/npx
```

You might need to restart your program or computer for the binary to be correctly found.
