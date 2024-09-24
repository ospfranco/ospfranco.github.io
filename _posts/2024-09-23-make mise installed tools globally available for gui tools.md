---
layout: post
title: Make MISE installed tools globally available for GUI tools
date: 2024-09-23
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

I'm a very big fan of [Mise](https://mise.jdx.dev). It allows me to quickly swap and install system tools in my macOS machine. Node, Ruby, Python, JDKs, etc. Instead of doing installations that can permanently change the OS and are not easy to revert, Mise handles all of that, even on a per folder basis.

However, I don't always want to configure the environment per folder. So I usually set a global version for the most common tools I use, one of them being Node:

```
mise global node@20
```

This works perfectly when I run the commands from the terminal. However, the problem comes with GUI apps such a Git Fork or Xcode. This apps do not execute binaries from a terminal session (at least not a sandboxed one). So one has to make the installed tools available to them. One way that works for single binaries (e.g. node) is to create a symlink

```
sudo ln -s $(which node) /usr/local/bin
```

However, this breaks down when one has to link a binary that might depend on a relative structure. One example is npm:

```
sudo ln -s $(which npm) /usr/local/bin
```

Will throw an error whenever the GUI program tries to execute an `npm` command:

```
node:internal/modules/cjs/loader:1148

  throw err;

  ^

Error: Cannot find module '/usr/local/lib/node_modules/npm/bin/npm-cli.js'
```

It seems `npm` is in itself a link that tries to call the real `npm-cli.js` script. In any case, it doesn't work. So here is a somewhat convoluted workaround, but at least it allows me to have the tools globally installed

# Create a Symlink to the Entire Node.js Directory

Instead of symlinking only npm, I symlink the entire directory where Node.js (and its bundled npm) is installed. Here's how:

Find the npm directory: First, find where npm is installed. If you installed Node.js with mise, npm is likely installed alongside it in a specific directory:

```sh
which npm
```

This will show you the path to the npm binary, and npm-cli.js will likely reside in a folder like `/Users/osp/.local/share/mise/installs/node/18/bin/npm`.

Symlink the Node.js directory to /usr/local/bin: Create a symlink for the entire Node.js directory, so both node and npm can correctly reference their internal files.

```bash
# You probably need to create /usr/local/lib
sudo ln -s /Users/osp/.local/share/mise/installs/node/18/bin/ /usr/local/lib/nodejs
```

Modify `/etc/paths` which is a file that contains system wide paths independent of terminal sessions or not:

```
/usr/local/lib/nodejs/bin
```

That's it, afterwards GUI programs should be able to run npm/npx scripts without an issue.
