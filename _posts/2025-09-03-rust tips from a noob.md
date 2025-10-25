---
layout: post
title: Rust Noobie Best Practices
date: 2025-09-03
categories: post
permalink: /:title/
image: /assets/oscar.jpg
spanish_version: /rust-tips-de-un-noob
---

I've been learning Rust by doing, sponsored directly by clients who needed Rust code in a React Native app.

As many others have pointed out before me, Rust has a steep learning curve once you go beyond the basics. You might be relying on an LLM to write some code for you but the quality of the code LLMs spit out is dubious.

I've picked up on some tricks and best practices over the last year. I decided that compiling some of the points might be valuable info.

- Stateless architectures might be easier to deal with than a lot of shared state with mutexes and send+sync.
- Generally speaking `RwLock` is what you want instead of `Mutex`. It allows for multiple readers without fully locking your process. That being said, if you will read and write within the same function it's very important to free any reader lock!

  ```rust
  let my_read_var = MY_VAR.read().unwrap()
  // If you don't drop
  drop(my_read_var)
  // This writer will lock
  let mut my_write_var = MY_VAR.write().unwrap();
  ```

- For global variables, LLMs regurgitate code that uses `lazy_static` or `once_cell` crates. Their functionality has been incorporated into the standard lib (`std`) and one can now just use `OnceLock` and `LazyLock` to initialize global variables.

  ```rust
    // ❌ Don't
    lazy_static! {
      // your global variables
    }

    // ✅ Do
    static MY_STR: LazyLock<RwLock<String>> = LazyLock::new(|| RwLock::new("Hello World!".into()));
  ```

- You might need to call code only once on crate initialization or some other event. `tokio::sync::OnceCell` can be abused to achieve this:

  ```rust
  use tokio::sync::OnceCell

  static INIT: OnceCell<()> = OnceCell::const_new();

  pub fn init() {
    // Makes sure the code inside is only run once
    INIT.get_or_init(|| async {
        my_async_function().await;
    })
    .await;
  }
  ```

- `cargo test` runs tests in parallel but within a single instance. This is a pain in the ass for encapsulating state between the tests. IMO it's better to use [cargo-nextest](https://nexte.st/) which starts a separate process per test. Here is the config I use to give better results:

  ```toml
  [profile.default]
  retries = 3
  fail-fast = false
  status-level = "all"
  ```

- The [assert2](https://crates.io/crates/assert2) crate is awesome and it will make your tests easier to debug by outputting the values with colors, instead of just opaque errors.
- Adding WASM after-the-fact will be pain as WASM is not multi-threaded. Async code might need to be refactored or compiled with `cfg`s to avoid async traits, send+sync usage. Worse case you might have to recurse to macros that completely kill IDE analysis.
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
  - On Android, non-java code cannot access native TLS certs for HTTPs requests. This forces Rust to compiled and included in my crate. This then goes down a rabbit hole of `nativetls` vs `rustls` crates. If you are targeting multi-platform go with `rustls` if possible.
- `Ring` is being deprecated/on-hold/abandoned, a lot of libraries are migrating to `aws-lc-rs`, so should you.
  - Migration of community crates is slowly happening towards `aws-lc-rs`. You might need to toggle features or bump versions to take advantage of this.
- Feature flags are great but their real-world usage and behavior is not always clear. If you assume the default features are what you want, you might be adding a lot of useless code to your project. There is no easy way to detect this, except reading through the docs and looking at the source code and see what can you turn off and still get a functioning crate.
  - Use `cargo-appreaiser` extension on vscode. Not only it shows outdated packages but it also shows the crate features on hover.
- Conditional compilation is very powerful but can also be dangerous. For easier testing or debugging, it might be tempting to conditionally compile a lot of code with `#[cfg(test)]` or `#[cfg(debug)]` but this can have issues down the road with hidden errors that are not detected while developing. I've found using a `if cfg!(test)` is sometimes better as all the branches of your code are compiled and avoid a lot of dead compilation zones. Zones that be hiding deeper compilation issues or might throw errors/warnings when compiled in release mode.
- For some reason the Rust community seems to be enamored with auto-generated docs from the source code. This documentation sucks balls. It basically just outputs the same info as function signatures plus comments, without a clear flow on how to use the APIs of the crates. I still haven't found a good way to piece good API usage, seems the community has not cracked this one yet.
- Error propagation through the `try operator` (`?`) seems to be the recommended way of doing things, but one looses the exact line where the error was thrown? I'm not sure if I'm doing things wrong. In any case, it's better to always use it in combination with your own custom Error enum.
