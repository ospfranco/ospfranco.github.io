---
layout: post
title: React Native, Rust step-by-step integration guide
date: 2023-08-11 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.JPG
---

There are many talks and tutorials that go over the more advanced topics once people have integrated Rust into their projects, however, if you are like me and have no idea about how to build, link and include your Rust code, they really convey little information.

Here is a more step by step tutorial, but in the video form I go over the concepts that actually make this work, so you can adjust and understand the tooling behind and you can maintain your integration.

<iframe class="w-full h-96" src="https://www.youtube.com/embed/PPU4Hrz4J_s" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

> I’m currently looking for freelance projects, if your team needs a RN developer or some consulting, [send me an email](mailto://ospfranco@gmail.com).

# Basic Setup and iOS

- Set up Rust compiler on your computer, just follow the instructions on the Rust website.
- Set up cross compilation targets, 32 bits targets are no longer supported, so we will only add those usable in 2023.
    - 32bit targets have been deprecated by the rust team, no longer available on the stable channel
    
    ```bash
    rustup target add x86_64-apple-ios
    rustup target add aarch64-apple-ios
    rustup target add aarch64-apple-ios-sim
    
    rustup target add x86_64-linux-android
    rustup target add aarch64-linux-android
    rustup target add armv7-linux-androideabi
    rustup target add i686-linux-android
    ```
    
- Next we will create the folder where we will put all of our Rust code and infra scripts. In my case I will call it `my_sdk`
  
  ```bash
  cargo new [YOUR_LIBRARY_NAME]
  ```

- Change name of `main.rs` to `lib.rs`
- Add your API code on lib.rs
- Add cbindgen crate (alternative is cxx.rs) `cargo install cbindgen`
- Create a `cbindgen.toml` file, it is fine if it is empty.
- `cbindgen --config cbindgen.toml --crate my_sdk --output include/my_sdk.h`
- Modify toml to compile as static library for iOS and a dynamic library with JNI linked for Android
    
    ```bash
    [package]
    name = "SDK"
    version = "0.1.0"
    edition = "2021"
    
    [lib]
    name = "SDK"
    crate-type = ["staticlib", "cdylib"]
    
    [dependencies]
    libc = "0.2.80"
    jni = "0.17.0"
    
    [features]
    default = ["jni"]
    ```
    
- Setup Makefile
    
    ```makefile
    ARCHS_IOS = x86_64-apple-ios aarch64-apple-ios aarch64-apple-ios-sim
    ARCHS_ANDROID = aarch64-linux-android armv7-linux-androideabi i686-linux-android
    LIB = libmy_sdk.a
    XCFRAMEWORK = MySdk.xcframework
    
    all: ios android
    
    ios: $(XCFRAMEWORK)
    
    android: $(ARCHS_ANDROID)
    	sh copy_android.sh
    
    .PHONY: $(ARCHS_IOS)
    $(ARCHS_IOS): %:
    	cargo build --target $@ --release
    
    .PHONY: $(ARCHS_ANDROID)
    $(ARCHS_ANDROID): %:
    	cargo build --target $@ --release
    
    $(XCFRAMEWORK): $(ARCHS_IOS)
    	lipo -create $(wildcard target/x86_64-apple-ios/release/$(LIB)) $(wildcard target/aarch64-apple-ios-sim/release/$(LIB)) -output simulator_fat/libmy_sdk.a
    	xcodebuild -create-xcframework -library $(wildcard target/aarch64-apple-ios/release/$(LIB)) -headers include -library simulator_fat/libmy_sdk.a -headers include -output $@
    ```
    
- Add generated `.xcframework` to Xcode (dragging and dropping is the easiest)
    - On the project properties mark the xcframework as embed and sign
- You should now be able to simply import the header file and call the rust function from any obj-c++ file

# Android

- On cargo.toml add the `cdylib` crate-type, plus the features and make it optional so that it doesn’t intefere with iOS

  ```makefile
  [package]
  name = "my_sdk"
  version = "0.1.0"
  edition = "2021"

  [lib]
  name = "my_sdk"
  crate-type = ["staticlib", "cdylib"]

  [dependencies]
  libc = "0.2.80"
  jni = { version = "0.18.0", optional = true, default-features = false }

  [features]
  default = ["jni"]
  ```

- Android unfortunately requires its own linker, some of the old tutorials mention using a script inside the sdk to generate a standalone toolchain, on the latest versions of the Android SDK there are pre-compiled versions for windows, linux and mac, on my machine I can find them on `~/Library/Android/sdk/ndk/24.0.8215888/toolchains/llvm/prebuilt/darwin-x86_64/bin`. Take note of the version since version 24 of the Android SDK is the one that supports m1 machines.
- What we need to do then is tell the Rust compiler to use some of this binaries to compile our rust code, to do this we will create a cargo-config.toml file on our folder, but then we need to copy this into our home folder in the machine since this is a global configuration file:

  ```toml
  # template file on <project>/my_sdk/cargo-config.toml
  # All paths are relative to the user home folder
  [target.aarch64-linux-android]
  ar = "Library/Android/sdk/ndk/24.0.8215888/toolchains/llvm/prebuilt/darwin-x86_64/bin/aarch64-linux-android-ar"
  linker = "Library/Android/sdk/ndk/24.0.8215888/toolchains/llvm/prebuilt/darwin-x86_64/bin/aarch64-linux-android31-clang"

  # Take note, the target the binary names do not match on this case
  [target.arm-linux-androideabi]
  ar = "Library/Android/sdk/ndk/24.0.8215888/toolchains/llvm/prebuilt/darwin-x86_64/bin/armv7a-linux-androideabi-ar"
  linker = "Library/Android/sdk/ndk/24.0.8215888/toolchains/llvm/prebuilt/darwin-x86_64/bin/armv7a-linux-androideabi31-clang"

  [target.i686-linux-android]
  ar = "Library/Android/sdk/ndk/24.0.8215888/toolchains/llvm/prebuilt/darwin-x86_64/bin/i686-linux-android-ar"
  linker = "Library/Android/sdk/ndk/24.0.8215888/toolchains/llvm/prebuilt/darwin-x86_64/bin/i686-linux-android31-clang"

  [target.x86_64-linux-android]
  ar = "Library/Android/sdk/ndk/24.0.8215888/toolchains/llvm/prebuilt/darwin-x86_64/bin/x86_64-linux-android-ar"
  linker = "Library/Android/sdk/ndk/24.0.8215888/toolchains/llvm/prebuilt/darwin-x86_64/bin/x86_64-linux-android31-clang"
  ```

- Once you have this file, copy it to the home folder via

  ```bash
  cp cargo-config.toml ~/.cargo/config
  ```

- Now we actually have to to compile Rust for android, unlike for iOS, Android requires more flags, instead of doing this via make file a bash script is a little simpler. First modify the Makefile and then create a new `build-android.sh` script (don’t forget to give it permissions).
    
  ```makefile
  ARCHS_IOS = x86_64-apple-ios aarch64-apple-ios aarch64-apple-ios-sim
  ARCHS_ANDROID = i686-linux-android x86_64-linux-android aarch64-linux-android arm-linux-androideabi
  LIB = libmy_sdk.a
  XCFRAMEWORK = MySdk.xcframework
  
  all: ios android
  
  ios: $(XCFRAMEWORK)
  
  android: $(ARCHS_ANDROID)
  
  .PHONY: $(ARCHS_IOS)
  $(ARCHS_IOS): %:
    cargo build --target $@ --release
  
  .PHONY: $(ARCHS_ANDROID) 
  $(ARCHS_ANDROID): %:
    ./build-android.sh $@ # Change this!!!!!!!!!
  
  $(XCFRAMEWORK): $(ARCHS_IOS)
    lipo -create $(wildcard target/x86_64-apple-ios/release/$(LIB)) $(wildcard target/aarch64-apple-ios-sim/release/$(LIB)) -output simulator_fat/libmy_sdk.a
    xcodebuild -create-xcframework -library $(wildcard target/aarch64-apple-ios/release/$(LIB)) -headers include -library simulator_fat/libmy_sdk.a -headers include -output $@
  ```
    

  ```bash
  #!/bin/bash

  TARGET="$1"

  if [ "$TARGET" = "" ]; then
      echo "missing argument TARGET"
      echo "Usage: $0 TARGET"
      exit 1
  fi

  NDK_TARGET=$TARGET

  if [ "$TARGET" = "arm-linux-androideabi" ]; then
      NDK_TARGET="armv7a-linux-androideabi"
  fi

  API_VERSION="21"
  NDK_VERSION="24.0.8215888"
  NDK_HOST="darwin-x86_64"

  # needed so we can overwrite it in the CI
  if [ -z "$NDK" ]; then
    NDK="$ANDROID_HOME/ndk/$NDK_VERSION"
  fi

  TOOLS="$NDK/toolchains/llvm/prebuilt/$NDK_HOST"

  AR=$TOOLS/bin/llvm-ar \
  CXX=$TOOLS/bin/${NDK_TARGET}${API_VERSION}-clang++ \
  RANLIB=$TOOLS/bin/llvm-ranlib \
  CXXFLAGS="--target=$NDK_TARGET" \
  cargo build --target $TARGET --release $EXTRA_ARGS
  ```

> This method of compilation was developed by **Nik Graf** and his team at **Serenity Notes**, shot out to them.
> [https://serenity.re](https://www.serenity.re/en/notes)

- Ask you can see you need to have set the `$ANDROID_HOME` environment variable (I have it on my `.zshrc`) you can modify the `API_VERSION` and the `NDK_VERSION` to the ones you are using and have installed on your machine.

- We will still not be able to call our Rust code from Java, because we need to go through the JNI and the JNI is very picky regarding names, we need to create specific binding for Android, on the `[lib.rs](http://lib.rs)` and the following block

- We can finally call `make android` and the library will be created for us
    
    ```rust
    // On Android function names need to follow the JNI convention
    pub mod android {
      extern crate jni;
    
      use self::jni::JNIEnv;
      use self::jni::objects::JClass;
      use self::jni::sys::jstring;
    
      #[no_mangle]
      pub unsafe extern fn Java_com_samplesdk_BindingsModule_helloWorld(env: JNIEnv, _: JClass) -> jstring {
        let output = env.new_string("Hello from Rust!").expect("Couldn't create java string!");
        output.into_inner()
      }
    }
    ```
    
- We now need to somehow include this .so files into the Android compilation, the easiest way is to copy them inside of the `Android/app/src` folder and then Gradle should automatically pick them up and include them in the compilation process. Let’s update our make file to include a new script that will copy everything once it is compiled:

  ```makefile
  ARCHS_IOS = x86_64-apple-ios aarch64-apple-ios aarch64-apple-ios-sim
  ARCHS_ANDROID = i686-linux-android x86_64-linux-android aarch64-linux-android arm-linux-androideabi
  LIB = libmy_sdk.a
  XCFRAMEWORK = MySdk.xcframework

  all: ios android

  ios: $(XCFRAMEWORK)

  android: GENERATE_ANDROID

  # PHONY keyword on make means this is not a file, just an identifier for a target
  .PHONY: $(ARCHS_IOS)
  $(ARCHS_IOS): %:
    cargo build --target $@ --release

  $(XCFRAMEWORK): $(ARCHS_IOS)
    lipo -create $(wildcard target/x86_64-apple-ios/release/$(LIB)) $(wildcard target/aarch64-apple-ios-sim/release/$(LIB)) -output simulator_fat/libmy_sdk.a
    xcodebuild -create-xcframework -library $(wildcard target/aarch64-apple-ios/release/$(LIB)) -headers include -library simulator_fat/libmy_sdk.a -headers include -output $@

  .PHONY: $(ARCHS_ANDROID)
  $(ARCHS_ANDROID): %:
    ./build-android.sh $@

  .PHONY: GENERATE_ANDROID
  GENERATE_ANDROID: $(ARCHS_ANDROID)
    ./copy-android.sh

  .PHONY: clean
  clean:
    rm -rf target
  ```

- We of course need to create the `[copy-android.sh](http://copy-android.sh)` script (don’t forget to give permissions)

  ```makefile
  #! /bin/bash
  mkdir -p ../android/app/src/main/jniLibs
  mkdir -p ../android/app/src/main/jniLibs/x86
  mkdir -p ../android/app/src/main/jniLibs/arm64-v8a
  mkdir -p ../android/app/src/main/jniLibs/armeabi-v7a
  # missing arm-linux-androideabi here, don't know the name of the arch?

  cp ./target/i686-linux-android/release/libmy_sdk.so ../android/app/src/main/jniLibs/x86/libmy_sdk.so
  cp ./target/aarch64-linux-android/release/libmy_sdk.so ../android/app/src/main/jniLibs/arm64-v8a/libmy_sdk.so
  cp ./target/arm-linux-androideabi/release/libmy_sdk.so ../android/app/src/main/jniLibs/armeabi-v7a/libmy_sdk.so
  # missing x86_64-linux-androideabi here, don't know the name of the arch?

  echo "Dynamic libraries copied!"
  ```


> Another alternative and also if you are using JSI is using CMakeLists to declare your files as dependencies and or library, then it will automatically be included in the compilation process. You can see one example of this here:
> [https://github.com/serenity-kit/react-native-opaque/blob/main/android/CMakeLists.txt](https://github.com/serenity-kit/react-native-opaque/blob/main/android/CMakeLists.txt)
> However loading .so libraries is a common practice in the Android world, so I think both are fine.


- We can now create a RN Module (or JSI module) and simply load the library and call it (via JNI of course)

  ```java
  package com.samplesdk;

  import com.facebook.react.bridge.NativeModule;
  import com.facebook.react.bridge.ReactApplicationContext;
  import com.facebook.react.bridge.ReactContext;
  import com.facebook.react.bridge.ReactContextBaseJavaModule;
  import com.facebook.react.bridge.ReactMethod;
  import com.facebook.react.util.RNLog;
  import java.util.Map;
  import java.util.HashMap;

  public class BindingsModule extends ReactContextBaseJavaModule {
      static {
          System.loadLibrary("my_sdk");
      }

      BindingsModule(ReactApplicationContext context) {
          super(context);
      }

      @Override
      public String getName() {
          return "Bindings";
      }

      @ReactMethod
      public void init(String apiKey) {
          RNLog.w(this.getReactApplicationContext(), "BindingsModule.init() called with apiKey: " + apiKey + "calling rust");
          String result = helloWorld();
          RNLog.w(this.getReactApplicationContext(), "Rust says: " + result);
      }

      private static native String helloWorld();
  }
  ```