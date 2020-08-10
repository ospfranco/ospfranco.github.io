---
layout: post
title: hardcore react-native performance tips
date: 2020-08-10 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
location: Munich
image: assets/taco.png
twitter:
  username: "ospfranco"
  card: "summary_large_image"
  image: "assets/taco.png"
---

Recently a friend send me a link with some react-native [performance optimizations](https://blog.soshace.com/performance-optimizations-for-react-native-applications/), while valuable, there was nothing new in there that I did not see before, and I actually have some cases that might complement them:

## 1. Inlining is more complex in functional components
the article mentions not to pass inline functions and moves the function declaration outside of the jsx, this was true with class components, but functional components are a different game, it doesn't matter where in your component you declare them they will always get created every time the component renders, if you really one to have a single declared function you need to use a useRef hook:

```javascript
let myCallback = useRef(() => {
  // some static function
}).current

return (...)
```

## 2. Hermes... has caveats
Don't get me wrong, hermes will improve the start-up performance of your application, but... it's a custom engine, will all the caveats of a custom engine, there are some missing parts here and there (at my current company we had to polyfill/patch date/time functions to get our time library luxon to work), it's up to you to realize if it is worth the tradeoff

## 3. flatlists are okish, until they are not
FlatLists are virtualized and that is good, if you have a few hundred elements, once you start talking about thousands, then it breaks down, if you want real performance you need to use a list that re-uses each item component such as [large-list](https://github.com/bolan9999/react-native-largelist) or some other variation that recycles views to keep performance to a maximum

## 4. Beware of images
I've actually fallen and seen other fall into this trap over and over, just because you set an image to be hidden (doesn't matter how, height: 0, visibility: 'hidden', etc), doesn't mean there is no processing going on the background, the computer will still load the image into memory, do all the transformations and adjustments and then apply your styling, a lot of processing power is wasted, I really mean a LOT, rule of thumb is: if you don't need it, exclude the component entirely

```javascript
{!!showImage && <Image source={myCatImage} />}
```

## 5. Very interaction heavy components will never be smooth on JS
Check out [How to trick Mapbox to render any tile set](https://ospfranco.github.io/post/2020/08/04/use-the-mapbox-sdk-to-render-any-tile-set/), no matter how clever you think you are or how hard the JIT works for you, at some point you will hit a hard barrier, in this cases, instead of building your gesture-handler-monster it is a good idea to take a step back and see if you can integrate a more native solution into your app

## 6. Android receives no love (even from google)
This has been actually the hardest hitting point for me in the past 3 years, somethings in android are just WORSE, just one example: the most painful thing I have seen so far is file uploading, let just get this out of the way, if you are trying to build an application that uploads a lot of files in RN, you are going to have a bad time, the moment you try to upload more than 1 - 2 files (or have background uploads), almost all android phones start dying, current standard is [react-native-fetch-blob](https://github.com/joltup/rn-fetch-blob) it made the app experience miserable in my previous apps

There are a few other examples here (ex. react-native-camera) and there of how things can impact the performance on android, just know, you will feel the pain if your app is anything more than just lists, texts and images

## 7. Use Reanimated and lottie
If you are doing something with animations [react-native-reanimated] is the best you can aim for, it takes time to wrap your head on how to work with the API and manipulating native values declaratively but the result it's always buttery smooth.

Same goes for gifs, lower end devices will run hot and kill battery, switching to lottie for static animations has helped me in this cases before

## 8. React navigation has gotten better
but [react-native-navigation](https://github.com/wix/react-native-navigation) by WIX was a lot smoother (at least when I tested it)

## 9. Use a lazy loaded native storage solution
Redux-persist and mobx-persist do the job, but if you want/need to handle thousands of items in your app and want to squeeze the last drop of performance you need to go native, using things like RxDB, WatermelonDb or Realm.js will be by far the biggest performance improvements if your app handles a lot of individual entities
