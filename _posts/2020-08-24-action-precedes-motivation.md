---
layout: post
title: Action precedes motivation
date: 2020-08-24 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
location: Munich
image: assets/taco.png
twitter:
  username: "ospfranco"
  image: "assets/taco.png"
---

Over the last few years I've been trying to build some products so I can make some money on my own, the goal is clear, to have my own business, with the bare minimum being a lifestyle business where I don't depend on any one else to sustain myself.

As one would expect the road is full of bumps and setbacks, but I would like to talk about something that happened to me over the weekend that I find very interesting.

## Stopped adjacent work

I created and maintained a package called link-preview-js, I created it a couple of years ago when I had to solve a problem at work, the solution was generic enough that it led me to think I could open source the package and benefit the community, and it did bring me joy for a while, I felt like I was giving back, issues would pop up, other devs would ask for functionality and I would start working on it at the drop of a hat.

Well, I have decided to stop maintaining the project, the repo is now read-only and I don't plan to create any new releases for it, here is just a copy of the tweets I sent when I made my mind:

```
After giving it some thought, I'm think I'm ready to stop maintaining link-preview-js, I already put many hours over the last couple of years into the project and gotten very little out of it

There are a few problems with it (and OSS in general), I created it to solve a problem at work some years ago, thought I share it, since then, I have had a couple of people being very rude or try to sweet talk me into adding the functionality they need... which I hate both online and real life, every once in a while something gets broken and I have to spend time where I would rather be doing that actually benefits me (economically or emotionally) than to maintain a package I don't even use myself anymore. 

The main dependency of the project has been abandoned and you can bet I'm not going to spend any more time fixing it as it could be a inordinate amount of hours.

But the thing that really gets me is... nobody cares, they come they use the package, the see something is wrong with it and they ask for functionality, sometimes they open a PR but it is 90% of the time half-assed, I have to think of edge cases, clean code, tests, etc

The most I could get out of this is some recognition after years of work and some job offer... which doesn't align with my long term goals of having a business on my own, I don't care about jobs

so... all in all... makes little sense to me to spend anymore time on these OSS packages, I'm not willing to maintain them nor will they remotely bring anything to my life.

So time to say good bye.
```

basically, I've realized even though what I was doing benefited the community, I just doesn't align with my personal goals, and I know it is selfish.

You know what, even though it is such a small thing, it is a weight of the shoulders, the package was becoming obsolete by the day and it was always screaming in the back of my mind that it needed attention, now... it's just gone, I don't have to care about it, I can care about my current problems in code and in real life, the effect small things have in our psyche is astounding

## I hit a road block and then...

In the last few months I've been working in a zettelkasten app (yes, I know Roam Research and Foam), I hit a technology bump a few weeks ago and motivation dropped rapidly, I spent time on Tempomat, meeting friends, doing sport, because all of the sudden I felt lost, it was not a big deal, I could still continue with the project (albeit without one visual feature, cannot draw SVG graphics), but identified 3 problems with myself:

### I get frustrated easily

Sometimes I get frustrated with people, sometimes with computers (as in this case), but I immediately want to stop doing w/e it is I'm doing, I try to live very simply, I do not like to complications, but I seem to loose the long term goal very easily and just drop everything, in this case like I said, the problem wasn't a show stopper, but a few other problems mounted up and I just reached a limit... which is normal, the problem is, I did not feel like getting back to work after recharging, I have now stopped working on it for a couple of weeks, my energy levels are back to normal, so I **forced** myself to get back to it, and immediately faced another recurring problem:

### I get decision paralysis

I always reach this point where I do not have any absolute idea what to do next, let me explain this particular scenario, I've been working mostly on the front-end for most of my career, I've also done back-end but on a higher level, I've had a back-end developer that scafolds the main project and I jump in every once in a while to help, fix a bug, create a module, I can do SQL, I understand the big concepts and I have created the high-level architecture of back-end systems, I have also been in charge of deploying and maintaining deployments, but I just have never scafolded the back-end from scratch.

So I now need to do it for my project and... **there is just too many choices**, do I go for the safe route and start with Springboot? but I dislike Java (or Kotlin) and I want to re-use the code, Nest.js is a bit better but I don't know if I can make it scale, how about lambdas, I've tried to build an entire service on top of them... I sounds like a bad idea... but it sounds like future proofing my project if someday I have to scale... and then there is entire AWS console... the CDK helps, but that takes time and you end up creating a bunch of micro disconnected functions... this is all so complex that my brain just freezes, the problem with having done a bit of everything is that you know the good **and the bad**, it feels like it doesn't matter what I choose it will be the wrong decision, but you know what, **if everything is the wrong decision, you might as well make it and fix it later**

### Being so high-level is not always good

I've always taken pride in being a `high-level` developer, I would never call myself front-end, back-end, javascript or w/e developer, because technology doesn't matter and it changes all the time anyways, we are here to solve problems, but in this case it bites me in the butt, I have a very clear picture of what I want to achieve "each user should have a replicated database on my back-end system, so not only I can sync their information but also have a online copy"... then the next question is **how the fuck do I achieve that... no clue**, do I start **N** databases processes? how do I pipe the replication? how do I authenticate the users (the db I'm using has built-in replication)? how do I make all this work with Nest.js which is great but is not so popular and has not that much documentation for this funny uses... this was the one that really paralyzed me... this are all good questions, some to which I still don't have an answer to but

## Action precedes motivation

I went to the gym Sunday morning and I was listening to this [hidden brain episode](https://overcast.fm/+YsrgrI73Y) and they gave a tip how top performing athletes seem to achieve the impossible, **they narrow their focus on one thing at the time, just ONE THING, visualize it, put it your mind, don't think about anything else** and I thought... I'm thinking about too many things at once, this is why I cannot move forward, so I came home and forced myself to sit down and take **ONE STEP**, sync the client database with the server database, no back-end, no authentication, no endpoints, just two databases... it took me a little while, but after half and hour or so:

![replicated database]({{site.url}}/assets/replicated_database.png "replicated database")

there are still many things I will need to figure it out, but the feeling of progress... of achieving one thing, it gives a lot of motivation, **action precedes motivation** not the other way around... if I wait until I feel like working every time, until I crack the complete nut, until the milkshake is ready before I prepare it, I will wait forever.

I've realized that your brain is your best friend and your worst enemy and slowly been discovering not only my internal difficulties and biases but also small tricks and tips on how to move forward, sometimes they are big sometimes they are small, but it seems (at least in my case) **discipline** is the way forward, convincing myself that even slow tiny progress is progress and it is worth it, with a combination of crazy focus, I might actually be able to achieve what I want

