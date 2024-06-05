---
layout: post
title: Writting tests for Tauri Rust Commands
date: 2024-06-05
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

I'm now in charge of a Tauri app and there is a lot of native Rust functionality that needs to be exposed to the JS side. Like any principled dev I want to write tests for my code.

The official documentation says one should write e2e tests with a UI simulation framework to test this functionality but that is way to cumbersome. I wanted unit tests for my Rust code. Also, I did not have stateless Rust functions, but functions where Tauri itself managed the state, so I needed to mock the entire Tauri app stack.

Credit where is due this [Stack Overflow answer](https://stackoverflow.com/questions/77524788/writing-tests-for-tauri-commands-how-to-access-and-manage-state-in-test-environ) provided the info I was looking for.

However Tauri `1.6.7` broke this functionality and `1.6.8` fixed it by adding a new parameter.

Without further ado, first you need to add the `test` feature in your Tauri dependency:

```toml
tauri = { version = "1.6.8", features = ["api-all", "updater", "test"] }
```

Then you can write your test like so:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::Path;
    use tauri::{
        test::{mock_context, noop_assets, MockRuntime},
        App,
    };

    fn before_each() -> Result<tauri::App<MockRuntime>, std::io::Error> {
        let app = tauri::test::mock_builder()
            .plugin(super::init_plugin())
            .build(mock_context(noop_assets()))
            .unwrap();

        // Any other setup code you need
        Ok(app)
    }

    async fn after_each(app: App<MockRuntime>) {
        // your clean up code
    }

    #[tokio::test]
    async fn should_return_0_with_no_loaded_models() {
        let app = before_each().unwrap();
        let window = app.get_window("main").unwrap();
        let foo = tauri::test::get_ipc_response::<Vec<String>>(
            &window,
            tauri::InvokePayload {
                cmd: "plugin:my_plugin|foo".into(),
                tauri_module: None,
                invoke_key: Some(tauri::test::INVOKE_KEY.into()),
                callback: tauri::api::ipc::CallbackFn(0),
                error: tauri::api::ipc::CallbackFn(1),
                inner: serde_json::json!({}),
            },
        );

        assert!(foo.is_ok());

        after_each(app).await;
    }

}

```
