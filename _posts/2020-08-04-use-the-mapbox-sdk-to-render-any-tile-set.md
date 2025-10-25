---
layout: post
title: How to use the Mapbox SDK to render custom tiles
date: 2020-08-04 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
location: Munich
---

So here is a gem from the past, I won't disclose exactly what it was used for but at a previous job I "hacked" away at the React Native Mapbox SDK, allowing it to render an arbitrary tile set, so here is a small guide for you to do the same.

## But... why?

Well, it's not straightforward to see why this might be a good idea, but first of all: **Performance**, even though current mobile devices (smartphones and tablets) are mighty potent, if you have a large enough image, a device will have trouble rendering it, granted the problem might be barely noticeable on a iPad pro, but not everyone has such devices.

Second is UX, you could very easily write your own component that displays a tile set, wire it together with gesture handlers, as a matter of fact, this was how this component got first implemented, but there are several downsides to this approach, first: you will probably write it in javascript which means it will be slow no matter how clever you are, and second of all, it is particularly difficult to get the UX right, gestures can be finicky, touch tracking can get de-synced

And the third is, you (probably) won't have to maintain it, the mapbox guys (or the google guys, or whoever wrote a low level tile renderer) probably did a better job than you are capable of doing, no offense intended

## The mapbox SDK (on react-native)

So the mapbox SDK on react-native is a wrapper around the iOS SDK and the android SDK, so we should get near native performance with great UX, wiring it is not difficult and you can just follow the readme instructions, once you have that going we have to consider the tile set.

I'm not 100% familiar with the model behind tile sets, as far as I understood you can have tile sets in different sizes, the most common ones are 256x256 and 512x512, I'm not going to go into detail on how you generate your tile set, but it's pretty straight forward, you take your high resolution image and generate a tile at zoom level 0, that is: the entire image needs to fit in 256x256 or 512x512 resolution, then you move to the next zoom level, your break your high resolution image into 4 pieces, each 256 or 512, etc etc

You can see this is a exponential scale so at zoom level 5 you have a few thousand images, and that is why tile renderers are so fast, instead of loading in memory a huge image and trying to push it into the processing pipeline, you only display tiny images that get swapped as the components zooms (obvious, but I thought it needed to be said).

So, I'm going to assume you have the capability to generate a tile set from a high-res image, it doesn't matter much the name of each file you output except that it needs to have: a number for the zoom level, a number for the x position and a number for the y position, for example, `tile-0-0-0.png`, so in the end you should have a folder with all your tiles.

## With tileset and sdk integrated we hack away

Now, here comes the fun part, once you have your tile set and the sdk integrated, is now a matter of putting them together, this is the part that took me some time, you see, the mapbox sdk allows you to specify a custom JSON that can potentially specify a custom location for a tile set, however the documentation for the react-native version is somewhat basic, it is also very finicky on the fields, get one wrong, nothing will work.

**BONUS** we are going to make our tile set to work offline! first you are going to download/add your tileset into your app, if you download it on runtime I strongly advice for you to pack your entire tile set into a ZIP file and download it at once (remember there are thousands of tiles), this increases the download time massively (especially on android), if you include it in your bundle there is no problem.

So once you have your tile set in your device, you will create a url for it:

```javascript
let tilesUrl = "";
if (localDirectory) {
  // We assume that the file has been unpacked to a local directory
  tilesUrl = `file://${localDirectory}/{z}-{x}-{y}.png`;
} else {
  // Dispatching the download job in the background
  FileCacheInstance.fetch([plan.tileUrl]);
  tilesUrl = `file//${downloadsFolder}/{z}-{x}-{y}.png`;
}
```

this is just a snippet you will have to make sure you create it properly depending on the OS, filesystem and library you are using, once that is done, here is where the real magic happens, we create a [mapbox config JSON](https://docs.mapbox.com/mapbox-gl-js/style-spec/):

```javascript
const styleJSON = {
  version: 8,
  name: "MyStyleJSON",
  sources: {
    mapbox: {
      type: "raster",
      tiles: [tilesUrl],
      tileSize: 256, // can also be 512, depending on the size of your tiles
    },
  },
  layers: [
    {
      id: "plan",
      type: "raster",
      source: "mapbox",
    },
  ],
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf", // necessary to output text
};

// Write json file to device storage
await RNFS.writeFile(
  `${RNFS.DocumentDirectoryPath}/${plan.id}-style.json`,
  JSON.stringify(styleJSON),
  "utf8"
);
```

You will see I have written the JSON into a file in the filesystem, this seems to be some idiosincracy of the native SDKs implementation, this also means whenever you want to display a different tile set, you will either have to re-write this file or create a new one.

Finally we can just tell the Mapview to render based on the JSON we created

```javascript
<MapView
  ref={this.mapRef}
  styleURL={`file://${RNFS.DocumentDirectoryPath}/${plan.id}-style.json`}
  logoEnabled={false}
  pitchEnabled={false}
  onRegionIsChanging={this.boundedCheckBoundsFunction}
  onLongPress={this.onLongPress as any}
  onPress={this.onMapPress}
  attributionEnabled={false}
  rotateEnabled={false}
>
```

## Caveats

Now, here is where you can see mabox was not designed to show any random tile set, but specifically geo located tile sets, and that brings a problem if you are displaying some other information, you see, the `onPress` or `onLongPress` handlers will return you longitude, latitude coordinates (in that order, don't ask me why mapbox decided to revert them), but more than likely you will just want pixel coordinates, so I scoured around the internet until I finally found some of the code google maps uses in it's implementation

```javascript
/**
 * Degrees to radians
 * @param degrees
 */
function degToRad(degrees: number) {
  return degrees * (Math.PI / 180);
}

/**
 * Radians to degrees
 * @param rads
 */
function radToDeg(rad: number) {
  return rad / (Math.PI / 180);
}

/**
 * Replace number if it is below min bound or max bound
 * @param val value to bound
 * @param minVal min value
 * @param maxVal max value
 */
function bound(val: number, minVal: number, maxVal: number) {
  let res;
  res = Math.max(val, minVal);
  res = Math.min(val, maxVal);
  return res;
}

/**
 * Point in a simple plane (256x256) to lng/lat system
 * @param oldCoord
 */
// TODO: Translate this to typescript
export function fromLngLatToPoint(lng: number, lat: number, zoom = 0): Point {
  // [x, y]
  const res: Point = [0, 0];
  res[0] = PIXEL_ORIGIN[0] + lng * PIXELS_PER_LONG_DEGREE;

  // Truncating to 0.9999 effectively limits latitude to 89.189. This is
  // about a third of a tile past the edge of the world tile.
  const siny = bound(Math.sin(degToRad(lat)), -0.9999, 0.9999);
  res[1] =
    PIXEL_ORIGIN[1] +
    0.5 * Math.log((1 + siny) / (1 - siny)) * -PIXELS_PER_LONG_RADIAN;

  const numTiles = 1 << zoom;
  res[0] = res[0] * numTiles;
  res[1] = res[1] * numTiles;
  return res;
}

/**
 * Translate point from simple cartesian system to lat/long
 * @param point x, y point in the 256 tile size scheme
 */
export function fromPointToLngLat(point: Point) {
  const newPoint = [...point];
  const numTiles = 1;
  newPoint[0] = newPoint[0] / numTiles;
  newPoint[1] = newPoint[1] / numTiles;
  const lng = (newPoint[0] - PIXEL_ORIGIN[0]) / PIXELS_PER_LONG_DEGREE;
  const latRadians = (newPoint[1] - PIXEL_ORIGIN[1]) / -PIXELS_PER_LONG_RADIAN;
  const lat = radToDeg(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);

  return [lng, lat];
}
```

These functions allow to translate a tap on the "world map" to be translated to a simple coordinate system for your image, so you can correctly place pins and other stuff.

There is one more caveat, because again, mapbox was designed to show a worldmap, the mapview infinitely scrolls on itself, it might not be a big issue but sometimes it is not desired as it might be confusing for the user, unfortunately that seems to be a feature that cannot be turned off on the native SDKs (I think the problem is on iOS to be specific), so one more workaround is to bound the camera not to escape the "map" bounds, it's not perfect but works alright most of the time.

Inside of the `<MapView>` component, you will add a camera component and save a reference to it:

```javascript
<Mapbox.Camera
  ref={this.cameraRef}
  minZoomLevel={orientation === DEVICE_ORIENTATION.portrait ? 0 : 1}
/>
```

and you can create a bounding function that will be run everytime the camera changes position:

```javascript
export const MAPBOX_MAX_BOUNDINGBOX = [
  [170, 90],
  [-170, -90],
];

const TILE_SIZE = 256;
const PIXEL_ORIGIN = [TILE_SIZE / 2, TILE_SIZE / 2];
const PIXELS_PER_LONG_DEGREE = TILE_SIZE / 360;
const PIXELS_PER_LONG_RADIAN = TILE_SIZE / (2 * Math.PI);

/**
 * HIGH ORDER FUNCTION
 * Blocks the user for scrolling pass the map bounds
 * Returns function that you can pass to the onRegionIsChanging call
 * @param cameraRef React ref object to the map instance camera objects
 */
export function limitMapboxBounds(cameraRef: React.RefObject<MapboxGL.Camera>) {
  // There is no available type for mapbox region feature, you are going to have to trust me here
  return (regionFeature: any) => {
    /**
     * Visible bounds is array of to LNG/LAT coordinates
     * [0]: is the north east corner
     * [1]: is the south west corner
     */

    const visibleBounds: any = regionFeature.properties.visibleBounds;

    /**
     * Remember latitude is vertical (ex: germany is in a high positive latitude)
     * and longitue is horizontal (ex: south america is in a negative longitude)
     *
     * We need to disable world wrapping, which is not possible in the RN, ios and android mapbox sdks
     * So this is a very simple proof to prevent the user from scrolling where he is not supposed to
     */
    const ne = visibleBounds[0];
    const sw = visibleBounds[1];

    const maxNe = MAPBOX_MAX_BOUNDINGBOX[0];
    const minSw = MAPBOX_MAX_BOUNDINGBOX[1];

    /**
     * Another remark, only horizontal infinite scrolling is happening, so we only need to check the longitude
     */

    /**
     *  There seems to be a bug in the android library, when scrolling left, the north east corner all of the sudden goes
     * over 180... which of course is impossible on a lat long coordinate system
     */

    if (sw[0] < minSw[0]) {
      const visibleWidth = Math.abs(ne[0] - sw[0]);
      cameraRef.current?.fitBounds(
        [minSw[0], sw[1]],
        [minSw[0] + visibleWidth, ne[1]]
      );
    } else if (ne[0] > maxNe[0] && ne[0] < 300) {
      const visibleWidth = Math.abs(ne[0] - sw[0]);
      cameraRef.current?.fitBounds(
        [maxNe[0], sw[1]],
        [maxNe[0] - visibleWidth, ne[1]]
      );
    }
  };
}
```

this is the `boundedChecksFunction` that I have assigned in the Mapview and it is created on runtime to give it a little bit more of a performance boost:

```javascript
public async componentDidMount() {
  this.boundedCheckBoundsFunction = limitMapboxBounds(this.cameraRef);
  await generateTempMapStyleJSON(this.props.plan);
  this.forceUpdate();
}
```

and that is it, you should now have all the pieces necessary to render any tile set on the mapbox SDK, performant with great UX.
