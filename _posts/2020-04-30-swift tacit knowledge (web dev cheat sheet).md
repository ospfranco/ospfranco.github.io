---
layout: post
title: Swift tacit knowledge
excerpt: Web dev to native dev cheat sheet
date: 2020-04-30 09:00:00 -04:00
location: Munich
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/taco.png
twitter:
  username: "ospfranco"
  card: "summary_large_image"
  image: "assets/taco.png"
---

So, I recently released a new mac os app [Tempomat](https://tempomat.dev) (go check it out, it is awesome) and I was left surprinsgly pleased with the experience, mostly because of Apple's SwiftUI framework, it is declarative and along with the Combine framework it brings a lot of the nicesities of web development into the mac platform, however, while I did have experience with the XCode toolchain (because of all the react native I did over the years), this is the first time I truly did native coding, and there were many many pitfalls, so I thought I would write down some of the hard learned lessons over the last weeks, other may find them useful and I can always check them out in case I need them again.

## HTTP Networking code is a tool from the stone age
So this is more a problem in older languages (i.e. Java) where doing stuff like a "simple" http request takes a myriad of objects and configurations and so on, from a web development perspective it feels archaic, in Swift there are some network libraries that can help with it (i.e. AlamoFire) but I did not want to learn more than absolutely necessary, on Swift one creates several objects, first a URL object, which parses the String you pass on it (and can fail), then if you need to send anything but a simple GET request, you need to create a Request Object, finally you wrap everything into a data task... I'm not sure why or if it is the only way to do things, but that is how I got it working, now unfortunately the data task only works with callbacks, and a lesson Javascript learned years ago is the pain of callback hell, how to fix this then? I went for a middle of the road approach and used PromiseKit (it is from the same guy that created Brew), having promises massively simplifies this task, though be aware they are not quite the same as JS Promises, because the type system is a lot more strict on Swift, there are many caveats with them, here is a code snippet of how the code looks:

```swift
func fetchRepos(token: Token) -> Promise<[Repo]> {
    return Promise { seal in
        guard let url = URL(string: "https://api.appcenter.ms/v0.1/apps") else {
            print("Could not parse fetchRepos appcenter url")
            seal.reject(ApiAdapterError.urlError)
            return
        }

        var request = URLRequest(url: url)
        request.addValue(token.token, forHTTPHeaderField: "X-API-Token")
        request.addValue("application/json", forHTTPHeaderField: "accept")

        URLSession.shared.dataTask(with: request) { (data, _, error) in
            if error == nil {
                do {
                    let repos = try self.decoder.decode([ACAppDto].self, from: data!)

                    let repos = repos.map { DtoMapper.mapACAppToRepo($0, token: token) }

                    firstly {
                        when(resolved: repos.map { self.fetchBranches(token: token, repo: $0) })
                    }.done { branchMatrix in
                        var newRepos = [Repo]()
                        for (repo, result) in zip(repos, branchMatrix) {
                            var repo = repo
                            switch result {
                            case .fulfilled(let branches):
                                repo.branches = branches
                                newRepos.append(repo)
                            case .rejected:
                                print("Repo branches could not be inserted")
                            }
                        }

                        seal.fulfill(newRepos)
                    }
                } catch {
                    print("Error parsing AppCenter Repos")
                    seal.reject(error)
                }
            } else {
                seal.reject(error!)
            }
        }.resume()
    }
}
```

Not too pretty to look at, but it does achieve a few things, it has chained requests and correctly encompases the ugly dataTask code so higher levels of the application don't have to deal with it.

## Swift is good, but also full of quirks
Some edge cases I found along the way, after firing a request that gets offloaded to a different thread, you cannot just update certain variables, you need to dispatch the queues from the Main thread:

```swift
return firstly {
    when(resolved: tokens.map { token -> Promise<[Repo]> in
        api.fetchRepos(token: token)
}
.done { repos in
    DispatchQueue.main.async {
        self.isFetchingData = false
        self.failedFetchingData = false

        repos.forEach { result in
            switch result {
            case .fulfilled(let repos):
                self.repos.append(contentsOf: repos)
            case .rejected:
                self.failedFetchingData = true
                print("One of the token's repos could not be fetched")
            }
        }
    }
}.catch { e in
    self.failedFetchingData = true
    self.isFetchingData = false
}
```

Everything is done with enums! and get used to using switches (and pattern matching) a lot:

```swift
enum TokenError: Error {
    case missingName
    case missingToken
    case repeatedName
    case invalidToken
}
```

```swift
enum Sort: String {
    case name = "NAME"
    case status = "STATUS"
}
```

and 20 more enums all over the app

## Swift UI is good, but also very quirky
Here there are many good things, but one can also tell, the time of swiftUI applications is not quite here, for example, there is no way to handle `Enter` key presses when you are focused on a textfield, or when there is an error deep in some swiftUI code, the compiler kinda throws it hands in the air simply says that it cannot infer the correct types, this has lead me to wasting minutes reading the component code line by line trying to see where the error is because some variable changed.

Also the list component is utterly broken, if you have some animation in there, it completely jumps all over the place, one cannot add a background to it, because it has layers and layers of rendering components behind it, at the end in order to get a working list implementation I had to use a scrollView with a forEach inside of it, I don't really know how good is performance with this though:

```swift
ScrollView {
    ForEach(branchList) { branch in
        BranchRow(branch: branch)
            .animation(.easeInOut)
    }
}
.padding(8)
.background(Color.clear)
.frame(maxHeight: .infinity)
```

This also has many quirks, indexes? you can forget about them, you can create an iterator but you are only making your life harder.

## Icons... well, maybe on iOS
You can tell not a lot of love has been placed in the macOS version of swiftUI, while on iOS you can use the system icons for free, they straight up don't work on macOS, either you create your own icon sets by hand OR you scour the internet for ours, until you find [Fucking nsimage syntax](https://hetima.github.io/fucking_nsimage_syntax/), a generated list of system icons you can use in your application, I later found a more official looking [documentation page](https://developer.apple.com/design/human-interface-guidelines/macos/icons-and-images/system-icons/), still... waste of time:

```swift
Image(nsImage: NSImage(named: NSImage.pathTemplateName)!)
```

## I was wrong about cocoapods
For the last few years I thought cocoapods was a plague unleashed specifically designed to torture me, I did not want to learn the xcode toolchain, but now that I've used I can definitely see the value in it, here is one quirky thing that never got mentioned though, my bundle size kinda exploted after adding a couple of libraries, mind you this is still a 2mb app compared to the monsters apps are nowadays, but still, I did not like this explotion, mostly because my app is really simple, however removing the `use_frameworks!` from the podfile, linked the libraries statically and reduced my app size by over a 1mb (~50% or so).

## For unit tests, expectations
One aspect were thing really fall short is unit testing, jest is just such a pleasurable experience that I don't believe it is easily matched, on swift/xcode on the other hand... things get complicated, there is no straightforward way for you tests to return a promise and halt execution until all async code has finished so you have to resort to expectations:
```swift
let tokenRes = badStore.addToken(name: "test", token: "test", provider: CIProvider.circleci)
  switch tokenRes {
  case .failure:
    XCTFail("token could not be added")
  case .success(let t):
    XCTAssertEqual(t.name, "test")
  }

  // bad repo is expected to fail
  let exp = expectation(description: "ApiAdapter was called")
  badStore.fetchData()
      .finally {
          XCTAssert(self.badStore.failedFetchingData)
          exp.fulfill()
  }

  waitForExpectations(timeout: 10)
```
There are many more quirks that wasted my team one way or another, but as stated before I really enjoyed developing this native app, I would still like to optmize it like crazy, but a 1.4 mb app that does it job is not bad at all, tempomat is also super helpful for developers with a lot of build jobs that always need to be on top of things.