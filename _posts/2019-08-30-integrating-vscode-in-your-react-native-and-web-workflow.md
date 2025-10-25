---
layout: post
title: Better debugging experience with VSCode and React Native
excerpt: Supercharge your web and react-native development workflow by using a few plugins
date: 2019-08-30 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
location: Munich
---

# Integrating vscode and react-native for faster development

There are some steps I took for integrating react-native development with visual studio code, the main benefit is having a faster development cycle, integrated debugging and above all fast feedback cycles.

## Debugging your react-native app inside vscode

This one is pretty straight foward, download the react-native-tools plugin for vscode, install them, the trick however lies in the proper configuration of your application.

In my case I have configured different schemas/flavors of our app, as well as some environment dependant configuration for deploying them, this means the default configuration doesn't work.

Once you have the extension installed (and created the launch configurations), you can add the following commands to launch a different simulator and configurations:

```json
{
  "name": "[iOS] Debug",
  "cwd": "${workspaceFolder}",
  "type": "reactnative",
  "request": "launch",
  "platform": "ios",
  "scheme": "Debug",
  "runArguments": ["--simulator", "iPhone 6s", "--scheme", "Debug"],
  "preLaunchTask": "npm: prebuild"
}
```

- **Scheme:** Allows you to define a particular scheme, if you are using flavored apps, this will allow you to select the corresponding will flavor (by default this matches the project name)

- **Simulator:** I always specify the iPhone 6 or 6s simulator, emulating the latest models actually can be slow and memory consuming, not to mention animations might play slower than on the actual device, in any case, makes sure my machine fans don't spin like crazy.

- **preLaunchTask:** As stated, there is some environment dependant configuration that is needed for our app to run, this task is part of our package.json, it simply sets some variables and cleans the cache for the packager

After everything is said an done, you should be able to set breakpoints in your code and directly debug your react-native app.

---

## Debugging your jest tests in vscode

The next one is making the test workflow a lot faster, since most of the time your tests will be running in a headless environment, getting the value of the variables and/or the render tree can be frustrating and difficult, being able to attach a debugger to your tests makes life a lot easier, this one has to do with launch configurations as well, you can create the following configuration in your launch.json:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Test [INVARIANT]",
  "program": "${workspaceRoot}/node_modules/.bin/jest",
  "args": ["-i"],
  "internalConsoleOptions": "openOnSessionStart",
  "outFiles": ["${workspaceRoot}/dist/**/*"],
  "envFile": "${workspaceRoot}/.env"
}
```

There is nothing special about this configuration, but you can easily run your tests directly from vscode without having to switch back and forward from your console, and as mentioned being able to have debugger breakpoints.

---

## Reviewing and opening PRs directly within vscode

The next one is also based on an extension, the [github pull requests extension](https://code.visualstudio.com/blogs/2018/09/10/introducing-github-pullrequests), it is not perfect as it is still in somewhat of a beta phase, be the good thing is that you have all the editor tools at your disposal when reviewing code.

![GithubPullRequests]({{site.url}}/assets/gh-pr.png "GithubPullRequests")

There are a few bugs here and there, but the review experience is definitely better than using githubs web editor, can only recommend it.

---

## Setting up husky and a pre-commit hook that makes your life faster

The next one has saved me a lot of time going back and forward with the CI, commit hooks are nothing new, but setting them up can be unglamorous, husky is the tool for the job (I recently heard about lefthook, I'll give that one a try later),after you add husky to your dependencies, you only need to specify a husky property in your package.json, afterwards everytime you do a yarn install new hooks are generated for you, I have the following configuration:

```json
  "husky": {
    "hooks": {
      "pre-commit": "pretty-quick --staged && yarn flow && yarn tsc && yarn test:invariant"
    }
  }
```

It basically saves me having to wait minutes for CI to boot up and inform me of my trivial mistakes, my machine is definitely a lot faster the environment provided by circleCI, I can run the tests in **10 seconds** while the CI environment takes at least 2 minutes to run the same sequence of commands.

---

## Volta

I've always been using nvm, but recently discovered [volta](https://volta.sh) (formerly notion), the basic idea is the same, managing different versions of node/yarn/etc, I had some minor configuration problems with global packages not being recognized on bash scripts, but seems like a suitable replacement for nvm, would recommend you to try it for and your team

I'm always looking forward to learn new things, if you have any tips to make this workflow faster don't doubt to send me an email at ospfranco@protonmail.com

---

## Extra: making typescript absolute paths work with babel

There is one more configuration that has been quite a time saver in my daily workflow, and that is enabling absolute paths to work with react-native and jest.

On your babel.config.js (might not work with the older babel.rc config), on the module resolver, I changed it to the following configuration:

```json
[
  "module-resolver",
  {
    "root": ["./src"],
    "alias": {
      "*": ["./src/"]
    },
    "extensions": [".js", ".ts", ".tsx", ".ios.js", ".android.js"]
  }
]
```

(adding an alias for the root config)

On your tsconfig, you also need to specify some properties:

```json
"baseUrl": "src/",
"rootDir": "src"
```

Afterwards you should be able to get all your modules absolute importable and even works with jest.
