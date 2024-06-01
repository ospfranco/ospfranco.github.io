---
layout: post
title: React Native Security Guide
date: 2024-05-30
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

Like any other software development framework, security should be a top priority when developing React Native applications. However, there are a lot of misconceptions, fueled by the existence of packages and the lack of targeted information.

In this guide, we will explore various security considerations and best practices that every React Native developer should be aware of. If you find anything incorrect or have feedback, please reach out! This is a topic we should all care about.

# Preface

Let's address this upfront: there is no real way to protect data once it is on the device. A motivated attacker with root or hardware access to the device will eventually be able to bypass security features when storing on-device data. Here is a [1Password write-up](https://blog.1password.com/local-threats-device-protections/) that explains this well.

As we are not all building vault apps, this should be our guiding principle: **do not put anything on the user's device that you cannot afford to leak**.

But that doesn't mean all is lost. If the attacker does not have direct access to the machine, applying protections will still be a sufficient deterrent (and secure enough unless they actually get hold of the hardware). Using the best-known security practices can make some attacks so cumbersome that they act as a deterrent, so we should still use them.

# Secrets

Armed with this knowledge, there is one inconvenient truth: **you won't be able to protect secrets like API keys for third-party services**. No matter how you store or obfuscate them, or what packages promise. You also won't be able to protect your encryption keys, which means **you won't be able to protect the encrypted user data** (again, if the hardware is compromised). The difference lies in the fact that user data belongs to the user; they can hack their own app/device and see their data, but they had access to this data anyway. The problematic part is the secrets, as they are shared among your users.

Is there a way to protect secrets? Using a gateway would be one way, but sometimes it is not possible, for example, when using a third-party SDK that ingests the key directly. There is nothing we can do about that.

An important thing to note here is the existence of device attestation. Device attestation is a process where the OS tries to verify that the device and/or app has not been tampered with. There are [APIs for iOS](https://support.apple.com/guide/deployment/managed-device-attestation-dep28afbde6a/web) and [Android](https://developer.android.com/privacy-and-security/safetynet/attestation). Some companies offer this as a service with an SDK, allowing you to verify the device/app before sending data to it. However, this is a not very well-explored topic and may be time-consuming or expensive.

With device attestation, you could have a more secure (read: more inconvenient to hack) secret management:

1. On app start, perform device attestation. If it fails: game over, you tampered with the device/app, so no access.
2. On first start, download the secrets and store them in your favorite cryptographically secure storage.
3. Combine this with partial keys that need to be fetched from a server each time to decode the secrets/data.

Again, once a hacker has access to the device, it's game over. They can even mess with the OS internals to defeat device attestation, but at least you can make their lives harder.

A final point to mention is packages like `react-native-dotenv` and `react-native-config`. I don't like them because they can be misleading (and have caused me trouble compiling them in the past). These "environment variables" packages still package your environment variables inside the app bundle and then read them at runtime. While they have not intentionally deceived people into thinking they are secure, the naming and the mixing of real environment variables with what they do have at least led unaware developers to think their secrets are secure (speaking from personal experience).

The reason why environment variables in things like Docker containers and server environments are secure is that they reside in memory, are not persisted, and are isolated by running on the server where (hopefully) the only point of entry is a secure HTTP API. This is not the case for mobile apps (regardless of the language/framework you are using).

# User Data

Given this knowledge, why should we bother encrypting user data? Well, again, if we consider the worst-case scenario, the world is bleak. But if we assume we are running on an untampered device/OS, the fact that we protect data from other apps and script-kiddies is still worthwhile. Most packages have some way of encrypting your data via an encryption key.

Which algorithm they use and if they are actually securing the data is a per-package question. Many of them (at least in the React Native world) have hand-rolled their encryption, use dubious implementations, or are outdated. It's too much to cover in this article, so I will just give you an ideal workflow that should be secure (barring implementation errors in the libraries themselves):

## Generate and Securely Store Your Encryption Key

Most packages tell you to do this:

```ts
const myKey = "password_is_password";

const storage = MyStateLibrary.create({
  encryptionKey: myKey,
});
```

The problem with this approach is that anyone can decompile your app and read the value of `myKey` (no matter how you obfuscate it). This is even worse in React Native, where you can just decompress an APK/IPA and take a look at the minified JS/TS code. I have mentioned in previous articles how looking into the JS bundle can leak valuable business logic and allow competitors to copy functionality.

Here is a better approach to generate and store your encryption key. I'll use my package `op-s2` for this, but you can use the [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/) equivalent. Both work by storing data in the Keychain on iOS and by generating keys with the KeyStore API on Android, which are backed by hardware (when possible on Android) and are secure (as secure as it gets with untampered devices).

```ts
import { get, set } from "@op-engineering/op-s2";

// Generate truly secure random bytes using the T2 chip on iOS/macOS and Linux calls on Android
const myKey = generateRandomKey();

const { error } = set({
  key: "myKey",
  value: myKey,
  withBiometrics: true, // This means a FaceID/biometrics prompt will appear every time. See the docs if you don't want to use this
});
```

`withBiometrics` is the safest but most cumbersome option, as it requires user authentication every time you want to read this key. You can leave it out, and it will still be secure. How are these packages secure? Because KeyStore/Keychain actually allow access on a per-app bundle basis (with signature verification, I believe). You only have access to the data you have created; you cannot read values from other apps/processes. So, at least we have per-app security.

Then, when you start your storage, you can pass this key:

```ts
const myKey = get({ key: "myKey", withBiometrics: true });

const storage = MyStateLibrary.create({
  encryptionKey: myKey,
});

const myKey = null;
// You can even trigger garbage collection to make a timed attack even harder
```

Again, nothing is truly secure, but at least we have an extra layer of protection. Clearing the memory is also a best practice to prevent leaks. We then rely on the library to have correctly implemented an encryption algorithm.

> As a funny side note:
> Apple's Keychain is just an API wrapper against a SQLite database that has some OS protections bolted in.
> Keystore is just an API for retrieving/generating/saving secure crypto keys. The actual API that saves data is EncryptedSharedPreferences, which just saves files to disk with encryption bolted on.
>
> :)

## Use Secure Storage

Once you have your encryption keys securely stored, it's time to move on to storing the data itself securely. Here, some libraries are already prepared for that. MMKV allows you to specify an encryption key:

```ts
import { MMKV, Mode } from "react-native-mmkv";

const myKey = get({ key: "myKey", withBiometrics: true });

export const storage = new MMKV({
  id: `user-${userId}-storage`,
  path: `${USER_DIRECTORY}/storage`,
  encryptionKey: myKey,
  mode: Mode.MULTI_PROCESS,
});
```

Another alternative (and my favorite) is using an encrypted fork of SQLite called SQLCipher, which you can use via [op-sqlite](https://github.com/OP-Engineering/op-sqlite). You just need to enable SQLCipher support in the `package.json`:

```json
"op-sqlite": {
  "sqlcipher": true
}
```

Then, when you open your database:

```ts
const { open } from '@op-engineering/op-sqlite';

const myKey = get({ key: "myKey", withBiometrics: true });

const db = open({
  name: 'my_secure_db.sqlite',
  encryptionKey: myKey
});
```

This will fully encrypt the data stored on disk with a bit of overhead. As long as your encryption key is not compromised, it should be

safe.

# Hardware Keys

I have to mention hardware keys, which circumvent the issue of the attacker having remote access to the device. Since they are separate from the OS, they cannot be easily compromised (apart from being physically stolen) and provide an extra layer of security.

If your app requires an even higher level of security, it might be worth looking into them. I have bridged the Yubico SDK for RN, but it's not currently open source. [Although you cannot save data to a YubiKey](https://developers.yubico.com/Developer_Program/Guides/User_Loaded_Data.html), authentication would be enough to use secure bytes as an encryption key. As I've shown in this article, as long as the encryption key is safe, you can consider your data safe enough. If someone is willing to sponsor the work, I would be willing to create a Turbo module to make this functionality available to React Native apps.

# Conclusion

It's still worth looking into the [official RN documentation](https://reactnative.dev/docs/security#storing-sensitive-info); however, I hope this guide is a bit more hands-on.
