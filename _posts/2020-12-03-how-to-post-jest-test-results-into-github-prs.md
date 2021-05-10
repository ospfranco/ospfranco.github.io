---
layout: post
title: Post Jest results into Github PRs
date: 2020-12-03 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
location: Munich
image: assets/taco.png
twitter:
  username: "ospfranco"
  image: "assets/profile.jpg"
---

At BodyFast we recently decided to migrate out of Bitrise for our javascript tests, that means, we continue to use Bitrise for building our react-native app but all other tests (jest, lint, flow, tsc) are now running on github actions

## Why leave Bitrise

Bitrise is good because the amount of available workflows and steps and how you can chain them to create your CI workflow, however, it is **really slow** and it also **expensive** for faster build machines.

Even though we are already on a medium plan, we started having queueing slow downs, our app takes an hour to compile on iOS (plus Android and Huawei versions) and without paying more money everything slowed down, a simple PR would not get the tests to run for a solid hour  blocking the entire team.

## Github Actions are quite good actually

They are fast, already run on the same platform where the code is, setting them up was a breeze and they are plenty fast

Getting things to run was a breeze, not a fan of yaml, but setting up the first iteration took 5 mins, here is a sample yaml:

```yaml
name: JS Checks
on: push

jobs:
  tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js 12.x
        uses: actions/setup-node@v2.1.2
        with:
          node-version: 12.x
      - name: Install Dependencies
        run: yarn
      - name: Run tests
        uses: yarn test
```

However, I wanted to push things a bit further, I hated having to open the bitrise log page, because loading web pages nowadays is sooo slow, so I wanted to see my failing tests directly on my PR!

A quick google search revealed nothing of use

## Introducing gh-jester

I forked an old project that claimed to do what I needed, removed the unnecessary parts and added actually the useful output that I was looking for, you can check the [source code](https://github.com/ospfranco/gh-jester), here is a finished YAML you can copy and paste into your github repo:

```yaml
name: JS Checks
on: push

jobs:
  tests:
    runs-on: ubuntu-latest

    steps:
      - name: Cancel Previous Runs
        uses: styfle/cancel-workflow-action@0.6.0
        with:
          access_token: ${{ github.token }}
      - uses: actions/checkout@v2
      - name: Use Node.js 12.x
        uses: actions/setup-node@v2.1.2
        with:
          node-version: 12.x
      - name: Install Dependencies
        run: yarn
      - name: Run tests
        uses: ospfranco/gh-jester@v1.0.13
        with:
          post-comment: true
        env:
          GITHUB_TOKEN: ${{ "{{ secrets.GITHUB_TOKEN"}} }}
          GITHUB_CONTEXT: ${{ "{{ toJson(github)"}} }}
```

Basically, it will run your jest tests and if the tests are failing it will post a nice resume on the commit itself (which will also appear on the PR), bear in mind, the trigger needs to be [push] for it to correctly post the comment with the info.

![gh-jester comment]({{site.url}}/assets/gh-jester.png "gh-jester")

And that is it! Now all the info for your PR is right on the comment section, enjoy!