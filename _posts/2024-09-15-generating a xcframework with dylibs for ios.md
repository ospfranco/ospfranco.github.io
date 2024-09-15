---
layout: post
title: Generating a XCFramework with dylibs for iOS
date: 2024-09-15
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

This was an absolute pain to get right, so I hope I will save someone some time in case you ever need to compile a dylib for iOS.

# Frameworks

First of all, to load dylibs in iOS Apple absolutely fucked us all. You need to create a `.framework` with a lot of peculiarities. I will skip the why and most of the explanation and just give you a template you can use.

# Compile your library

I will take [sqlite-vec](https://github.com/asg017/sqlite-vec) as an example. It's a sqlite extension to do vector searching for LLMs.

You first need to compile your library for iOS. There are a lot of things to take care here. Detecting the correct compiler chain. You NEED to make sure you are setting the correct min iPhone OS version (dylib support was added in iOS 8). I basically take care of this with a Makefile:

```make
MIN_IOS_VERSION = 8.0

# iOS SDK paths
IOS_SDK_PATH = $(shell xcrun --sdk iphoneos --show-sdk-path)
IOS_SIMULATOR_SDK_PATH = $(shell xcrun --sdk iphonesimulator --show-sdk-path)

# iOS cross-compiler toolchains
CC_ios_arm64 = $(shell xcrun --sdk iphoneos --find clang)
CC_ios_x86_64 = $(shell xcrun --sdk iphonesimulator --find clang)

# Output directories for iOS
OUT_DIR_ios_arm64 = $(prefix)/ios/arm64
OUT_DIR_ios_x86_64 = $(prefix)/ios/x86_64
OUT_DIR_ios_arm64_simulator = $(prefix)/ios/arm64_simulator

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
	lipo -create ./dist/ios/x86_64/sqlitevec ./dist/ios/arm64_simulator/sqlitevec -output dist/ios/sim_fat/sqlitevec
	cp ./dist/ios/arm64/sqlitevec ./templates/sqlitevec.xcframework/ios-arm64/sqlitevec.framework/
	install_name_tool -id @rpath/sqlitevec.framework/sqlitevec ./templates/sqlitevec.xcframework/ios-arm64/sqlitevec.framework/sqlitevec
	cp ./dist/ios/sim_fat/sqlitevec ./templates/sqlitevec.xcframework/ios-arm64_x86_64-simulator/sqlitevec.framework/
	install_name_tool -id @rpath/sqlitevec.framework/sqlitevec ./templates/sqlitevec.xcframework/ios-arm64_x86_64-simulator/sqlitevec.framework/sqlitevec

.PHONY: ios ios_arm64 ios_x86_64 ios_arm64_sim
```

That's the full Makefile. You can see the first lines are all about the steps mentioned above. Then compiling the library into an .o and then linking it as a dylib. It creates a file without extension on each of the target architectures. This are the files we will need to package to get iOS to load the dylib.

# XCFramework

After you got your library compiled correctly, it's not enough to just drop them somewhere on iOS and call it a day. You will notice the library is compiled for iOS arm64 device, iOS arm64 simulator and intel simulator. In order to load all of these easily you need to package everything into a `.xcframework` which basically is a folder that contains an `Info.plist`, which tells Xcode which framework to load based on your computer arch and target. Long story short, you can just copy [this folder structure](https://github.com/OP-Engineering/op-sqlite/tree/main/ios/sqlitevec.xcframework). You CAN also create the `xcframework` via command, but it will not create the internal `frameworks` inside for you. Still useful command if you are compiling let's say static libs:

```sh
xcodebuild -create-xcframework -library ./sim_fat/libsqlite_vec.a -headers ../../ -library ./arm64/libsqlite_vec.a -include ../../ -output libsqlite_vec.xcframework
```

> This is a sample command, won't work for this particular dylib case. But if you just need static libs, this is it. Once you have everything packaged in an .xcframework your static libs (.a) should load just fine

The `.xcframework` contains a `Info.plist`, inside there are entries to the folders which contain the `frameworks` that actually contain the dylibs. The makefile will combine the arm64-sim and the intel-sim binaries into a fat binary (they would clash otherwise when you try to run your app). Then try to drop them in the correct folders. Before we take a look into the `info.plist` of each framework, the last step is using `install_name_tool` to basically set a dynamic path on which the app will look for the correct binary version on runtime. iOS apps are hardened so this step is required for the OS to correctly look for the library in the sandboxed iOS environment.

# Each framework Info.plist

Each `.framework` inside the `.xcframework` contains it's own `Info.plist`. You can ignore most of this except the bundle identifier. This value is important because it will be used on runtime to load the binary

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

You can set it to whatever you want, just remember it. Also take a look at `CFBundleExecutable` which basically tells which is the dylib that is contained in the `framework`, change it to whatever your library is named.

# Loading it in runtime

After you have correctly created the `xcframework` you can then add it as a dependency in your project. Directly drop it into xcode, or if you are using cocoapods declare as:

```ruby
s.vendored_frameworks = "sqlitevec.xcframework"
```

This just takes care of packaging into your app once you do `pod install`. Once the app starts you actually have load the dylib. Here is a snippet to do this:

```objc
NSBundle *libsqlitevec_bundle = [NSBundle bundleWithIdentifier:@"com.ospfranco.sqlitevec"];
NSString *sqlite_vec_path = [libsqlitevec_bundle pathForResource:@"sqlitevec" ofType:@""];
```

Ok, this is not how you LOAD it, but rather how you find it in the file system. At least for my use case that is all I needed. I can then pass it to sqlite and it takes care of loading it on memory.
