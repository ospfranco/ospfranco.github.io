---
layout: post
title: Rust tips from a noob
date: 2025-06-05
categories: post
permalink: /:title/
image: /assets/oscar.jpg
spanish_version: /rust-tips-de-un-noob
---

I'm a Rust noobie. Learned because some clients wanted to run Rust in React-Native. Because of that I've been learning on the go and relying on co-pilot to teach me the basic concepts. But LLMs are regurgitating machines are not the best at giving the idiomatic code. Here are some of the tips I've learned. With caveats of course, assume you can use `std`, etc.

- At least in my experience it's better to aim for stateless architectures than to risk a lot of mutexes, send+sync and hard to understand/easy-to-lock code. If you can avoid global state, the next point is useful ↓
- Don't use `lazy_static` or `once_cell` crates, their functionality has been incorporated into the standard lib (`std`) and one can now just use `OnceLock` and `LazyLock` to initialize global variables.

  ```rust
    // ❌ Don't
    lazy_static! {
      // your global variables
    }

    // ✅ Do
    static MY_GLOBAL_STRING: LazyLock<RwLock<String>> =
      LazyLock::new(|| RwLock::new("Hello World!".into()));

  ```

- Generally speaking `RwLock` is what you want instead of `Mutex`. It allows for multiple readers without fully locking your process. That being said, if you will read and write within the same function it's very important to free any reader lock!

  ```rust
  let my_read_var = MY_VAR.read().unwrap()
  // If you don't drop
  drop(my_read_var)
  // This writer will lock
  let mut my_write_var = MY_VAR.write().unwrap();
  ```

- Adding WASM after-the-fact will be pain as WASM is not multi-threaded. Async code might need to be refactored or compiled with `cfg`s to avoid async traits, send+sync usage. Worse case you might have to recurre to macros that completely kill IDE analysis.
- If you are exposing a C-API and returning `std::ffi::Cstring` to the calling C context, strings must be returned to Rust to be safely de-allocated.

  ```rust
  #[no_mangle]
  unsafe extern "C" fn get_a_string() -> *mut c_char {
    let data = CString::new("Hello World!".into()).unwrap();
    data.into_raw() as *mut c_char
  }

  // The pointer must be later returned to Rust for safe de-allocation
  #[no_mangle]
  unsafe extern "C" fn free_string(ptr: *mut c_char) {
      if ptr.is_null() {
          return;
      }

      let _ = CString::from_raw(ptr);
      // Automatically dropped at the end of function
  }
  ```

- Your team might not be used to the usage of certain monad-like patterns, such as `Result` and `Option`. They allow for very idiomatic and terse Rust code. Enforce their usage.
- Though Rust is cross-platform compilable, there are many pitfalls which are not obvious.
  - One that bit me really hard was the lack of access to native TLS certs on Android, which cascaded into OpenSSL being compiled and included in my crate. This then goes down a rabbit hole of `nativetls` vs `rustls` crates. If you are targeting multi-platform go with `rustls` if possible.
- `Ring` is being deprecated/on-hold/abandoned, a lot of libraries are migrating to `aws-lc-rs`, so should you.
  - Migration of community crates is slowly happening towards aws-lc-rs. You might need to toggle features or bump versions to take advantage of this.
- Feature flags are great but their real-world usage and behavior is not always clear. Scouring the source code might be the only way to get a full understanding of what feature flags are available and what they do. Without this understanding or the by assuming the default features are correct, you might be adding a lot of useless code to your project. This might be tree-shacked during compilation or not. Dangerous. There is no easy way to detect this, except reading through the docs and looking at the source code and see what can you turn off and still get a functioning crate.
- Conditional compilation is very powerful but can also be dangerous. For easier testing or debugging, it might be tempting to conditionally compile a lot of code with `#[cfg(test)]` or `#[cfg(debug)]` but this can have issues down the road with hidden errors that are not detected while developing. I've found using a `if cfg!(test)` is sometimes better as all the branches of your code are compiled and avoid a lot of dead compilation zones. Zones that be hiding deeper compilation issues or might throw errors/warnings when compiled in release mode.
- For some reason the Rust community seems to be enamored with auto-generated docs from the source code. This documentation sucks balls. It basically just outputs the same info as function signatures without a clear flow on how to use the APIs of the crates. Unfortunately scouring the source repos for examples is the best way to understand how to use each crate.
- Error propagation through `?` seems to be the recommended way of doing things, but one looses the exact line where the error was thrown? I'm not sure if I'm doing things wrong. In any case, it's better to use that with very specific error types.
- The `assert2` crate is awesome and it will make your tests easier to debug by outputting the values with colors, instead of just opaque errors.
