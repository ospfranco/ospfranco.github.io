---
layout: post
title: On SaaS stability
excerpt: A love letter to my team when they scream at me
date: 2019-11-23 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

The last couple of weeks at work where chaotic, we suffered from several bugs across our stack, which caused a lot of friction both with the customers and the internal teams, normally I wouldn't go out of my way to write something, but my team is young and new to the industry of software development, so I'm gonna lay down some points I learned through the years.

## 1. Software has bugs, always has, always will.

There are bugs and there are bugs, [some kill people](https://www.bugsnag.com/blog/bug-day-race-condition-therac-25), [some loose millions in minutes](https://www.bugsnag.com/blog/bug-day-460m-loss), we do our best to learn from them, but I believe to be a truth of life that they will be there in one way or another, the sooner you learn do deal with this reality the better you will be able to handle though situations.

If you company is young and moves fast, bugs will be a daily part of life more than in bigger companies, with more talented or at least big teams, but just to get my point accross:

- [Facebook goes down](https://eu.tennessean.com/story/news/local/2019/04/14/facebook-down-worldwide-today/3464957002/), potential number of customers affected in Europe, **385 MILLION**.
- [Amazon AWS goes down](https://www.readitquik.com/articles/cloud-3/top-7-aws-outages-that-wreaked-havoc/), most of the (modern) internet goes down with it
- Google messes up chrome, [macbooks won't start any more](https://www.forbes.com/sites/kateoflahertyuk/2019/09/26/google-confirms-buggy-chrome-update-is-breaking-apple-macs/#26a62363391c)

These are companies with huge engineering teams! millions allocated to QA and bug prevention, and yet they fail, and despite of it all here we are! we are still using chrome, we are still using AWS, and we are still using Facebook.

The point I'm trying to make is: Life will (most likely) go on, there is no need to tear out your eyes everytimes something goes wrong, because the truth is... **things will (eventually) go wrong**, if your product is worth it people will keep using it.

## 2. It is hugely important you face the challenge as a team

You know what happens when a single server missconfiguration causes facebook to go down in an entire continent, cutting millions in revenue? creating thousands of angry calls, poor reviews, etc. somebody must get fired, right?

No, exactly the opposite, nobody gets fired, the teams immediately start moving, they have trained for this moment, they have contingency plans, the goal is to quickly solve the issue to restore service to the customers, sometimes it takes hours, sometimes it takes minutes, after the crisis has been solved comes the second part.

Among the big players there is a culture of learning from these type of mistakes, [a postportem culture](https://landing.google.com/sre/sre-book/chapters/postmortem-culture/), what went wrong? why did it went wrong? how can we prevent this from happening in the future? They try to extract as much value as possible from the experience and the mistakes, yet looking for whos fault is it, and punishment are not among them.

Yelling at your team does not alliviate the problem only makes it worse, you can clearly communicate the gravity of the issue, we are all smart people working on a complex systems, and we all feel the pressure to deliver perfect system to our customers and feel proud of what we do, blaming and letting your emotions get the best of you only creates an atmosphere which breeds fear, fear of making mistakes, and along that fear teams loose courage to try new things, to move fast and explore new ideas, then **we loose trust among each other**, which afterwards affect personal relationships... it's a Teufelkreis, one you do not want to take part of.

We are all on the same boat together, even if it may not feel that way, and the reasons and causes of things going badly or people not responding at the expected level are more complex than one would expect, as such sometimes we need to take one for the team in order to win on the long term.

## 3. “Yeah, well, you know, that’s just, like, your opinion, man.” — The Dude

You gotta keep your chill man, if there is one thing you are going to take from this article, let it be this, I know it is hard when a customer is yelling at you, when you boss is not happy with you, when you can see bugs piling up in your front door, letting you emotions get the best of you is gonna cut your life short some years.

Nowadays there is a lot of attention on [burn out](https://elladawson.com/2019/11/18/there-is-no-cure-for-burnout/), the truth is nobody can do anything for you, if you get home furious ready to punch a wall, and after a few years (or a few months), you won't be able to handle it, no matter how strong you think you are.

There are two sides to this coin, keeping your head cool will allow you to first, figure out a way of the hole you are in, as fast as you can, and secondly be able to confront difficult situation, it might be having to say goodbye to a client because he cannot wait anymore for a fix or standing up to your boss and saying "I refuse to do this anymore", it is difficult but sometimes there is no other choice, go home, relax, live to fight another day.

This article does not try to set guideline to prevent bugs, there are many([Google's SRE book is among my favorites](https://landing.google.com/sre/books/)) technical guides for that, but rather it is more a mindset recommendation, take it as you will, I learned these lessons by fire, I hope you get to learn from me.
