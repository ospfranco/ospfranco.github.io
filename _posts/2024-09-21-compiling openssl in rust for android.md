---
layout: post
title: Compiling OpenSSL in Rust for Android
date: 2024-09-21
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

There is now a long standing issue with the latest versions of OpenSSL. [The handwritten assembly is incompatible with Position Independent Code](https://github.com/openssl/openssl/pull/22181). While this issue is not resolved it means the latest versions of OpenSSL do not run on Android.

As a side note, the NDK port of [OpenSSL is still on version 1.1.1 which is EOL](https://github.com/android/ndk/issues/1992). This is a huge vunerability for Android but it seems the NDK team has no priority on updating this.

In a client project I'm using Rust which depends on OpenSSL. This has left me no choice other than to patch OpenSSL myself, so I get it to compile to Android platforms.

# Compiling OpenSSL

Here is a script that will download and compile OpenSSL for Android directly. It already includes the patching described in the GitHub issue to patch the handcrafted assembly.

```bash
#!/bin/bash

# Clone or download the sources (it's done for you at below)
# You should most definitely read the ANDROID notes to see the exact command. A lot of the scripts online are outdated for the 1.X branches
# You basically need to set the ANDROID_NDK_HOME variable for this script to work
# Generating the dylibs was failing for me, so disabled it for now

#set -v
set -ex

export OPENSSL_VERSION="openssl-3.3.2"
rm -rf ${OPENSSL_VERSION}
# Sometimes this link breaks, you can manually download the sources yourself
# curl -O "https://github.com/openssl/openssl/releases/download/${OPENSSL_VERSION}/${OPENSSL_VERSION}.tar.gz"
tar xfz "${OPENSSL_VERSION}.tar.gz"

PROJECT_HOME=`pwd`
PATH_ORG=$PATH
OUTPUT_DIR="libs"

# Clean output:
rm -rf $OUTPUT_DIR
mkdir $OUTPUT_DIR

build_android_clang() {

	echo ""
	echo "----- Build libcrypto & libssl.so for "$1" -----"
	echo ""

	ARCHITECTURE=$1
	TOOLCHAIN=$2
	stl="libc++"

	# Set toolchain
	export TOOLCHAIN_ROOT=$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/darwin-x86_64
	export SYSROOT=$TOOLCHAIN_ROOT/sysroot
	export CC=${TOOLCHAIN}21-clang
	export CXX=${TOOLCHAIN}21-clang++
	export CXXFLAGS="-fPIC"
	export CPPFLAGS="-DANDROID -fPIC"

	export PATH=$TOOLCHAIN_ROOT/bin:$SYSROOT/usr/local/bin:$PATH

	cd "${OPENSSL_VERSION}"

	./Configure $ARCHITECTURE no-asm no-shared -D__ANDROID_API__=21

	make clean
	# Apply patch that fixes the armcap instruction
	# Linux version
	# sed -e '/[.]hidden.*OPENSSL_armcap_P/d; /[.]extern.*OPENSSL_armcap_P/ {p; s/extern/hidden/ }' -i -- crypto/*arm*pl crypto/*/asm/*arm*pl
	# macOS version
	sed -E -i '' -e '/[.]hidden.*OPENSSL_armcap_P/d' -e '/[.]extern.*OPENSSL_armcap_P/ {p; s/extern/hidden/; }' crypto/*arm*pl crypto/*/asm/*arm*pl

	make

	mkdir -p ../$OUTPUT_DIR/${ARCHITECTURE}/lib
	mkdir -p ../$OUTPUT_DIR/${ARCHITECTURE}/include

	cp libcrypto.a ../$OUTPUT_DIR/${ARCHITECTURE}/lib/libcrypto.a
	cp libssl.a ../$OUTPUT_DIR/${ARCHITECTURE}/lib/libssl.a

	cp -R include/openssl ../$OUTPUT_DIR/${ARCHITECTURE}/include

	cd ..
}

build_android_clang "android-arm" "armv7a-linux-androideabi"
build_android_clang "android-x86" "i686-linux-android"
build_android_clang "android-x86_64" "x86_64-linux-android"
build_android_clang "android-arm64" "aarch64-linux-android"
```

This script will create a `libs` folder, which contains all the files in the necessary structure.

# Compiling Rust crate

In order to compile this in your Rust crate you need to first add the crates:

```toml
openssl = "0.10"
openssl-sys = "0.9.103"
```

`openssl` is a bindings crate for the Rust code, but the openssl-sys takes care of compiling/detecting OpenSSL itself.

With this crates added, we can then invoke the compilation command with an added flag `OPENSSL_DIR` which `openssl-sys` will detect and instead of compiling OpenSSL from source will use the precompiled static libraries we generated.

Here I'm using `cargo-ndk` which is a crate that does the SDK/NDK discovery for you so you can easily compile for android. This is a `Makefile` version, but you can use whatever you want to point to it to the correct folder that matches the architecture:

```make
android-build-release-%:
	@ if [ "$*" = "aarch64-linux-android" ]; then \
			OPENSSL_DIR=$(CURDIR)/libs/android-arm64; \
	  elif [ "$*" = "x86_64-linux-android" ]; then \
	    OPENSSL_DIR=$(CURDIR)/libs/android-x86_64; \
	  elif [ "$*" = "armv7-linux-androideabi" ]; then \
	    OPENSSL_DIR=$(CURDIR)/libs/android-arm; \
	  elif [ "$*" = "i686-linux-android" ]; then \
	    OPENSSL_DIR=$(CURDIR)/libs/android-x86; \
	  else \
	    echo "Unknown target: $*"; \
	    exit 1; \
	  fi; \
	  OPENSSL_DIR=$$OPENSSL_DIR cargo ndk --target $* --platform 31 build --release --all-features
```

Once everything is ready, will not only the Android binary be correct, you will actually be using the latest version of OpenSSL instead of the outdated NDK ports.
