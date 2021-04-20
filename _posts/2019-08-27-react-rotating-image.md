---
layout: post
title: Rotate React image based on EXIF
excerpt: Web browsers do not automatically rotate images based on their EXIF data, hack around it!
date: 2019-08-27 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
location: Munich
---

When I was working at WerkerApp, I found a bug with images taken on a mobile but displayed in a web browser, for some reason in the year 2018 (at the time) browsers did not automatically rotate images based on their EXIF data.

![Jannis twisted]({{site.url}}/assets/Jannis1.jpeg "Jannis twisted")

So as it seems every other piece of software correctly reads the image orientation EXIF attribute, except web browsers, chrome team has marked this as won’t do, because it would conflict with the w3c specification, and my guess will is, it will be years until all browsers correctly implement this in one way or another, so here we are stuck with workarounds, in any case here is a solution.

## TL:DR

You can use this [snippet](https://gist.github.com/ospfranco/88e57cbac8e3e6c55e9859f096a85281) with the help of a library

### CSS? no good

After some googling I discovered there is a css property called “image-orientation” but it is currently only supported by the latest chrome versions, no good.

### How about a library? well... not really

Living in the wild west that is the JavaScript world I'm sure somebody else must have done it before, so I looked for libraries, there are two options `react-exif-orientation-img` which is a drop in component that replaces the img tag and `blueimp-load-image`, which you use to load the url (or blob or file) and returns a DOM node.

`react-exif-orientation-img` works very well and is very easy to use, however the problem came when we tried to fill a parent container with the image, since all it does is a rotate transform, it never swapped the dimensions, so applying 100% width and 100% height caused the image to overflow the parent container.

The following snippet:

```javascript
public render() {
  {% raw %}
  <ExifOrientationImg markdown="span" src={img} style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
  {% endraw %}
}

```

Produces:

![Jannis twisted]({{site.url}}/assets/Jannis2.jpeg "Jannis twisted")

Maybe this is good enough for your use case, somebody replied to me at some point it has to do with transformations being applied after css or something like that, in any case, doesn't work.

I gave `blueimp-load-image` a go, again getting the image was simple, however the problem came this time with react, since the library is a pure js solution, it doesn’t know anything about react and the virtual DOM, so when I tried to insert it in our component, we got a nice runtime exception.

### Sorta works?

So the problem is you can’t insert a real DOM node in your react virtual DOM, what to do next? Well, let’s just insert it in the real DOM then!

![Jannis twisted]({{site.url}}/assets/Jannis4.jpeg "Jannis twisted")

Still some problems, since this is not a React element it kinda escapes all inline styling you can apply to it, so we need to help from css... ugly, but works

Final code (without base64 conversion)

```javascript
import * as loadImage from 'blueimp-load-image';

private onPressImage = (myImage) => {
  loadImage(myImage, (img) => {
    this.setState({
      imageModalVisible: true,
      selectedImage: attachment,
    });
    img.className = 'fit_to_parent';
    Reactdom.findDOMNode(this.imageCanvas).appendChild(img);
  }, {orientation: true});
}

public render() {
  {% raw %}
  <div markdown="0" style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}} ref={(ref) => this.imageCanvas = ref} />
  {% endraw %}
}
```

### A little improvement

This is all very ugly, but I realized I could generate a base64 string and pass it to the normal <img/> tag, performance with this is (can be? should be?) very slow, if you are dealing with high quantity and high quality images there will be problems, but it does save the hassle of dealing with the DOM.

![Jannis twisted]({{site.url}}/assets/Jannis3.jpeg "Jannis twisted")

Final code with base64 conversion

```javascript
import * as loadImage from 'blueimp-load-image';
...
private onPressImage = (myImage) => {
  loadImage(myImage, (canvas) => {
  this.setState({
    selectedImageBase64: canvas.toDataURL()
  });
  }, {orientation: true});
}
public render() {
  {% raw %}
  <img style={{maxWidth: '100%', maxHeight: '100%'}} src={this.state.selectedImageBase64}/>
  {% endraw %}
}
```

## Conclusion

Now, don't get me wrong, this is an absolute hack and I hate the browser vendors for making me do this to myself and the world.

Most library processing images on the back-end take care of this automatically, but if you simply store the images coming in from the mobile devices, without any processing pipeline, this one will bite you in the arsch, well at least now you have one solution. Cheers.
