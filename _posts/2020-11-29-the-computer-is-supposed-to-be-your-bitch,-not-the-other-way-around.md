---
layout: post
title: The computer is supposed to be YOUR bitch, not the other way around
date: 2020-11-29 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
location: Munich
image: assets/taco.png
twitter:
  username: "ospfranco"
  image: "assets/taco.png"
---

I read this [article](https://reflexio.debec.eu/considerations-before-graduating-engineer) and I found it really good, it brought back a memory from my university days, it was the first *software engineering* class, our first task was for the team to install the same development environment, that meant: install the java development kit and the same IDE, easy right? well, no... at the end of the first week, everyone had installed a different version of the JDK and not everyone had the same IDE, our professor tried to be patient with us, but you could tell we were not exactly humoring him.

So, we started working on our project, some sort of game, doesn't matter, it went as expected, we managed to create a frankenstein's monster that limped to life whenever we ran it on our machines, so come the first presentation, the professor asked us to do something I completely did not expect, he did not ask to see the project running, but rather the asked us to delete the project from the machine, set it up again... it went as expected: didn't work, now bear in mind, we were just kids, just starting on the software world, we came up with the same excuses as every other dev in the world (it was running, it runs on the other machine), but then our professor said something that stuck with me: You are no supposed to build crystal castles.

Now, dear interweb, you are probably reading this, chuckling and thinking "what a noob", but I've been around enough now that I've seen many teams and companies having crystal castles, crystal houses and crystal huts, companies where the product is dependent of the laptop of the guy doing the builds or just dependant on the laptop that has all the certs installed, and it is unbeliviably easy to run into a situation so dumb you cannot believe this can happen to anyone, I have seen CEOs forget their laptops at the table of a restaurant, there goes your company.

So here is my rule of thumb with anything that touches a computer:

## If I am afraid to delete something, I'm doing it wrong

Easy as that, let's go over some scenarios.

### When coding
Everyone uses git, but not everyone knows git, most people I've worked don't really know how powerful it really is, they are still afraid to delete things, and even when they have seemed to delete things, they have not explored all the possibilities git gives them, sometimes they end up manually re-typing their work, the tip here is:

Learn git and learn it properly, read about the `reflog` command, that has saved my ass more than once, loose the fear of moving branches, rebasing branches, cherry picking, use a GUI client for god sake, visually be able to see what you are doing, instead of some wall of text in a terminal, be able to hard reset to origin if something goes wrong

### When building your app/system
Have the certainty that when you delete your repo from your machine, the world will not end, if you have any file that if lost would kill your project/company immediately have a system in place (manual or automated) to securily back it, I cannot stress how important this is, the worst case scenario I should live is: oh great, I have to fetch the keys again or download some json file... annoying, that's it, ANNOYING not life threattening not impossible... the only level of pain I tolerate is annoying, anything else is a recipe for disaster.

### Have the important stuff centralized... also clean it every once in a while
Whic one is the release certificate? who had it? where was it? where was the password? who has admin rights?

NO, just no... the certificate expired, take 1 min of your time to log in into the system and delete it, house keeping is as much part of your job as writting code, have everyone write down important information in a place where everyone (or at least those that need to) have access to it (ps. 1Password)

### EVERYONE IN YOUR TEAM SHOULD BE ABLE TO BUILD THE APP
Period. doesn't mean everyone should have the keys to the kingdom, but means, with time and the correct access anyone should be able to release a new build, hell you can even just offload this to the CI if you want, I don't care, as long as it is doable when things need to be fixed fast.

Basically, here is the gist of what I'm trying to say:

**You, your team, your organization, should not have a single point of failure, there should be NO FEAR when doing mundane tasks like deleting things**

How do you know if you are failing at this? easy: if at some point you get an un-easy gut feeling when moving a file or deleting something, you are failing at this, period.

Let me give you a more concrete example, I have absolutely 0 fear of loosing/breaking my computer, if tomorrow comes and I have to replace it, here is my todo:
- install apps (via brew) = easy doable, easily reproducible
- download my backed up configuration = easy, everything is backed up to github, my bin folder and my `.zshrc`
- re-install certificates or important env variables = annoying, but doable, all the real important info is in 1pass, never have a single copy just in my computer
- personal photos = annoying, but the default back-up system takes care of it

That is it, nothing more, I can replace my computer in a couple of hours and I won't even shed a tear for it, I aim for the same in my software projects, the only way I can sleep in peace.