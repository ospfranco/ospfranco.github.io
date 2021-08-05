---
layout: post
title: Fix slow terminal start (hanging xcodebuild)
date: 2021-08-05 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.jpeg
---

Starting somewhere last year, something happened to the terminal on bigsur, on every clean start up it would hang for many seconds until the prompt was there.

There are some people who have found some solutions, I tried all of them until it **something** worked, so here is a compilation for you to try as well.

## Xcode tools

For some the problem seemed to be they did not accept the license:

```bash
sudo xcodebuild -license accept
```

Related to this, could be that the command line tools are not properly installed:

> In the interest of time this is what seemed to have worked for me

```bash
sudo rm -rf /Library/Developer/CommandLineTools
sudo xcode-select --install
sudo xcode-select -switch /Library/Developer/CommandLineTools
```

## Install git via brew

For some the problem seems to be the integrated git version, replace it via brew:

```bash
brew install git
```

## Install zsh via brew

Others report that the zsh version that comes with mac is old, replace it with:

```bash
brew install zsh
```

## Try messing with NVM

One user reports having a nvm default alias caused the issue for him:

> Tried all Google results and nothing works. Eventually, I found it was caused by setting Node.js v8.x as default in nvm, alias default to system will resolve the issue. Although I don't know why nvm need to run xcodebuild for Node.js v8.x.

## Debug your .zshrc (or .zprofile) script

Sometimes the slowdown could be caused by some extra step, I had a different problem with one of the apps I use, you can see what happens when you start a zsh session with:

```bash
zsh -i -c -x exit
```

I ended up trying a bunch of things here, disabling some plugins, nvm, trying to lazy load components

## Check the multiple files that zsh loads

Zsh loads a lot of files for configuration, it could be possible (not in my case), that some of this is poorly configured, worth a try if you already tried everything above:

https://shreevatsa.wordpress.com/2008/03/30/zshbash-startup-files-loading-order-bashrc-zshrc-etc/

Hopefully this will solve your problem, mine was fixed somewhere between installing zsh via brew and re-installing the xcode-tools
