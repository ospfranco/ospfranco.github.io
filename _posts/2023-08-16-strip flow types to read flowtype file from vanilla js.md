---
layout: post
title: Strip flow types to read flowtype file from vanilla JS
date: 2023-08-16 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.JPG
---

Unlike Typescript where you have tools like ts-node that allow you to quickly run typescript files without tooling (think without webpack or metro), I found however no way to achieve this with FlowType.

I needed to use a translation file that had flow types in vanilla JS and I figured out a way to strip the types.

## Install flow remove types package

```jsx
yarn add flow-remove-types
```

## Use flow remove types

In my use case I had a huge file with translations that is strongly typed and I wanted to migrate them to another format.

The process is basically:

1. Read file from disk
2. Pass it to flow-remove-types
3. Write to another file (or you can also load it in memory with another package `require-from-string`)
4. import it normally

Here is a part of the script I used:

```js

// allows you to call this file like a script from the command line
#!/usr/bin/env node

let flowRemoveTypes = require('flow-remove-types');
// let translations = require('../src/I18n/translations') // cannot import it bc it contains flow types
let fs = require('fs');

function unpackTranslation(translationObj, key) {
  if(translationObj[key]) {
    return translationObj[key]
  }

  const res = {}
  Object.entries(translationObj).forEach(entry => {
    res[entry[0]] = unpackTranslation(entry[1], key)
  })

  return res

}

// Start by taking the translations file and stripping flow out of it
let translationsInput = fs.readFileSync('../src/I18n/translations.js', 'utf8');

// Remove flow and module export with traditional syntax
let translationsOutput = flowRemoveTypes(translationsInput).toString().replace('export default TRANSLATIONS', 'module.exports = TRANSLATIONS')

fs.writeFileSync('./translations.js', translationsOutput);

// then we can just read this file
const translations = require('./translations');

let languages = ['en', 'it', 'pt', 'fr', 'es', 'de']
let keys = JSON.parse(fs.readFileSync('./webAppTranslationKeys.json'))


languages.forEach((languageKey) => {
  // let languageTranslations = JSON.parse(fs.readFileSync(`../webapp/public/locales/${languageKey}/translation.json`))
  let languageTranslations = {}
  keys.forEach(key => {
    const ogTranslation = translations[key]

    if(!ogTranslation) {
      console.log('🛑 Could not find translations for', key)
      process.exit(1)
    }

    languageTranslations[key] = unpackTranslation(ogTranslation, languageKey)
  })
  fs.writeFileSync(`../webapp/public/locales/${languageKey}/translation.json`, JSON.stringify(languageTranslations, null, 2))
})

// Delete auto generated file
fs.unlinkSync('./translations.js')

console.log('✅ Generated webapp translations')
```