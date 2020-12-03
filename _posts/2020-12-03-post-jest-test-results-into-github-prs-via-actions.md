---
layout: post
title: Post Jest test results into github PRs via actions
date: 2020-12-03 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
location: Munich
image: assets/taco.png
twitter:
  username: "ospfranco"
  image: "assets/taco.png"
---

At work we recently decided to abandon Bitrise for our simple CI javascript tests, that means, we continue to use bitrise for building our main app (react-native), but we decided to move our jest tests to github actions

## Why leave Bitrise

There is one thing like about bitrise, the amount of available workflows and steps and how you can chain them to create your CI workflow, however, it is **really really slow** and it also becomes **very expensive** for anything that is worth it, at least compared to other alternatives.

Even though we are already on a medium plan, we started hitting a major problem, our app takes at least an hour to compile on iOS, we also have to build Android and Huawei versions, and without paying more money our builds were starting to queue for too long, a simple PR would not get the tests run for a solid hour or more, blocking the entire team.

## But why Github Actions

Actually, I had never worked with github actions, but I decided to give it a go, to compare it with circleCI and actually it was very good!

One of the main reasons it is so good is because it is already integrated to where you code lives, no need to create a org in a different platform, no need to create users, etc, you simply commit the yaml and it starts building the second you push, you won't get better UX than that!

Second reason I really liked it, is the speed! it's just fast, period!

## The big limitation

So getting a basic workflow is not hard, you will find many tutorials out there, but basically it resumes to something simple like this:

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

It's pretty stupid simple, however, I wanted to push things a bit further, I hated having to open the bitrise log page, because loading web pages nowadays is sooo slow, so I wanted to see my failing tests directly on my PR!

A quick google search revealed nothing of use, people apparently have been asking for this feature to github, but nothing official is supported, eventually I ran into an action by tangro, that claimed it would posts some results into the code, unfortunately it did not work organization my repository.

## Enter gh-jester

So, I forked the project, removed the unnecessary parts and added actually the useful output that I was looking for, you can check the [source code](https://github.com/ospfranco/gh-jester), here is a finished YAML you can copy and paste into your github repo:

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

And that is it! you can now enjoy your life letting the machines notify you when something is wrong instead of having to open slow websites.

## Taking it to the next level

So this is all nice and well, here I'm going to share with you how to super charge this even more.

First you get [Tempomat](https://tempomat.dev), now you have notifications in your Dekstop on your builds (of course because it supports github actions), now you have completely automated a chunk of your work.

Once you have set up your github actions workflow and have tempomat installed this is what happens:

1. You push code
2. Github will run your tests (and something goes wrong)
3. `gh-jester` will conveniently posts the resume of what went wrong
4. `Tempomat` will notice your build has failed and send you a desktop notification
5. You click on the notification, Voila! Your life just became faster and simpler, all the info you need and you didn't even have to ask for it or navigate to some slow site
6. Enjoy the time you saved or simple produce even more code! Profits yes!!!

