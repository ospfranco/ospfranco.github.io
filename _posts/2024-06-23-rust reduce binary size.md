---
layout: post
title: Reduce Rust binaries size
date: 2024-06-23
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

I find myself writing a lot of Rust nowadays. I'm by no means an expert, but I need to make do with my limited knowledge. A constant problem I'm facing is that the binaries outputted by Rust are huge. This is especially a problem on mobile, where each megabyte counts.

The documentation is a bit confusing, but here is the configuration I ended up using to get somewhat OK sizes. In the `cargo.toml` file:

```toml
[profile.release] # When compiling in release mode
debug = false # Exclude debug symbols
strip = "symbols" # Exclude the rest of the symbols
# opt-level = "z" # Did not use this, but it equals C++'s optimize for size (O3?)
lto = true # Link time optimization, not sure what this does but it helps reduce the size
codegen-units = 1 # Cargo specifies 16 parallel codegen units for release builds. This improves compile times, but prevents some optimizations.
```

# Cargo Bloat

I haven't fully explored what this tool can do, but it does point to large sections of the code. Install it with `cargo install cargo-bloat` and then run:

```
cargo bloat --release --target=<your-target>
```

# Building both a static and dylib

In my experience static binaries on iOS are OK, but on Android they can be huge. Ideally you would specify `crate-type = ['staticlib', 'dylib']` and just be on your merry way, however, it seems there is a bug in the rust compiles and it bloats the static lib massively. In order to get a static binary for iOS and a dynamic one for Android you can set `crate-type = ['dylib']` and change the compilation command for iOS to `cargo rustc --crate-type=staticlib ...`

# OpenSSL

The OpenSSL adds a lot of weight to a crate unless you need it, you can use [ring](https://crates.io/crates/ring) which reduced further 4 MB to 6 MB of my crate.

# Results

Using all the compile optimizations, I was able to reduce the output of one of my binaries from 66 MB to 24.7 MB. It's still large but better.
