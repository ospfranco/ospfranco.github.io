---
layout: post
title: How to trigger a github actions workflow from another workflow (Github workflows chaining)
date: 2021-05-10 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.jpg
twitter:
  username: "ospfranco"
  image: "{{ site.url }}/assets/profile.jpeg"
---

Here is another post that has to do with my current company migrating CI systems, from Bitrise into Github Actions. While on Bitrise we had workflows that would trigger (fork) more workflows. This worked well for us to trigger our android, iOS and Huawei builds with a single click.

Unfortunately, after migrating to Github Actions, it's not quite clear how to achieve the same. There are some posts on the forums that point to old answers using personal tokens. I lost some time googling around, so I thought I might save the next guy time.

In the past Github prevented triggering workflows from other workflows to prevent recursive triggers. However at some point they added another trigger, so instead of dispatching a build from a parent, you declare a dependency on the child workflow.

Here is an example of a parent workflow:

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
> You need to have jobs with a step, otherwise github complains, but this entire workflow runs in less than a second.

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
    type:
      - complete
```
> The 'complete' type is just so that this workflow triggers after the previous one has been completed.

That's it, now when you trigger the "Fork production builds" (from the github UI), the child (or children) process will run.

If you want even more details about your CI builds and workflows on github, you should check [CI Demon](https://ospfranco.github.io/cidemon), it's an app that I made that puts your builds right on your mac Desktop.