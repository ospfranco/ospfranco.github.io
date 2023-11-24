---
layout: post
title: Never use anything except a pure UUID (Anti REGEX argument)
date: 2021-12-18 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/oscar.jpg
---

Browsing my notes found this small gem

> Use UUIDs for id-ing your entities. Period.
>
> Do not use anything else, don't try to be clever, it just creates embedded logic and soon you will find yourself regexing your ids like a chump

## Lesson never learned

I first came into this idea many years ago, my college professor was in charge of designing and leading the team responsible for the student system (assignments, class schedules, notes, etc), they bought an Israeli system and then adapted it for our university.

At the time, my professor thought it would be a great idea to make the user ids contain some extra information, so that one could at first glance tell the enrollment year and the student age, so each student id would be something like:

```
[enrollment_year]_[birth_year]_[id_number]
```

This is great in theory, whoemever is in charge already gets some information without needing to type the id into the system.

## Embedded logic

In real life, this created a slew of problems, one of them was that the students id were easily guessable, this created a lot of problems with phishing attempts, this had serious consequences.

But another more subtle was the consequence for the project code itself, since some of the information now did not need a query to the database, then came the REGEXES, to parse and extract this meta information from the IDs.

This generates a lot implicit and embedded logic, what if the ID needs to be changed? then entire parts of the system didn't work properly anymore.

## REGEXES are fine on 5% of the cases

Regexes definitely have their use cases, especially when extracting information from a third-party data source, where you have no control over the data you are getting.

But please, don't ever try to embed data in your systems.
