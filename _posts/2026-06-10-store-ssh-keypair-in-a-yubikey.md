---
layout: post
title: Store SSH Keypair in a Yubikey
date: 2026-06-10
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

In the world of cyber-security you can never be too paranoid.

SSH Keypairs are the standard way to authenticate yourself to important systems: remote machines, github, signing commits. Yet storing your keypair on disk introduces the attack vector of your machine being compromised. To prevent that attack vector, you **must** be using a passphrase to unlock your keypair (if you are not using a passphrase you deserve a wrist slap). This introduces friction, as it is annoying to put your passphrase everytime you want to unlock your keypair. Therefore mechanisms like `ssh-agent` exist, such agent, allows you to transparently use your ssh-key by keeping your passphrase in the OS vault and unlocking it transparently. Yet this is still another attack vector.

# Upen your SSH game with a Yubikey

You can mitigate this frictions and attack vectors by storing your SSH private key in a YubiKey:

- The private part of your SSH key no longer lives in your disk and is no longer always in-memory (via `ssh-agent`), it now lives in the FIDO module of the Yubikey. It can no longer be exfiltrated. Period.
- You no longer need a passphrase (if you are using a ssh key without a passphrase you deserve a slap in the wrist) because the key requires physical interaction with the yubikey
- It's a bit annoying because now on every ssh operation (fetch, push, commit sign) you need to touch your yubikey but... 
- You can commit the both the "private" file (it's no longer the actual private key, it's only pointing to the yubikey) and public file (.pub) keypair into your dotfiles and just pull on new machines as you need. You can just plugin your key into a new machine as you need.

# Setting things up (on MacOS)

## Install latest openssh

First you need to install the latest version of openssh:

```sh
brew install openssh
```

This is because the Apple modified version does not support creating ssh keys in the yubikey hardware.

Installing `openssh` means some of the Apple-only commands no longer will work (such as `UseKeychain`). Therefore if you had already a `~/.ssh/config` you will need to update it. In my case I just added:

```
# Existing ssh config
IgnoreUnknown UseKeychain
```

## Generate a new yubikey-resident keypair

Generate a new keypair:

```sh
ssh-keygen -t ed25519-sk -O resident -O application=ssh:[ENTER YOUR ALIAS HERE] -C "MyKey" -f ~/.ssh/my-ssh-sk
```

- `-t ed255190-sk`: the `-sk` means "secure key" and is the required type for hardware backed keypairs
- `-O resident`: tells openssh to store the key in the yubikey
- `-O application=ssh:[ALIAS]`: is just a label for you to identify different keypairs if needed
- `-C "MyKey"`: Another alias that will go inside the generated files
- `-f ...`: name of the output files

If you are really paranoid you can also add pin authentication, which means besides having to touch your yubikey you will have to input your pin everytime you require your SSH keypair:

```sh
ssh-keygen -t ed25519-sk -O verify-required -O resident -O application=ssh:[ENTER YOUR ALIAS HERE] -C "MyKey" -f ~/.ssh/opacity-sk
```

Afterwards you can verify your keypair has been correctly stored, either via the Yubico Authenticator app or via command line via the `ykman` CLI tool:

```
$ ykman fido credentials list

Enter your PIN:
Credential ID  RP ID               Username               Display name
55825ba3...    ssh:my-alias        openssh                openssh
```

## Configure your git

After your key is properly configured you need to configure your `~/.ssh/config` to use the key:

```sh
$cat ~/.ssh/config

IgnoreUnknown UseKeychain

Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/my-ssh-sk
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 30%
```

Add your pub SSH key (`~/.ssh/my-ssh-key.pub`) in GitHub web UI and now you should be prompted for your Yubikey everytime you pull & push to GitHub. You should however go one step further and use the same SSH key to sign your commits.

First set your signing configuration, remove the `--global` if you want it to only apply to the current repository you are configuring.

```sh
git config --global gpg.format ssh
git config --global user.signingkey /Users/osp/.ssh/my-ssh-key
git config --global commit.gpgsign true
```

Then on the GitHub web UI, go to SSH keys and create a new signing SSH key and paste the same public key (`~/.ssh/my-ssh-key.pub`)