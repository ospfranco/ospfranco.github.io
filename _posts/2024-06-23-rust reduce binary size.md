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
```

# Cargo Bloat

I haven't fully explored what this tool can do, but it does point to large sections of the code. Install it with `cargo install cargo-bloat` and then run:

```
cargo bloat --release --target=<your-target>
```

# OpenSSL

The OpenSSL adds a lot of weight to a crate unless you need it, you can use [ring](https://crates.io/crates/ring) which reduced further 4 MB of my crate.

# Results

Using all the compile optimizations, I was able to reduce the output of one of my binaries from 66 MB to 24.7 MB. It's still large but better.
