---
layout: post
title: React Native, how to set up fonts with a single canonical name
date: 2023-08-11 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.JPG
---

Dealing with fonts in React Nativeis painful, iOS uses the canonical name, while android uses file names. This leads to most developers wrapping the `<Text>` component in some custom component that sets the `fontFamily` style in some logic to detect the correct name in iOS and Android. We can however fix this and use a single canonical name. Like this:

```tsx
<Text
	style={ {
		fontFamily: 'Raleway',
		fontWeight: '600'
	}}
>
	Hello
</Text>
```

iOS already takes the canonical name, but we need to help Android.

# Download the fonts

Download your font family, you should get all the files in a folder (we will call ours `./raleway`):

```
`Raleway-Thin.ttf` (100)
`Raleway-ThinItalic.ttf`
`Raleway-ExtraLight.ttf` (200)
`Raleway-ExtraLightItalic.ttf`
`Raleway-Light.ttf` (300)
`Raleway-LightItalic.ttf`
`Raleway-Regular.ttf` (400)
`Raleway-Italic.ttf`
`Raleway-Medium.ttf` (500)
`Raleway-MediumItalic.ttf`
`Raleway-SemiBold.ttf` (600)
`Raleway-SemiBoldItalic.ttf`
`Raleway-Bold.ttf` (700)
`Raleway-BoldItalic.ttf`
`Raleway-ExtraBold.ttf` (800)
`Raleway-ExtraBoldItalic.ttf`
`Raleway-Black.ttf` (900)
`Raleway-BlackItalic.ttf`
```

### Find the font family name

> You will need otfinfo installed in your system to perform this step. It is shipped with many Linux distributions. On MacOS, install it via `lcdf-typetools` brew package.
> 

```bash
otfinfo --family Raleway-Regular.ttf
```

Should print "Raleway". This value must be retained for the Android setup. This name will be used in React `fontFamily` style.

# Android

For Android, we are going to use [XML Fonts](https://developer.android.com/guide/topics/ui/look-and-feel/fonts-in-xml) to define variants of a base font family.

> Remark: This procedure is available in React Native since commit fd6386a07eb75a8ec16b1384a3e5827dea520b64 (7 May 2019 ), with the addition of ReactFontManager::addCustomFont method.
> 

### 1. Copy and rename assets to the resource font folder

```bash
mkdir android/app/src/main/res/font
cp ./raleway/*.ttf android/app/src/main/res/font
```

We must rename the font files following these rules to comply with Android asset names restrictions:

- Replace `-` with `_`;
- Replace any uppercase letter with its lowercase counterpart.

You can use the below bash script (make sure you give the font folder as first argument):

```bash
#!/bin/bash
# fixfonts.sh

typeset folder="$1"if [[ -d "$folder" && ! -z "$folder" ]]; then
  pushd "$folder";
  for file in *.ttf; do
    typeset normalized="${file//-/_}";
    normalized="${normalized,,}";
    mv "$file" "$normalized"  done
  popd
fi
```

```
./fixfonts.sh /path/to/root/FontDemo/android/app/src/main/res/font
```

### 2. Create the definition file

Create the `android/app/src/main/res/font/raleway.xml` file with the below content. Basically, we must create one entry per `fontStyle` / `fontWeight` combination we wish to support, and register the corresponding asset name.

```
<?xml version="1.0" encoding="utf-8"?>
<font-family xmlns:app="http://schemas.android.com/apk/res-auto">
    <font app:fontStyle="normal" app:fontWeight="100" app:font="@font/raleway_thin" />
    <font app:fontStyle="italic" app:fontWeight="100" app:font="@font/raleway_thinitalic"/>
    <font app:fontStyle="normal" app:fontWeight="200" app:font="@font/raleway_extralight" />
    <font app:fontStyle="italic" app:fontWeight="200" app:font="@font/raleway_extralightitalic"/>
    <font app:fontStyle="normal" app:fontWeight="300" app:font="@font/raleway_light" />
    <font app:fontStyle="italic" app:fontWeight="300" app:font="@font/raleway_lightitalic"/>
    <font app:fontStyle="normal" app:fontWeight="400" app:font="@font/raleway_regular" />
    <font app:fontStyle="italic" app:fontWeight="400" app:font="@font/raleway_italic"/>
    <font app:fontStyle="normal" app:fontWeight="500" app:font="@font/raleway_medium" />
    <font app:fontStyle="italic" app:fontWeight="500" app:font="@font/raleway_mediumitalic"/>
    <font app:fontStyle="normal" app:fontWeight="600" app:font="@font/raleway_semibold" />
    <font app:fontStyle="italic" app:fontWeight="600" app:font="@font/raleway_semibolditalic"/>
    <font app:fontStyle="normal" app:fontWeight="700" app:font="@font/raleway_bold" />
    <font app:fontStyle="italic" app:fontWeight="700" app:font="@font/raleway_bolditalic"/>
    <font app:fontStyle="normal" app:fontWeight="800" app:font="@font/raleway_extrabold" />
    <font app:fontStyle="italic" app:fontWeight="800" app:font="@font/raleway_extrabolditalic"/>
    <font app:fontStyle="normal" app:fontWeight="900" app:font="@font/raleway_black" />
    <font app:fontStyle="italic" app:fontWeight="900" app:font="@font/raleway_blackitalic"/>
</font-family>
```

### 3. Register the new font

In `android/app/src/main/java/com/fontdemo/MainApplication.java`, bind the font family name with the asset we just created inside `onCreate` method.

> ⚠️ If you are registering a different font, make sure you replace "Raleway" with the name found in the former step (find font family name).
> 

```diff
import com.facebook.react.ReactApplication;
 import com.facebook.react.ReactInstanceManager;
 import com.facebook.react.ReactNativeHost;
 import com.facebook.react.ReactPackage;
+import com.facebook.react.views.text.ReactFontManager;
 import com.facebook.soloader.SoLoader;
 import java.lang.reflect.InvocationTargetException;
 import java.util.List;

public class MainApplication extends Application implements ReactApplication {
   @Override
   public void onCreate() {
     super.onCreate();
+    [ReactFontManager.getInstance().addCustomFont(this, "Raleway", R.font.raleway);](https://www.notion.so/Locio-6a09ff579fbc4cb6aaf5cff020ef8df0?pvs=21)
     SoLoader.init(this, /* native exopackage */ false);
     initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
   }

```

# iOS

On iOS, things will get much easier. We will basically just need to use React Native asset link functionality. This method requires that we use the font family name retrieved in the first step as `fontFamily` style attribute.

### Copy font files to assets folder

```
mkdir -p assets/fonts
cp /tmp/raleway/*.ttf assets/fonts
```

### Add `react-native.config.js`

```
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./assets/fonts'],
};
```

### Link

```
npx react-native-asset
```

You can remove assets for android generated with this command, since we are using the XML Font method. Otherwise, they would be included twice in the app bundle!

`rm -rf android/app/src/main/assets/fonts`

# Setting a default global font

After the fonts are installed one can simply define a global default font by installing `react-native-simple-default-props`:

```diff
yarn add react-native-simple-default-props
```

Then on app start:

```tsx
import setDefaultProps from 'react-native-simple-default-props';

setDefaultProps(Text, {
  style: {
    fontFamily: 'Raleway',
    color: '#0F0F26',
  },
});
```

Now you can simply use any `<Text/>`component without the need for any semantic wrapper!

# Credits

Credit to [https://github.com/jsamr/react-native-font-demo](https://github.com/jsamr/react-native-font-demo#goal) for finding the xml fonts setup. 

[https://github.com/dioi2000/react-native-simple-default-props](https://github.com/dioi2000/react-native-simple-default-props#readme) for the easy setup of default styles.
