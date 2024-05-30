---
layout: post
title: React Native Security Guide
date: 2024-05-30
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

Like any other software development framework, security should be a top priority when developing React Native applications. However, there are a lot of missconceptions floating around, fueled by the existance of packages and lack of targeted information.

In this guide, we will explore various security considerations and best practices that every React Native developer should be aware of to the best of my knowledge. If you find anything wrong or have feedback please reach out! This is a topic we should all care about.

# Preface

Let's get this out of the way: there is no real way to protect the data once it is on device. A motivated attacker with root or hardware access to the device will be able to eventually impersonate/break the security features when storing on-device data. Here is a [1Password write-up](https://blog.1password.com/local-threats-device-protections/) that describes it quite well.

As we are not all building vault apps, this should be our guiding principle: **do not put anything on the device of the user that you cannot afford to leak**.

But that doesn't mean everything is lost. If the attacker does not have direct access to the machine applying the protections will still be deterrent enough (and secure enough unless they actually get a hold of the hardware). And still, using the best-known security practices make some of the attacks in practically so cumbersome that they act as a deterrent, so we should still use them.

# Secrets

Armed with this knowledge there is one inconvenient truth: **you won't be able to protect secrets like API keys for third party services**. No matter how you store them or how you obfuscate them or what packages promise. You also won't be able to protect your encryption keys, which then means **you won't be able to protect the encrypted USER data** (again, if they get a hold of the hardware). The difference lies that user data belongs to the user, they can hack their own app/device and see their data, but they had access to this data anyways, right? The problematic part are the secrets as they are shared among your users.

Is there a way to protect secrets? Using a gateway would definitely be a way, but sometimes it is not possible, for example if using a third-party SDK that ingest the key directly. Nothing we can do about that.

An important thing to note here is the existance of device attestation which is not very common. There are [APIs for iOS](https://support.apple.com/guide/deployment/managed-device-attestation-dep28afbde6a/web) and [Android](https://developer.android.com/privacy-and-security/safetynet/attestation). There are companies that offer this as a service with and SDK where before you send data to the device you could verify the device/app has not been tampered with.

With device attestation you could have a more secure (read "more inconvenient way to hack") secret management:

1. On app start do device attestation, if it fails: game over you tampered with the device/app, so no candies for you.
2. On first start download the secrets and store them in your favourite cryptographically secure storage.
3. You can combine this with partial keys which are needed to fetch from a server every time to decode the secrets/data.

Again, once a hacker has access to the device it's game over, they can even mess with the OS internals to defeat even device attestation but at least you can make their lives harder.

The final point to mention here are packages like `react-native-dotenv` and `react-native-config`. I don't like them, because they are a bit missleading. This environment variables packages still package your environment variables inside the app bundle and then read them at runtime. While they have not intentionally deceived people into thinking they are secure, the naming and mixing the concept of real environment variables with what they do has at least lead unaware devs into thinking their secrets are secure (talking out of my own experience).

The reason why enviroment variables in things like docker containers and server environments are secure is because they reside in memory and are not persisted and are isolated by running on the server where (hopefully) the only point of entry is a secure HTTP API. Which is not the case for our mobile apps (independent of the language/framework you are using).

Enough about secrets, how about user data?

# User data

Given this knowledge, why should we bother encrypting user data? Well, again, if talking about the worse case scenario then the world is bleak. But if we assume we are still running in an untampered device/OS the fact we protect data from other apps and script-kiddies is still worthy. Here most of the packages have some way of encrypting your data via an encryption key.

Which algorithm they use and if they are actually securing the data is a per-package question. Lot's of them (at least on the react-native world) have hand rolled their encryption, use dubious implementations or are outdated. Too much to cover on this article, so I will just give you an ideal workflow that should be secure (barring implementation errors on the libraries themselves):

## Generate and securely store your encryption key

Most of the packages tell you to do this:

```ts
const myKey = "password_is_password";

const storage = MyStateLibrary.create({
  encryptionKey = myKey,
});
```

The problem with this approach is that anyone can decompile your app and read the value of `myKey` (no matter how you obfuscate it). This is even worse on react-native where you can just decompress an APK/IPA and just take a look at the minified JS/TS code. I mentioned in articles before how taking a look into the JS bundle even leaks valuable bussines logic and allows competitors to copy functionality.

So here is a better approach to generate and store your encryption key, I'm going to use my package `op-s2` for this, but you can use the expo equivalent. They both work by storing data on the keychain on iOS and keystore on android, which are backed by hardware (when possible on android) and are secure (as secure as it gets with untampared devices).

```ts
import { get, set } from "@op-engineering/op-s2";

// Will do another article about generating secure bytes
const myKey = generateRandomKey(); // generate truly secure random bytes, using t2 chip on iOS/macos and linux calls on android

const { error } = set({
  key: "myKey",
  value: myKey,
  withBiometrics: true, // This means a faceID/biometrics prompt will appear every time, see the docs if you don't want to use this
});
```

`withBiometrics` is the safest but most cumbersome option, it means user will have to authenticate everytime you want to read this key. You can leave it out and it will still be secure. How? Because keystore/keychain actually allow access on a per bundle basis. You only have access to the data you have created, you cannot read the values from other apps/processes. So at least we have per app security.

So then when you start your storage you can pass this key:

```ts
const myKey = get({ key: "myKey", withBiometrics: true });

const storage = MyStateLibrary.create({
  encryptionKey = myKey,
});

const myKey = null;
// You can even trigger a gargabe collection to make a timed attack even harder
```

Again, nothing is secure, but at least we have an extra layer of protection. Clearing the memory is also a best practice to prevent things from leaking. We then rely that the library has correctly implemented an encryption algorithm.

## Use a secure storage

TODO. Use `op-sqlite` with the `sqlcipher` flag turned on :)
