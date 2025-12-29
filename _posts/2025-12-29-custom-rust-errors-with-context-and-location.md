---
layout: post
title: Custom Rust errors with context and location
date: 2025-12-29
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

I've had an issue with Rust errors for a while. They don't come with a lot of context information, this paired with the plentiful usage of the `?` operator, sometimes leaves you scratching your head where and how was an error thrown. I just came across [rust errors without dependencies](https://vincents.dev/blog/rust-errors-without-dependencies/). Where the author describes how to get Rust errors with context and location. While it does solve the issue I explored the same problem some months ago and came with a different solution.

My main issue with some of the existing solutions is the need to manually call `.map_err` whenever you have a function that might throw an error. In a large enough codebase, it is a huge amount of boiler-plate. In a world of LLMs this might not be an issue for you, but I hate (most) of what LLMs produce and I review code line by line, so this approach is not really a solution for me.

Here are the constraints I wanted:

- Ability to add a custom context message to the error (e.g "cannot parse '3^'")
- Try to avoid manually mapping errors as much as possible or when desired (i.e. no `map_err` everywhere)
- Ability to attach location if needed without expensive stack traces. Believe me, adding stack traces can be REALLY expensive.
- Leverage existing libraries for all the nice features. I don't care having to use external crates, they actually make life easier.

So here is the solution I came up with using thiserror and a macro:

{% raw %}
```rust
#[derive(Debug, thiserror::Error, Clone, Serialize)]
pub struct MyError {
    pub error: Error,
    pub file: String,
    pub line: String,
}

impl std::fmt::Display for MyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} (at {}:{})", self.error, self.file, self.line)
    }
}


#[derive(Debug, thiserror::Error, Clone, Serialize)]
pub enum Error {
    #[error("Unknown Error: {0}")]
    Unknown(String),
    #[error("Api Error. {0} - {1}")]
    ApiErr(String, String),
    #[error("Invalid API Key")]
    InvalidApiKey,
    // ... All the other error types you want
}

impl From<Error> for MyError {
    fn from(error: Error) -> Self {
        MyError {
            error,
            file: String::new(),
            line: String::new(),
        }
    }
}

pub type Result<T> = std::result::Result<T, MyError>;

#[macro_export]
macro_rules! wherr {
    ($err:expr) => {{
        let file = file!().to_string();
        let line = line!().to_string();
        $crate::error::MyError {
            error: $err,
            file,
            line,
        }
    }};
}

// An example cohercion from a external lib error to the custom error
impl From<reqwest::Error> for MyError {
    fn from(error: reqwest::Error) -> Self {
        let status = error
            .status()
            .map_or_else(|| "No HTTP Status".to_string(), |s| s.to_string());

        let mut details = vec![error.to_string()];

        if let Some(url) = error.url() {
            details.push(format!("URL: {url}"));
        }

        if error.is_timeout() {
            details.push("Request timed out".to_string());
        }

        if error.is_connect() {
            details.push("Connection failed".to_string());
        }

        if error.is_request() {
            details.push("Invalid request".to_string());
        }

        MyError {
            error: Error::ApiErr(status, details.join(" | ")),
            file: file!().to_string(),
            line: line!().to_string(),
        }
    }
}
```
{% endraw %}

## Casting/Returning other lib errors

I can easily just use the `?` operator on a function call to a lib, sometimes the location information can be derived:

{% raw %}
```rust
// Sample dummy http function
pub async fn do_http_request() -> Result<()> {
    let client = reqwest::Client::builder().build().unwrap();
    let res = client.post("https://blah.com/ping").await?;
}
```
{% endraw %}

I can also return errors without line information:

```rust
  return Err(Error::Unknown("Could not do very important operation"));
```

If I do care about the line information, I can either use `map_err` or depending on the code directly use the `wherr!` macro:

{% raw %}
```rust
// When mapping external library errors
let response = client
let client = reqwest::Client::builder().build().unwrap();
let res = client
    .post("https://blah.com/ping")?;
    .map_err(|e| {
        wherr!(Error::ApiErr(
            format!("{:?}", e.status()),
            format!("Could not ping backend, check your network, error: {e}"),
        ))
    })?;
    
// When mapping a internal error
if response.status() != 200 {
    let err = wherr!(Error::ApiErr(
        format!("{:?}", response.status()),
        "Failed to perform health check".to_string(),
    ));

    return Err(err);
}
```
{% endraw %}

When the error is returned/printed it should contain the line information plus the context defined by `this:error`. At least to me it's a bit more idiomatic than wrapping errors everywhere.
