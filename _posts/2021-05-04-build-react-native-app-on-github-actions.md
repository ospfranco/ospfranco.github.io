---
layout: post
title: How to build react-native app on github actions (and fastlane)
date: 2021-05-04 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

At work we were using Bitrise to build our React Native app. I have never been a fan of Bitrise, it's slow and pricy compared other CI providers.

That being said; it works well and their huge gallery steps probably cover 95% of the stuff you need from a mobile CI, however, we recently started hitting our heads against the ceiling. After migrating to the latest version of React Native, removing the checked pods and enabling Hermes, our iOS build simply did not fit inside a single workflow. The next pricing tier was too vaguely priced for us to comfortably accept it.

## Migrating to Github Actions

I (previously) removed our pure JavaScript tests from Bitrise and into **Github Actions**. The process was simple, and since it runs where the code already lives, it is pretty sweet to have everything under the Github umbrella. I found out Github has macOS machines you can use to build your app, so I begged the team to see if we could try to migrate. We were already using Fastlane before, so there was a `Fastfile` that I could re-use after updating it, I just needed to set up the machines and the environments.

Here is our workflow file for our android build:

```yaml
name: Android GMS Staging

on:
  create:
    tags:
      - v*
  workflow_dispatch:
    inputs:
      message:
        description: 'Build description'

jobs:
  build:
    runs-on: ubuntu-latest
    container:
      image: docker://fabernovel/android:api-29-v1.1.0

    steps:
      - name: Checkout
        uses : actions/checkout@v2

      - name: Node modules cache
        uses: actions/cache@v2
        with:
          path: '**/node_modules'
          key: [Put a hash key here based on yarn.lock]

      - name: Ruby cache
        uses: actions/cache@v1.2.0
        with:
          path: vendor/bundle
          key: [Put a hash key here based on gemfile.lock]

      - name: Gradle cache
        uses: actions/cache@v1.2.0
        with:
          path: /root/.gradle
          key: [Put a hash key here based on *.gradle]

      - name: Use Node 14
        uses: actions/setup-node@v2
        with:
          node-version: '14'

      - name: Install yarn
        run: npm install -g yarn

      - name: Install firebase CLI
        run: npm install -g firebase-tools

      - name: Install dependencies
        run: yarn

      - name: Decode keystore file
        run: echo -n "$ANDROID_KEYSTORE_FILE" | base64 -d > ./my-release-key.keystore
        working-directory: ./android/app
        env:
          ANDROID_KEYSTORE_FILE: $

      - name: Bundle install
        run: |
          bundle config path vendor/bundle
          bundle check || bundle install

      - name: Fastlane
        run: bundle exec fastlane android distribute_staging
        env:
          MYAPP_RELEASE_STORE_PASSWORD: $
          MYAPP_RELEASE_KEY_ALIAS: $
          MYAPP_RELEASE_KEY_PASSWORD: $
          FIREBASE_TOKEN: $
```

> You might see some floating `$` there goes a github secret, you can figure those out for your own config

Nothing too fancy, basically using a pre-built image which already has the android SDK installed, then installing node dependencies, ruby dependencies, etc. The keystore file is in our github secrets as a base64 string. Finally it is just a matter of calling Fastlane, which takes care of all the final build steps, I did not want to put any more logic inside of the workflow, because we should also be able to run fastlane in our machines in case the CI is not an option or we need to do an emergency release for some reason.

For iOS, is somewhat similar:

```yaml
name: iOS Staging
on:
  create:
    tags:
      - v*
  workflow_dispatch:
    inputs:
      message:
        description: 'Build description'

jobs:
  build:
    runs-on: macOS-latest
    # timeout-minutes: 30

    steps:
    
      - name: Checkout
        uses: actions/checkout@v2

      - name: Node modules cache
        uses: actions/cache@v2
        with:
          path: '**/node_modules'
          key: [Put a hash key here based on yarn.lock]

      - name: Ruby cache
        uses: actions/cache@v2
        with:
          path: vendor/bundle
          key: [Put a hash key here based on gemfile.lock]

      - name: Use Node 14
        uses: actions/setup-node@v2
        with:
          node-version: '14'

      - name: Install yarn
        run: npm install -g yarn

      - name: Install firebase CLI
        run: npm install -g firebase-tools

      - name: Install dependencies
        run: yarn

      - name: Decode cert file
        run: echo -n "$P12_CODE_SIGNING_CERT_BASE64" | base64 -d > ./cert.p12
        env:
          P12_CODE_SIGNING_CERT_BASE64: $

      - name: Decode adhoc prov file
        run: echo -n "$MOBILEPROVISION_ADHOC_BASE64" | base64 -d > ./mobileProvisionAdhoc.mobileprovision
        env:
          MOBILEPROVISION_ADHOC_BASE64: $
      
      - name: Decode appstore prov file
        run: echo -n "$MOBILEPROVISION_APPSTORE_BASE64" | base64 -d > ./mobileProvisionAppstore.mobileprovision
        env:
          MOBILEPROVISION_APPSTORE_BASE64: $
      
      - name: Decode widget adhoc prov file
        run: echo -n "$MOBILEPROVISION_WIDGET_ADHOC_BASE64" | base64 -d > ./mobileProvisionWidgetAdhoc.mobileprovision
        env:
          MOBILEPROVISION_WIDGET_ADHOC_BASE64: $
      
      - name: Decode widget appstore prov file
        run: echo -n "$MOBILEPROVISION_WIDGET_APPSTORE_BASE64" | base64 -d > ./mobileProvisionWidgetAppstore.mobileprovision
        env:
          MOBILEPROVISION_WIDGET_APPSTORE_BASE64: $

      - name: Bundle install
        run: |
          bundle config path vendor/bundle
          bundle check || bundle install

      - name: Fastlane
        run: bundle exec fastlane ios distribute_staging
        env:
          FIREBASE_TOKEN: $
```

The main difference is the unpacking and decoding of provisioning profiles and certificate. If you have used fastlane you will see there is some recommendation to use `match`, don't, it's useless, it's a waste of time to set up and only to automate a task that you will probably do once a year (re-generate the certificate once it expires).

Another nice thing is the `workflow_dispatch` trigger, it allows you to trigger a workflow from the github UI (and you can put params, but as you can see I'm not using the description parameter yet).

## Results

The results are good and also not so good

|Target|Bitrise|Github|Reduction|
|---|---|---|---|
|iOS|~60 mins|~30 mins|50%
|Android|~35 mins|~20mins|42%
|Huawei|~35 mins|~20mins|42%

The speed increase is amazing, not dealing with Bitrise's slow UI is amazing, the ease of pushing the config directly into github (or directly using bash) is amazing. What is not amazing is pricing. I had a small misconfiguration and I blew through our monthly CI budged in 3 days, while the Linux machines are fine, the macOS machines are quite expensive.

## Lessons learned

- As stated, skip fastlane's `match`, it's a waste of your time and your organization time (unless you regenerate certs/profiles every week or so)
- Fastlane scripts/plugins have some hidden behavior, do not try to create a new platform, stick to `ios` and `android`, we created a `huawei` platform and wasted a day trying to figure out why the apk was not detected for upload to firebase.
- Fastlane works on the `.fastlane` directory, github actions on the project root... this can be a pain to debug if you have to point to files directly.
- If you are going to run macOS machines on every commit/pr, then github actions is probably not the best tool, it's way too expensive

## Conclusions

The process was slow (setting up CI is so painfully slow; trigger a build, wait 20 mins, realize var name is wrong 🤮), but it wasn't painful, being able to use pure bash (via fastlane or github steps) is heaven, even though Bitrise looks powerful with all the plugins, it's really freaking black-boxy with cryptic errors.

The speed has me super happy and everything is now integrated with github (our code, our issues and now our CI) which makes my life easier. I'm sure there are a few hairs here and there that need to be trimmed, but so far no complains. Github Actions are not perfect (fucking yaml... why do we keep using yaml?!) but hopefully you will find this guide useful if you are tired of abandonware (appcenter), slow CIs (bitrise), plain confusing (CircleCI).

Having the Github building your app is amazing, but sometimes you might want to take it a step further and receive notifications once your app is built, if so, you should definitely check [CI Demon](https://ospfranco.github.io/cidemon/), it's an app that I made that helps you keep track of your CI.