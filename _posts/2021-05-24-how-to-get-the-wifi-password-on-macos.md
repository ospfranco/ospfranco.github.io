---
layout: post
title: How to get the WiFi password on macOS (for devs)
date: 2021-05-24 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
twitter:
  username: "ospfranco"
  image: "/assets/profile.jpeg"
---

Learn how to get a decrypted WiFi password on macOS (for devs).

If you are a non-dev I cannot really help you, if you can follow the instructions below then you are in luck.

A lot of the online articles say that if you need to get your WiFi network password you need to go into the Keychain app, but that trick stopped working long ago, WiFi passwords on macOS are now encrypted and going into the Keychain does nothing for you.

Unfortunately there is visual app (that I know of) that can extract the password for you, but you can run a simple script that will prompt you for your password and then output the current network WiFi password.

## WiFi password script

So, the first that you can do to get a WiFi password is use the following script by Guillermo Rauch:

```bash
#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Show WiFi Password
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 📶
# @raycast.packageName Show WiFi Password

# Documentation:
# @raycast.author Oscar
# @raycast.authorURL https://github.com/ospfranco

# The script is originally from Guillermo Rauch, all credit goes to him, all I did was add the Raycast headers
# https://github.com/rauchg/wifi-password

version="0.1.0"

# locate airport(1)
airport="/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport"
if [ ! -f $airport ]; then
  echo "ERROR: Can't find \`airport\` CLI program at \"$airport\"."
  exit 1
fi

# by default we are verbose (unless non-tty)
if [ -t 1 ]; then
  verbose=1
else
  verbose=
fi

# usage info
usage() {
  cat <<EOF
  Usage: wifi-password [options] [ssid]
  Options:
    -q, --quiet      Only output the password.
    -V, --version    Output version
    -h, --help       This message.
    --               End of options
EOF
}

# parse options
while [[ "$1" =~ ^- && ! "$1" == "--" ]]; do
  case $1 in
    -V | --version )
      echo $version
      exit
      ;;
    -q | --quiet )
      verbose=
      ;;
    -h | --help )
      usage
      exit
      ;;
  esac
  shift
done
if [[ "$1" == "--" ]]; then shift; fi

# merge args for SSIDs with spaces
args="$@"

# check for user-provided ssid 
if [ "" != "$args" ]; then
  ssid="$@"
else
  # get current ssid
  ssid="`$airport -I | awk '/ SSID/ {print substr($0, index($0, $2))}'`"
  if [ "$ssid" = "" ]; then
    echo "ERROR: Could not retrieve current SSID. Are you connected?" >&2
    exit 1
  fi
fi

# warn user about keychain dialog
if [ $verbose ]; then
  echo ""
  echo "\033[90m … getting password for \"$ssid\". \033[39m"
  echo "\033[90m … keychain prompt incoming. \033[39m"
fi

sleep 2

# source: http://blog.macromates.com/2006/keychain-access-from-shell/
pwd="`security find-generic-password -D 'AirPort network password' -ga \"$ssid\" 2>&1 >/dev/null`"

if [[ $pwd =~ "could" ]]; then
  echo "ERROR: Could not find SSID \"$ssid\"" >&2
  exit 1
fi

# clean up password
pwd=$(echo "$pwd" | sed -e "s/^.*\"\(.*\)\".*$/\1/")

if [ "" == "$pwd" ]; then
  echo "ERROR: Could not get password. Did you enter your Keychain credentials?" >&2
  exit 1
fi

# print
if [ $verbose ]; then
  echo "\033[96m ✓ \"$pwd\" \033[39m"
  echo ""
else
  echo $pwd
fi
```

You can put this somewhere in your terminal configuration and call it everytime you need to share the password with a third party.

## Using it with the Raycast app

But actually, there is a better way, you should download [Raycast](https://raycast.com), it's an awesome app and allows you to directly call scripts. Once you have Raycast installed, you can directly call this script from it (put it in your `documents` folder), it will immediately output the WiFi password ready for you to paste.

Here is an example of the script in action:

![Raycast demo]({{site.url}}/assets/raycast_password.gif "Raycast demo")