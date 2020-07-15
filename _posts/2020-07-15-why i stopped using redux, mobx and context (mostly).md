---
layout: post
title: Why I stopped using redux, mobx and context (mostly)
date: 2020-07-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
excerpt: Stop writing state management code
location: Munich
image: assets/marble2.JPG
twitter:
  username: "ospfranco"
  card: "summary_large_image"
  image: "assets/marble2.JPG"
---
This has been one of the biggest changes in the way I build apps and I didn't quite realize myself what it meant from the beginning.

## Why not [MobX|Redux|Recoil|Context|ReduxSagas|UseReducer]?
So you probably already now the world of state management you have redux, mobx, context and new stuff like recoil (which I haven't tried yet), I won't go into the pros/cons of each, there are a lot of resources on the web you can read that are far better than I can write, so I'm going to go straight into the biggest problem I saw with managing state in my web/mobile apps:

90% of the code I wrote was to do state management, did just that... **state management**, that is:
1) Handle user action, set some loading flag, either on state or just on UI
2) Validate the passed thing, push it or fetch thing from server (via Rest or GraphQL)
3) Take response, sanitize it, normalize it, break it
4) Put it... somewhere, follow whatever arbitrary architecture the front-end follows, the best strategy in my experience was having a normalized store, this means I had to write the code to handle a normalized store, fetch by ids, join by ids, create tests to make sure everything behaves properly, etc.

This is all very useless from a business point of view, none of this actions make my application better than the competition nor help me achieve any goals, it is just there for the app to function properly, you know how can I tell? because every once in a while, I will actually have to write actually valuable domain code and the difference is clear, non valuable code will look like it belongs in a RDMS, the code actually has some business logic that is valuable wouldn't work in another app

## You are just using X wrong
Now there are varying degrees to why each of the current solutions fail to do this:

### Redux
I love redux, I really do, it not only provides the mechanism it actually provides an architecture to follow, it's 2020, we all know it's boilerplate as hell... the problem is, *the reducers are full of code that just puts stuff in places*, immerjs makes it look nicer, doesn't make the code any more valuable...

### Mobx (and recoil I presume)
I the past I disliked Mobx, because it has many edge cases (hello async code) and also because it only provides a mechanism (the observer mechanism) and no architecture, and I've seen first hand how teams can **ABUSE** and come up with layers and layers of **useless arbitrary abstraction**, but it is less boiler platey and seems to have nice performance on a larger scale, but I will come back to it later

### Context
If you have to inject more than one or two context providers, welcome to arbitrary code again, with it's own pitfalls of edge cases and workarounds

## Ok, so what now?

so, the question is what to use then? the answer is **a replicated on-device database**, there are many implementations and technologies one can use but it needs to fill some requirements:

- It needs to abstract all the entity management away from you, you should just need to declare your model
- It needs to replicate itself or at least provide sane mechanism to sync to your back-end
- It needs to be ACID complaint or have some SQL like way to interact with the data

I started using WatermelonDB, it was the first time I saw this pattern in action, the technology was not so good, brought many issues and required many workarounds (even though I claimed it scaled better when one had thousands of items and to be fair it kinda does), you also have to sync from device to your back-end, has no replication, but it did show me how this pattern is great.

- I wrote 0 arbitrary "put this thing here and this thing here" code, only when new business requirements came in I had to modify the database model, like any DB you can do migrations when the structure changes, you get strong type guarantees, etc
- It literally runs on SQLite, it persists by default, handles thousands of items, you know what this means? **offline first app for free**, you will need to define your model anyways, once it is there and can handle ALL the items you throw at it... user can always use the app without connection
- I provided a known and battle tested way of interacting with data, instead of me writing buggy selectors/reducers/stores, one writes SQL-like queries
- It provided a sane sync mechanism, just one call, push data to your back-end, pull in another one, instead of having hundreds of graphql fragments or thousands of http requests, you do everything in a single pass

ok, so I wouldn't recommend anyone to use WatermelonDB, or maybe it has been updated since I used it, but right now I'm using RxDB, it is great, the API is similar but does not come with as many compromises, it can replicate itself on a couchDB instance on your back-end, but let me just clarify why this is so important, I've had my share of fuck ups, where data from a device did not sync to our back-end, have you tried to investigate why data is not syncing from a device you have no access to with a customer that is ready to dump your app because it just costed him a day of work... if you have all the data on the cloud you don't need to send db dumps, it won't help if you business logic is faulty, but it removes having to talk to a non-technical human out of the equation.

Let me just list the list of possible options (that I know of):
- RealmJS, seems to be the biggest player on the react/react-native world, it was all open source, now only the client is open source/free, if you want to replicate to a back-end you have to pay them
- Firebase/Realtime Database, it does very nice things, it syncs auto magically, push something it appears on the user's device, Google grade magic, but basically allows the same as the others in this list, but you are locked in to Google whims
- WatermelonDB, open source client only attempt, specially focused on the react-native world, has many pitfalls like blocking UI connectors and no replication, only manual sync possible
- RxDB, my current solution, simple non-blocking API (unfortunately also needs RxJS), can replicate to a couchDB back-end instance, and (mostly) stable, also uses SQLite so performance is great

## What about the stuff that I cannot insert on a DB

There are some use cases that will not fit the DB model, transient UI data, one off flags or apps that are not heavy on entities just a lot of different data, for this stuff you can fallback to the redux, mobx, context, but if you are able to use any of the DBs mentioned and pair it, you are definitely golden, nowadays I use mobx with RxDB.

Why? I only need 1 (maybe 2) store(s), contains mostly shallow data: some UI flags, some piece of string, etc. this self-prevents from blowing up the architecture, it is not as boilerplate heavy as redux/context, again I don't want to write reducers that only do: `{...state, [some random UI flag]: true}` and if my store is so small and has no crazy architecture... the minimal amount of boilerplate is actually a good thing

## Closing topics

I could go on and on about this paradigm, graphQL? meh, if everything the user needs is synced... I don't need it, I can just have one HTTP Rest endpoint, write the rest of the application as normal, no need to insert GraphQL JSX fragments everywhere...

You are now thinking `You are misusing/don't understand [MobX|Redux|Recoil|Context|ReduxSagas|UseReducer]` and I mean, sure, maybe, I don't care, this is my experience and what works for me, you do you... also, don't use Sagas, ever.