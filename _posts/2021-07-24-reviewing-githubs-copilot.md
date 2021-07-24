---
layout: post
title: Reviewing Github's Copilot
date: 2021-07-24 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.jpeg
---

Is github copilot even worth it?

Github's Copilot is an AI assistant, trained on github's vast codebase (including repos with disparate OSS licenses), it aims to fill the gaps by throwing code at your face while you go about your day.

I'm not going to go into technical details, all I can give is my impressions after trying it a couple of days

## First it amazed me

As I installed the extension and carried on with my day, I paid a lot of attention to it. I also gave it a lot of slack, I knew even though it was trained with a huge codebase mistakes would be the name of the game.

So I as I went coding my tasks, I would stop and pay attention to the code that was being offered to me, sometimes it would shorten small boilerplate statements, create this variable, autocomplete a hook, it was fun despite failing on the real logic heavy stuff.

The highlight came when I had to write a regular expression, I dislike regular expressions, which means I'm not skilled enough to write them with ease. I struggled to create a first version of the regex I needed, and when I moved to another file and I had to re-use it, Copilot dropped a valid regex on my lap. I won't lie, my jaw dropped, it was more complete that the one I had written, later I modified the code a bit and it spit out a new regex that reflected those changes. Amazing.

## But is it actually correct?

I immediately took the regex that was suggested, assuming it was correct, only to realize later, that the functionality I was coding was broken. I started the debugging the code and realized the problem was in the regex given by Copilot.

In all my disliking for regexes I accepted the suggestion without a second thought. I ended up going back to my original regex and slowly creating the correct version. And here is one of the dangers.

## I believe there is no substitute for the human brain

Copilot, despite being the amazing fact we are able to create it, is still a **dumb** machine. **It doesn't understand where you want to go, only where where it has been**.

I fear that bug production will be automated, since we are tempted to always take the path of less resistance and accept the suggestions without thorough checking. Not that humans are perfect at this, the real question is if Copilot can do better.

## And then it got annoying

So after my excitement died down and I tried to continue to do my work, things got bad.

As I tried to focus in order to write complex pieces of code, Copilot keep throwing code at me whenever I took a brief pause to gather my thoughts, this completely broke my flow state.

All of the sudden I was looking at code that most of the time was: a) wrong, b) wrong but hard to notice why it was wrong or c) hot garbage because it did something completely different. This got tiring fast, instead of focusing the problem at hand I was focusing on correcting errors already.

After half a day, it felt like having a junior dev next to me, constantly interrupting and throwing code at my face... almost there code, but still wrong.

## So... now what?

I'm sure it will get better, the question is... how much better can it get? I don't know

Is it useful sometimes, sure, at least to me it saved me a couple of keystrokes every once in a while

But the constant distraction is 100% not worth it to me, I have now removed the extension. I can only wish the Copilot's team good luck and await for the next iteration!

