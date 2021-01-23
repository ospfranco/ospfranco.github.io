---
layout: post
title: Monorepo codesharing (with lerna.js and typescript)
excerpt: Reduce code duplication using some tooling and share code between projects
date: 2019-08-27 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
location: Munich
---

If you are using javascript in different parts of your platform (mobile app, SPA web app, node server, etc.) at some point you might end up duplicating code between them, sometimes it makes a lot of sense to get rid of duplication, sharing models for example.

The deployments for this example are:
- React SPA (redux, typescript)
- React-Native mobile app (redux, typescript)
- Main Springboot Server (Kotlin)
- Backoffice NestJS Server (Typescript)

All of them reside within a mono repository, from which individual docker containers are built and deployed to the cloud.

# Share our front-end app and mobile app redux code

### Using lernajs

Lernajs is a tool that shares codes within a monorepo, it handles your package dependencies by hoisting them to the root folder of the repo. 

Imagine using `ramda` in all of your applications but installing it only once at the root. By hoisting, Lernajs does exactly that and symlinks it to the application `node_modules` folder. Furthermore, it has some nice little utilities that you can use to manage your workflow like adding new packages to applications, running multiple applications in parallel, etc.

Specifically what I wanted to share between the deployments: redux actions, redux reducers and epics, typescript models and some utility code, I crammed all this code into a `shared` package which is being used by our `frontend` and `mobile` packages, declared as a dependency. 

So what remains is mostly UI, routing and platform specific code. Below is how our folder structure looks like.

![Codehsaring1]({{site.url}}/assets/Codesharing2.png "Codehsaring1")
_Our refactored code, shared contains common code_

These are then imported in the `frontend` and `mobile` packages where we create our store (combing all the reducers from `shared`) and root epic (combining all the epics from `shared`). The reason for creating the store inside the `frontend` and `mobile` packages rather than in `shared` is simple; we want to have flexibility so that we can add other platforms specific modules or enhance reducers on a per application basis.

![Codehsaring3]({{site.url}}/assets/Codesharing3.png "Codehsaring3")
_Assuming you have a `UserModel` class in `shared` you would simple import it like so_

For the redux actions, they are used as you would normally dispatch any action (the only difference being that your actions are now imported from the `shared` package). You can of course, add more actions inside the `frontend`/`mobile` packages and supply your own `epic` to handle them and it’ll all work seamlessly™.
You can read more about lerna on their website, but here are a couple of steps that we followed and should get you halfway there:

1. Install lerna

   `npm install -g lerna`

2. Extract your code and place it at the root of your mono repository, you should also add a ‘prepare’ npm script, in our case we do typescript compilation to output to a lib folder

3. Run lerna init in your root folder

   `lerna init`

4. Modify your lerna.json to hoist your different packages (bonus tip, you can also leverage lerna with yarn), here is our lerna.json file:

   ![Codesharing4]({{site.url}}/assets/Codesharing4.png "Codesharing4")

5. Link your shared folder

   `lerna add wa-core — scope=frontend`

   `lerna add wa-core — scope=mobile`

6. Run `lerna bootstrap`

   There might be some cases where you don’t want some packages to be hoisted e.g. react-native. You can use a nice feature of yarn workspaces called `nohoist`, which would make lerna not hoist them to the root.

<br>

### Using Typescript 3.+

The latest release of typescript has what they call `project references`, this essentially is the same thing that we want, you can read more about it in their announcement post but here are a couple of steps to get you started.

After refactoring and extracting the shared code, your shared folder should contain a tsconfig.json folder, now in the package were you want to import this code, you should modify your tsconfig.json to contain the following:

```
{
…
"composite": true,
"declaration": true,
"references": [
{ "path": "../shared" }
],
}
```

Once that is done, you can import your code by doing:

`import { Foo } from ‘../shared/Foo’;`

To compile your project you now have to pass the — build flag (or -b) and that should be it, typescript should hoist and transpile the referenced code for you.