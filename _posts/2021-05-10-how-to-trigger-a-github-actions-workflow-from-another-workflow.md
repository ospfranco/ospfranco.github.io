---
layout: post
title: How to trigger a github actions workflow from another workflow (Github workflows chaining)
date: 2021-05-10 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

Here is another post that has to do with my current company migrating CI systems, from Bitrise into Github Actions. While on Bitrise we had workflows that would trigger more workflows. This worked well for us to trigger our android, iOS and Huawei builds.

Unfortunately, when migrating to Github Actions it's not quite clear how to achieve the same. There are some posts on the forums that point to old answers using personal tokens. I lost some time googling around, so I thought I might save the next guy time.

Github prevented triggering workflows from other workflows to prevent recursive triggers. However at some point they added another trigger, so instead of triggering a workflow from a parent, you declare a dependency on the leaf.

Here is an example, this will be a parent workflow:

```yml
name: Fork production builds

on:
  workflow_dispatch

jobs:
  say_hi:
    runs-on: ubuntu-latest
    steps:
      - name: Hi
        run: echo "Hi"
```
> You need to have jobs with a step, otherwise github complains, but this entire things runs in less than a second anyways

and on the child workflow, you just add it to the triggers

```yml
name: Android HMS Production

on:
  # Automatic trigger when pushing tags
  # push:
  #   branches:
  #     - "!*"
  #   tags:
  #     - 'v*'

  # Manual trigger from the UI
  workflow_dispatch:
    inputs:
      message:
        description: 'Build description'

  # Dependency to a forking workflow
  workflow_run:
    workflows: ["Fork production builds"]
```

That's it, now when you trigger the "Fork production builds" (from the github UI), the child (or children) process will run.