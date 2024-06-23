---
layout: post
title: Reduce Rust binaries size
date: 2024-06-23
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

I find myself writting lots of Rust nowadays. I'm by no means an expert but I need to make due with my limited knowledge. A constant problem I'm facing is that the binaries outputted by Rust are huge. This is specially a problem on mobile where each Mb counts.

The documentation is a bit confusing but here is the configuration I ended up using to get somewhat OK sizes. On the `cargo.toml`:

```toml
[profile.release] # When compiling in release mode
debug = false # Exclude debug symbols
strip = "symbols" # Exclude the rest of symbols
# opt-level = "z" # Did not use this, but equals C++ optimize for size (O3?)
lto = true # Link time optimization, not sure what this does but helps reduce the size
```

Additionally, using the following flag turns on dead-code stripping:

```
RUSTFLAGS="-C link-arg=-Wl,-dead_strip" cargo build --release --target=<your-target>
```

# Cargo bloat

I haven't fully explored what this tool can do, but it does point to large sections of the code. Install with `cargo install cargo-bloat` and then fire away:

```
cargo bloat --release --target=<your-target>
```

# Results

Using all the compile optimizations I was able to get output binary from 60mbs to 30mbs, still large but better.
