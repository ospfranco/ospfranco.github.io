---
layout: post
title: Loading dylibs in iOS
date: 2024-09-15
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

Apple has terrible messed with dynamic library loading in iOS. This was an absolute pain to get right, so I hope I will save someone some time in case you ever need to compile a dylib for iOS.

# Frameworks

In order to load dynamic libraries in iOS they need to be packaged in a `.framework`. Let's skip most of the explanation and just give you a template you can use. These frameworks need to be embbeded in a `.xcframework` that will load the correct version for the architecture (arm, arm-simulator, intel-simulator).

# Compile your library

Here is the `Makefile` you need, it's for sqlitevec an sqlite extension but you can easily figure out how to compile your own project:

```make
MIN_IOS_VERSION = 8.0

# iOS SDK paths
IOS_SDK_PATH = $(shell xcrun --sdk iphoneos --show-sdk-path)
IOS_SIMULATOR_SDK_PATH = $(shell xcrun --sdk iphonesimulator --show-sdk-path)

# iOS cross-compiler toolchains
CC_ios_arm64 = $(shell xcrun --sdk iphoneos --find clang)
CC_ios_x86_64 = $(shell xcrun --sdk iphonesimulator --find clang)

# Output directories for iOS
OUT_DIR_ios_arm64 = dist/ios/arm64
OUT_DIR_ios_x86_64 = dist/ios/x86_64
OUT_DIR_ios_arm64_simulator = dist/ios/arm64_simulator

# iOS-specific flags
IOS_CFLAGS = -Ivendor/ -I./ -O3 -fembed-bitcode -fPIC
IOS_LDFLAGS = -Wl,-ios_version_min,$(MIN_IOS_VERSION)
IOS_ARM64_FLAGS = -target arm64-apple-ios$(MIN_IOS_VERSION) -miphoneos-version-min=$(MIN_IOS_VERSION)
IOS_ARM64_SIM_FLAGS = -target arm64-apple-ios-simulator$(MIN_IOS_VERSION) -mios-simulator-version-min=$(MIN_IOS_VERSION)
IOS_X86_64_FLAGS = -target x86_64-apple-ios-simulator$(MIN_IOS_VERSION) -mios-simulator-version-min=$(MIN_IOS_VERSION)

# Compilation rules for each iOS architecture
$(OUT_DIR_ios_arm64):
	mkdir -p $@

$(OUT_DIR_ios_x86_64):
	mkdir -p $@

$(OUT_DIR_ios_arm64_simulator):
	mkdir -p $@

# Rule for compiling for iOS arm64 (device)
ios_arm64: $(OUT_DIR_ios_arm64)
	$(CC_ios_arm64) $(CFLAGS) $(IOS_CFLAGS) $(IOS_ARM64_FLAGS) -isysroot $(IOS_SDK_PATH) -c sqlite-vec.c -o $(OUT_DIR_ios_arm64)/sqlite-vec.o
	$(CC_ios_arm64) -dynamiclib -o $(OUT_DIR_ios_arm64)/sqlitevec $(OUT_DIR_ios_arm64)/sqlite-vec.o -isysroot $(IOS_SDK_PATH) $(IOS_LDFLAGS)

# Rule for compiling for iOS x86_64 (simulator)
ios_x86_64: $(OUT_DIR_ios_x86_64)
	$(CC_ios_x86_64) $(CFLAGS) $(IOS_CFLAGS) $(IOS_X86_64_FLAGS) -isysroot $(IOS_SIMULATOR_SDK_PATH) -c sqlite-vec.c -o $(OUT_DIR_ios_x86_64)/sqlite-vec.o
	$(CC_ios_x86_64) $(IOS_X86_64_FLAGS) -dynamiclib -o $(OUT_DIR_ios_x86_64)/sqlitevec $(OUT_DIR_ios_x86_64)/sqlite-vec.o -isysroot $(IOS_SIMULATOR_SDK_PATH)

# Rule for compiling for iOS arm64 (simulator)
ios_arm64_sim: $(OUT_DIR_ios_arm64_simulator)
	$(CC_ios_arm64) $(CFLAGS) $(IOS_CFLAGS) $(IOS_ARM64_SIM_FLAGS) -isysroot $(IOS_SIMULATOR_SDK_PATH) -c sqlite-vec.c -o $(OUT_DIR_ios_arm64_simulator)/sqlite-vec.o
	$(CC_ios_arm64) -dynamiclib -o $(OUT_DIR_ios_arm64_simulator)/sqlitevec $(OUT_DIR_ios_arm64_simulator)/sqlite-vec.o -isysroot $(IOS_SIMULATOR_SDK_PATH)

# Rule to compile for all iOS architectures
ios: ios_arm64 ios_x86_64 ios_arm64_sim
  # Create a single fat for simulators
	lipo -create ./dist/ios/x86_64/sqlitevec ./dist/ios/arm64_simulator/sqlitevec -output dist/ios/sim_fat/sqlitevec

  # Move generated binary to the template xcframework folder
	cp ./dist/ios/arm64/sqlitevec ./templates/sqlitevec.xcframework/ios-arm64/sqlitevec.framework/

  # Set @rpath
	install_name_tool -id @rpath/sqlitevec.framework/sqlitevec ./templates/sqlitevec.xcframework/ios-arm64/sqlitevec.framework/sqlitevec

  # Move generated binary to the template xcframework folder
	cp ./dist/ios/sim_fat/sqlitevec ./templates/sqlitevec.xcframework/ios-arm64_x86_64-simulator/sqlitevec.framework/

  # Set @rpath
	install_name_tool -id @rpath/sqlitevec.framework/sqlitevec ./templates/sqlitevec.xcframework/ios-arm64_x86_64-simulator/sqlitevec.framework/sqlitevec

.PHONY: ios ios_arm64 ios_x86_64 ios_arm64_sim
```

1. You first need to compile your library for iOS. There are a lot of things to take care here. Detecting the correct compiler chain. You NEED to make sure you are setting the correct min iPhone OS version (dylib support was added in iOS 8).
2. Then compiling the library into an .o and then linking it as a dylib. Dynamic libraries in iOS have no extension. The make file creates a folder structure and drops the generated files in the correct places.
3. Once this files are generated the makefile will try to merge the arm-simulator and intel-simulator binaries into a single "fat" binary. The reason is clashing of architectures (both arm-sim and intel-sim target the same "arch" so they clash and need to be merged into a "fat" binary).
4. With the binary merged we can drop everything into a `.xcframework` template. [You can download it here](https://github.com/OP-Engineering/op-sqlite/tree/main/ios/sqlitevec.xcframework). You need of course rename it properly and modify the paths but by using a template we skip more not-so-important steps.
5. With the files in the correct places we need to final set the `@rpath`. The rpath basically tells the OS where to find the canonical path of the file. It's mean for the runtime linker to find the correct file from a memory safe location when the app is compiled in hardened mode. This is confusing, don't think too much about it, it has to do with sandboxing and security of the OS.

# XCFramework

After you got your library compiled correctly, it's not enough to just drop them somewhere on iOS and call it a day. The `.xcframework` which basically is a folder that contains an `Info.plist`, tells Xcode which framework to load based on your computer arch and target. You **could** also create the `xcframework` via command, but it will not create the internal `frameworks` inside for you. Still useful command if you are compiling static libs:

```sh
xcodebuild -create-xcframework -library ./sim_fat/libsqlite_vec.a -headers ../../ -library ./arm64/libsqlite_vec.a -include ../../ -output libsqlite_vec.xcframework
```

> This is a sample command, won't work for this particular dylib case. But if you just need static libs, this is it. Once you have everything packaged in an .xcframework your static libs (.a) are automatically loaded for you. No need to mess with the rpath and frameworks

The `Info.plist` also contains entries to the folders which contain the `frameworks` that actually contain the dylibs.

# Each framework Info.plist

Each `.framework` inside the `.xcframework` contains it's own `Info.plist`. You can ignore most of this except the bundle identifier. This value is important because it will be used on runtime to load the binary. You should modify them to match your library name and bundle identifier (`CFBundleExecutable` tells the name of the binary, `CFBundleIdentifier` is needed to load the dylibs):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>sqlitevec</string>
  <key>CFBundleIdentifier</key>
  <string>com.ospfranco.sqlitevec</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundlePackageType</key>
  <string>FMWK</string>
  <key>CFBundleSignature</key>
  <string>????</string>
  <key>CFBundleVersion</key>
  <string>1.0.0</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
	<key>MinimumOSVersion</key>
  <string>8.0</string>
</dict>
</plist>
```

# Loading it in runtime

After you have correctly created the `xcframework` you can then add it as a dependency in your project. Directly drop it into Xcode, or if you are using cocoapods declare as:

```ruby
s.vendored_frameworks = "sqlitevec.xcframework"
```

This just takes care of packaging into your app once you do `pod install`. Once the app starts you actually have load the dylib. Here is a snippet to do this:

```objc
NSBundle *libsqlitevec_bundle = [NSBundle bundleWithIdentifier:@"com.ospfranco.sqlitevec"];
NSString *sqlite_vec_path = [libsqlitevec_bundle pathForResource:@"sqlitevec" ofType:@""];
```

This is not how you LOAD it, but rather how you find it in the file system. At least for my use case that is all I needed. I can then pass it to sqlite and it takes care of loading it on memory (via `dlopen` I guess, or some other system call).

# Debugging

If you are unsure any of the steps above is not correctly applied you can verify them.

Verify the min OS version is set correctly by running:

```
otool -l sqlitevec.framework/sqlitevec | grep -A 3 LC_VERSION_MIN_IPHONEOS
```

If the key is there you should see the set version. This is mandatory for the iOS device arm64 version. If not set then Apple will reject your embedded framework when you send the submission to the app store. It should look something like this:

```
Load command 8
      cmd LC_VERSION_MIN_IPHONEOS
  cmdsize 16
  version 8.0
      sdk 8.0
```

The `@rpath also needs to be correct`, although it is done for you in the Makefile you can verify is properly set by running:

```
otool -L sqlitevec.framework/sqlitevec
```

You should see an entry with `@rpath` like this:

```
sqlitevec.framework/sqlitevec:
        @rpath/sqlitevec.framework/sqlitevec (compatibility version 0.0.0, current version 0.0.0)
        /usr/lib/libSystem.B.dylib (compatibility version 1.0.0, current version 1351.0.0)
```
