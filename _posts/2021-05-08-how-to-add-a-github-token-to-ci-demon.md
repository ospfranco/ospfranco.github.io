---
layout: post
title: How to add a github token to CI Demon
date: 2021-05-08 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

[CI Demon](https://ospfranco.github.io/cidemon) is an app I created to monitor my CI builds and deployments from my macOS desktop. It works based on tokens to authenticate with the CI providers APIs. Sometimes to generate this tokens is not quite straightforward, so here is a simple guide for github tokens.

## About CI Demon

If you haven't heard about CI Demon, it is a macOS status bar application. Instead of waiting for entire web apps to low to see if your build has passed or failed, it puts the a simple status icon on your macOS status bar. When open it shows you a list of PRs, branches or even endpoints for you to quickly fix/attend to any issues.

![CI Demon preview]({{site.baseurl}}/assets/small_ci_demon.jpg "CI demon preview")

As stated it works based on tokens, the thing is, this tokens never leave your computer, they are all stored on the macOS keychain, so no need for you to worry what I do with your personal information (I don't do anything because I don't have access to them).

## Generating a Github token

The most tight integration is with github and sometimes people have some problems adding their tokens into the app, so let's walkthrough generating a token.

### Open github.com

First you want to open github and go to your account settings.

![CI tut 1]({{site.baseurl}}/assets/CIDemonTut1.png "CI tut 1")

### Go to Developer settings

You then go to developer settings options

![CI tut 2]({{site.baseurl}}/assets/CIDemonTut2.png "CI tut 2")

### Select personal access tokens

You should now see a list of your personal tokens, you create a new one clicking in the generate new token button. (You might be prompted to input your password).

![CI tut 3]({{site.baseurl}}/assets/CIDemonTut3.png "CI tut 3")

### Create the token

You can put a note in the token, I just put CI Demon in case I one day forget why I created that specific token, on the permissions you want to give it only the necessary permissions. Giving it repo access is enough, unfortunately you cannot give it read-only access, but I promise you the app is strictly read only (with the exception of re-triggering builds).

Afterwards you will see your token, copy and paste it, this will be your only chance.

![CI tut 4]({{site.baseurl}}/assets/CIDemonTut4.png "CI tut 4")

### Add it to CI Demon

On CI Demon, on the settings menu, go to github actions and paste your token in there.

Now there is a small inconvenience here, due to some API limitations, you have to manually specify which repositories you want to watch, so here put your repository `slug`. An slug is the username and the name of a repository, e.g. `ospfranco/link-preview-js`.

You can also select if you want to see branches and/or PRs.

![CI tut 5]({{site.baseurl}}/assets/CIDemonTut5.png "CI tut 5")

That's it, you should now be able to see your CI information right on your Desktop. If you haven't heard about CI Demon, [you should check it out now](https://ospfranco.github.io/cidemon).