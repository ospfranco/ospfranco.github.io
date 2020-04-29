---
layout: post
title: High level thoughts on (software) testing
excerpt: Why are interviewers even asking me about this
date: 2020-04-14 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
logo: "/assets/taco.png"
image: "/assets/taco.png"
location: Munich
twitter:
  username: "ospfranco"
  card: "summary"
  description: "Interviewer infused writting"
  image: "/assets/taco.png"
---

(I got a new keyboard! just putting some randoms thoughts to stretch my fingers a bit, there is nothing new in this article, there are many more qualified people than me to talk about tests and TDD, but there might be one or two interesting anecdotes for veterans)

So I recently went over a round of interviews in different companies and I noticed one thing, I was being asked in each one of them what is my stance on tests, very particular, I wonder if there is some sort of industry trend here in Germany regarding testing or QA, so here are some thoughts in written form

### Tests are (generally) good

Of course there is subtlety in the matter, too many tests and refactoring/changing code becomes costly, too little and you might miss valuable edge cases, somewhere in there, there is an optimum, trying to put a number on it though without taking into a account the context is surely the wrong way of doing things.

I remember a particular story, I believe it was Oracle's database, over the years it has accrued hundreds of thousands of tests, one could argue it is the ultimate example of TDD, but it really sounds a bit nightmarish, every single change or new feature breaks hundreds of tests at the time, so the amount of effort for changing the code is huge, but then again, oracle has been around for a long time, and some very large enterprises continue to use very old deployments, one cannot afford to loose data and create broken migration paths for these these customers, it does sound like the right decision to me to have all this effort every time a new change is introduced (from a business point of view anyways).

### Back-end and integration tests are absolutely necessary, front-end tests on the other hand...

Back-end and unit tests are easy to do (most of the time) and they provide a lot of value, if you are also providing a SaaS (who isn't these days) integration tests are also very necessary, you don't know who is consuming which version of your API out there, minor changes can completely break integration for customers or even older version of your apps.

Regarding apps, if you have a mobile app on iOS and/or Android, I have learned that once some version is out there... it will remain out there pretty much forever, it doesn't matter how much you try to nudge your users into updating, some just won't, in some regards deploying software has gone back to the pre-internet era, where your packaged application once released was untouchable, my advice is, if you are offering a mobile app, build some in-app mechanism to force your users to upgrade when you need to, it will save you a lot of technical support calls and therefore time, it doesn't have to be the first thing you build, but once of you start reaching certain maturity level and start changing your API often, it should be pretty high up the list.

When writing integration tests I also suggest you (also/in addition to) do them from your front-end client, your client (webapp/mobileapp/etc) should have the network layer code encapsulated, there are many benefits to this, not the least making sure your current version of the software behaves correctly, it might not be as good as a full suite of e2e tests but they do provide value.

And this brings me to the last point, front-end testing, to be honest here I haven't had a good experience with front-end testing so far, it is a very clunky and time consuming experience, but alas some subtlety in this point, some components of your front-end code will be very easy to test, they will either be unit tests or close, they pose no problem, however I find the experience of actually trying to mount a large tree of components (in react for example) breaks down completely, or if you are using react native some native components will not mount, I will say that testing your main user paths might provide some value, from my experience I can only say: front-end tests have been so time consuming, require so much effort to implement (hello large component trees), debug (hello looking at text dumps of the DOM) and maintain (hello frequent UI changes), I actually discourage their use in the teams I have worked with.

### Not all tests are created the same

I've seen projects with hundreds of tests, and the teams had a sense of security about their changes, but a large portion of them where there to make sure the API was returning the correct HTTP code, only a handful where actually checking hot paths and business logic, so test creation can become endemic, however there might be some other reason to do it, I know that on large corporates there are security audits, and covering every little corner case to make sure the application is not vulnerable is vital of importance. I don't think they provide the same value though and one can get caught in a loop, where just by having tests that check for 4XX or 5XX cases one gets a false sense of security that the product is behaving correctly, this one is more a slippery slope though, careful consideration should be given to the tests and they should be code reviewed to make sure they actually provide value and they are not just adding to a grand test number.

### Automated testing is no replacement for a QA person

Automated testing is good, I will save (a variable amount) of time and effort and testing any hot path in your application is sure to bring benefits to your end users, however it has it's limits, some might be technical (as mentioned mounting components can be a pain) or some sort of subtle behavior which is not easy to define, but at the end of the day, we build products for other people to use, a pair of human eyes looking at the application will (potentially) provide you with feedback more valuable than automated process could provide you with.

### At the end they are just means to and end

Use your own judgment, take into account your context, can you afford a QA person? does it slow down the release process too much? or should quality suffer for a bit while you try to reach certain business goals, they are all valid arguments and no one is in a better position than you to judge how much effort you should put in creating/maintaining your test suite.

So those are some of my high levels thoughts on testing, did not go into technical detail, because I don't think it matter than much, each programming language will have a different (many) testing frameworks, and some will be easier to do than others and some will not be able to do everything you want, doesn't matter that much, pick your poison, stick with it, it's worth it.
