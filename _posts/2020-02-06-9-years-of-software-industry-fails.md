---
layout: post
title: 9 years of software industry fails
date: 2020-02-06 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: /assets/laugh.jpg
---

I took some time from my currently busy schedule (I'm jobless, hire me please!) to recollect funny situations on my years as a professional developer, if you are a friend of mine you might be on this list, please take it lightly, I mean no harm and the purpose is to laugh a bit, god knows that I have made a lot of mistakes with more serious consequences, but maybe I can shine a light on the irrationality of the industry. (my reactions are emojis encapsulated in square brackets)

---

Once I had to handover a project to a Hungarian team, we started introducing ourselves, there were 4 people from the other team, the conversation goes like this:

```
1st guy: Hi, I'm Foo, I'm a Software Architect at Bar" [🙂]
2nd guy: Hey I'm Foo2, also a Software Architect" [🤨]
3rd guy: I'm Foo3, and I'm ALSO a Software Architect at Bar [🙄]
CEO: I'm the CEO but I also do Architecture of the products [🤦‍♂️]
me: I'm a... Engineer here
```

Either a) Hungary is full of software architects or b) I've been doing things wrong my whole life, needless to say the 3.5 architects botched the handover, treated us like we were the worst developers to walk on the face of the earth and a few months later I was receiving weekly E-mails asking for support.

Bonus: They complained our codebase contained too much code repetition, I refactored the code in 3 days, removed a few hundred lines of repeated code, just to flip the finger at them, go architect that one 😘.

Bonus 2: It took them a year to release an update to the app, I downloaded and it immediately crashed, they released another update in a week, but they lost all customer data that was not uploaded during that week, the app also looked like it was made by a first year programming student.

---

When I was in college I was deep into competitive programming, after some time you master some techniques like string manipulation and what not, anyways, one day one ex graduate now working in another country comes back into the lab and starts yapping about how he is working with the latest and greatest and pushing new research, etc. [🤔] you could tell he was rubbing it, anyways, another guy in the lab asks him for help with a simple string manipulation problem, they sit down, the guys starts to try to solve the problem, 30 mins go by... they guy is still trying to figure out how to extract characters from a String in Java [😂].

---

The first company I worked at was an offshoring company, the CEO/Owner was a guy born in the country but raised in the U.S., that guy alone deserves a book and not because he was a great boss, anyways, the lead tech officer was another guy constantly yapping about performance and claiming he had already built/seen everything... anyways, our project was still on the experimental phases and at some point management decides it is time to put the pedal to the metal, so they put him on the team so he can correct our slowness, the guy comes into our office one morning sits down and starts yapping on how the code looks bad [😢], he clones the repositories and start to try to get the back-end running... when I left the office that day he still did not manage to get a server instance running [😂].

Bonus: the english level of most people was frankly terrible so the american management openly talked on the phone in english, mine was quite good but most didn't know about it, anyways, one time I heard the CEO saying: "The guys here in Bolivia are not very bright, but they are cheap and if you lead them right they can accomplish some stuff", my wishes to that guy shall remain private [🖕] I left the company shortly afterwards.

---

I've trained a few interns/junior devs over the years, some are surprisingly capable, most are average and some are truly clueless, one time I had a dev really struggling even with the most basic tasks and some point I got tired of fixing his code and I sat down with him,

```
- Ok, connect that button
- [...starts typing]
- Wait, that is wrong, why don't you run you algorithm on paper first
- [stares at the screen for 30 seconds]... how do you do that?
- 😐
```

had to teach them how to run an algorithm in his head first and write it down on paper.

I tremble when I imagine what colleges around the world teach their students.

---

So.Many.Stories.With.Russians/Indians, they can be brutally smart and efficient but they can also be a pain in the neck, like barely reading the task descriptions, start typing immediately to the first thing they understood (it is even worse when they have poor english level) and then leaving the fire for the next guy to deal with, sometimes they would disappear from the projects as the clients got fed up with them... I always joked they were sent to vacations to Tijuana.

---

Nobody is born knowing how to run a company, we all have insecurities but sometimes people in charge try to crowd source answers or delegate responsibilities with the most hilarious outcomes:

- put an internal company poll, results: 50% - 50% [😂 I hope they understood that means: nobody has a fucking clue]
- ask a newbie to take care of JIRA, congratulations you now have 9 swim lanes and playing task tetris [🏊‍♂️]
- sometimes the process can be so fragmented and ownerless that nobody realizes a fuck up until it is too late, like creating a 3 screen workflow and when the final product is reviewed there are only 2 screens [🤦‍♂️].

---

By wide and far non technical people present the most frustrating and funny situations though, it is both sad and scary to think that most users are on this level, it is hard to recall all of the situations but the latest one went something like this:

```
- Hey Oscar, there is a bug in the app, on the photos there is a grey margin around the pictures
- a what? [🧐]
- yeah, look, when I open a picture the space around the picture is gray
- that is the background and it has been like this for the last 6 months [😐]
- ah, I see
```

---

It is extraordinarily painful to see people design... anything, independent of what is being designed.
back-end devs coming up with their own APIs:

```
- route is: `/api/v1/user/{userId}/report/generate_new_report_with_date?date=null`
- but... why is the date optional?
- I don't know, that is what the ticket said
```

front-end devs coming up with routing:

```
- you take the current stack name, the name of the file you are pointing to and then the name of the internal component
- so... I have to go spelunking three different folders to figure out the name of the route
- yes, it's very logical
```

designers:

```
- All buttons are grey and all the icons look the same
- Your point?
- ... I don't think this will work
- The client already approved the design
- But seriously! all the screens look the same! all the buttons look non-clickable...
- No, I like it that way
```

How many apps has the fucking (corporate) client designed? [🤦‍♂️]

Sometimes I wonder... are people not human? most people can clearly recognize good design, a beautiful painting, a well designed machine or a well decorated room, put them in front of a computer... out goes all common sense, you are not designing [INSERT YOUR THING HERE] for a higher being, you are designing your thing for the lowest common denominator of what it is considered a homo sapiens, that includes YOU, jobs was a genius for being able to do this.

I hope one day sit down with colleagues and collect all these and many more stories, I'm sure we have all lived through them in the mean time I will continue to enjoy this beautiful profession I have chosen.
