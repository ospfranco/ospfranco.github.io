---
layout: post
title: Add gap support to Native Wind 2.x.x
date: 2023-08-21 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.JPG
---

I'm a big fan of Tailwind CSS. On React Native I use Nativewind.

There is however a small problem with the 2.X.X version of Nativewind, it doesn't support the `gap` property, which was added on RN 0.70.

We can however patch this functionality (without using the unstable 3.x.x branch).

Add the following to `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */

const plugin = require("tailwindcss/plugin");

module.exports = {
  content: ["./App.tsx", "./src/**/*.{ts,tsx}"],
  theme: {
    g: ({ theme }) => theme("spacing"), // ADD THIS FUNCTION
    extend: {
      colors: {
        lightPurple: "#6360EB",
        darkPurple: "#001448",
      },
    },
  },
  plugins: [
    plugin(function ({ matchUtilities, theme }) {
      // ADD THIS PLUGIN
      matchUtilities(
        {
          g: (value) => ({
            gap: value,
          }),
        },
        { values: theme("g") }
      );
    }),
  ],
};
```

# Use patch-package to patch the list of supported properties

Internally Nativewind maintains a list of supported properties, and gap is not among them, so we are going to have to `patch-package` it. Create a patch `nativewind+2.0.11.patch` file in your `patches` directory, with the following content:

```diff
diff --git a/node_modules/nativewind/dist/postcss/to-react-native/is-invalid-property.js b/node_modules/nativewind/dist/postcss/to-react-native/is-invalid-property.js
index 7d7715b..56472bc 100644
--- a/node_modules/nativewind/dist/postcss/to-react-native/is-invalid-property.js
+++ b/node_modules/nativewind/dist/postcss/to-react-native/is-invalid-property.js
@@ -1,120 +1,121 @@
-"use strict";
-Object.defineProperty(exports, "__esModule", { value: true });
-exports.isInvalidProperty = void 0;
+'use strict'
+Object.defineProperty(exports, '__esModule', {value: true})
+exports.isInvalidProperty = void 0
 function isInvalidProperty(property) {
-    return !validProps.has(property);
+  return !validProps.has(property)
 }
-exports.isInvalidProperty = isInvalidProperty;
+exports.isInvalidProperty = isInvalidProperty
 const validProps = new Set([
-    "alignContent",
-    "alignItems",
-    "alignSelf",
-    "aspectRatio",
-    "backfaceVisibility",
-    "backgroundColor",
-    "borderBottomColor",
-    "borderBottomEndRadius",
-    "borderBottomLeftRadius",
-    "borderBottomRightRadius",
-    "borderBottomStartRadius",
-    "borderBottomWidth",
-    "borderColor",
-    "borderEndColor",
-    "borderEndWidth",
-    "borderLeftColor",
-    "borderLeftWidth",
-    "borderRadius",
-    "borderRightColor",
-    "borderRightWidth",
-    "borderStartColor",
-    "borderStartWidth",
-    "borderStyle",
-    "borderTopColor",
-    "borderTopEndRadius",
-    "borderTopLeftRadius",
-    "borderTopRightRadius",
-    "borderTopStartRadius",
-    "borderTopWidth",
-    "borderWidth",
-    "bottom",
-    "color",
-    "direction",
-    "display",
-    "elevation",
-    "end",
-    "flex",
-    "flexBasis",
-    "flexDirection",
-    "flexGrow",
-    "flexShrink",
-    "flexWrap",
-    "fontFamily",
-    "fontSize",
-    "fontStyle",
-    "fontVariant",
-    "fontWeight",
-    "height",
-    "includeFontPadding",
-    "justifyContent",
-    "left",
-    "letterSpacing",
-    "lineHeight",
-    "margin",
-    "marginBottom",
-    "marginEnd",
-    "marginHorizontal",
-    "marginLeft",
-    "marginRight",
-    "marginStart",
-    "marginTop",
-    "marginVertical",
-    "maxHeight",
-    "maxWidth",
-    "minHeight",
-    "minWidth",
-    "opacity",
-    "overflow",
-    "overlayColor",
-    "padding",
-    "paddingBottom",
-    "paddingEnd",
-    "paddingHorizontal",
-    "paddingLeft",
-    "paddingRight",
-    "paddingStart",
-    "paddingTop",
-    "paddingVertical",
-    "position",
-    "resizeMode",
-    "right",
-    "rotation",
-    "scaleX",
-    "scaleY",
-    "shadowColor",
-    "shadowOffset",
-    "shadowOpacity",
-    "shadowRadius",
-    "start",
-    "textAlign",
-    "textAlignVertical",
-    "textDecorationColor",
-    "textDecorationLine",
-    "textDecorationStyle",
-    "textShadowColor",
-    "textShadowOffset",
-    "textShadowRadius",
-    "textTransform",
-    "tintColor",
-    "top",
-    "transform",
-    "transformMatrix",
-    "translateX",
-    "translateY",
-    "width",
-    "writingDirection",
-    "zIndex",
-    /* SVG Props */
-    "fill",
-    "stroke",
-    "strokeWidth",
-]);
+  'alignContent',
+  'alignItems',
+  'alignSelf',
+  'aspectRatio',
+  'backfaceVisibility',
+  'backgroundColor',
+  'borderBottomColor',
+  'borderBottomEndRadius',
+  'borderBottomLeftRadius',
+  'borderBottomRightRadius',
+  'borderBottomStartRadius',
+  'borderBottomWidth',
+  'borderColor',
+  'borderEndColor',
+  'borderEndWidth',
+  'borderLeftColor',
+  'borderLeftWidth',
+  'borderRadius',
+  'borderRightColor',
+  'borderRightWidth',
+  'borderStartColor',
+  'borderStartWidth',
+  'borderStyle',
+  'borderTopColor',
+  'borderTopEndRadius',
+  'borderTopLeftRadius',
+  'borderTopRightRadius',
+  'borderTopStartRadius',
+  'borderTopWidth',
+  'borderWidth',
+  'bottom',
+  'color',
+  'direction',
+  'display',
+  'elevation',
+  'end',
+  'flex',
+  'flexBasis',
+  'flexDirection',
+  'flexGrow',
+  'flexShrink',
+  'flexWrap',
+  'fontFamily',
+  'fontSize',
+  'fontStyle',
+  'fontVariant',
+  'fontWeight',
+  'height',
+  'includeFontPadding',
+  'justifyContent',
+  'left',
+  'letterSpacing',
+  'lineHeight',
+  'margin',
+  'marginBottom',
+  'marginEnd',
+  'marginHorizontal',
+  'marginLeft',
+  'marginRight',
+  'marginStart',
+  'marginTop',
+  'marginVertical',
+  'maxHeight',
+  'maxWidth',
+  'minHeight',
+  'minWidth',
+  'opacity',
+  'overflow',
+  'overlayColor',
+  'padding',
+  'paddingBottom',
+  'paddingEnd',
+  'paddingHorizontal',
+  'paddingLeft',
+  'paddingRight',
+  'paddingStart',
+  'paddingTop',
+  'paddingVertical',
+  'position',
+  'resizeMode',
+  'right',
+  'rotation',
+  'scaleX',
+  'scaleY',
+  'shadowColor',
+  'shadowOffset',
+  'shadowOpacity',
+  'shadowRadius',
+  'start',
+  'textAlign',
+  'textAlignVertical',
+  'textDecorationColor',
+  'textDecorationLine',
+  'textDecorationStyle',
+  'textShadowColor',
+  'textShadowOffset',
+  'textShadowRadius',
+  'textTransform',
+  'tintColor',
+  'top',
+  'transform',
+  'transformMatrix',
+  'translateX',
+  'translateY',
+  'width',
+  'writingDirection',
+  'zIndex',
+  'gap',
+  /* SVG Props */
+  'fill',
+  'stroke',
+  'strokeWidth',
+])
```

> Actually we only need to add gap to the list, but my formatter cleaned everything and I'm too lazy to clean it :)

Afterwards you can run `yarn` again for the patch to take effect, restart the packager (maybe with --reset-cache) and you can now use the gap property via `g-[n]` utilities.
