---
layout: post
title: iOS 14 widgets and react-native
date: 2020-08-14 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
location: Munich
image: assets/BodyFastWidget.png
twitter:
  username: "ospfranco"
  card: "summary_large_image"
  image: "assets/BodyFastWidget.png"
---

Apple announced on WWDC home screen widgets yada yada, you know why you are here, you want to make a iOS home screen widget with your react-native app, read on.

Disclaimer: I'm not a iOS developer, I barely consider myself a react-native developer, so this might not be the best way of doing things, this is just how I got things working

You need to know:
- **You will not be able to do a home screen widget with React-native** I did not bother trying, I read somewhere there is a 15mb memory limit, hoisting an entire context plus runtime of react-native might never be feasible, that being said, iOS 14 widgets are based on SwiftUI and it's pretty dope, you don't need to learn much
- As far as I understood, widgets are not **that programmable** they are basically a timeline of data points that get rendered by OS, so you will have very little control and or ability to do heavily programmatic stuff

## Find yourself a iOS 14 widget tutorial

There is already a couple out there, but basically boils down to:
- Get XCode 12 in your machine, no need for BigSur, Catalina worked fine for me
- Add a new target to your project, search for "widget something something"

Compile your app first as is to see if works, in my case I got a swift compilation error, as it turns out the widget target build settings was embedding an old version of the swift runtime, it got solved by following [this issue](https://github.com/facebook/react-native/issues/29246), basically remove any swift path from the `libraries search paths` in the extension's target `Build Settings`

## You should now be able to add the default widget to your home screen

I won't go into the details of the widget, there is already enough material out there, but now the problem becomes, to communicate between your App and the widget (you can also try siri intents or whatever, never heard of them, don't want to touch them), you basically want to get data from your app and into the widget in the form of a timeline of data points for the OS to render at the appropriate times, in order to do this, you will need to use an AppGroup.

An AppGroup is basically a shared (sand-boxed?) environment between multiple apps, you can create one directly from XCode 12, first add the capability in your project build settings for both targets (the main app and the widget extension), one important note, you need to have owner rights in your apple organization in order to create this group, I had to ask my boss to do it for me.

**Remember to add the capability to BOTH targets**, this will also mean you will need to re-generate your provisioning profiles (and update any CI system you might have)

Give your group a reasonable name, if you try something funny... don't worry, xcode will prepend `group.` for you, so you should have something like `group.com.yourcompany`

You should end-up with something like this:

![Project Settings]({{site.url}}/assets/BodyFastWidget2.png "Project Settings")

## Writing data from the react-native side

The next step is to write to this shared group, you will be able to find some swift code out there, but luckily there is already a [react-native package](https://github.com/KjellConnelly/react-native-shared-group-preferences/tree/master/ios), you just install it and you can start using it.

Don't forget to replace the group name with the identifier you created in the last step, you just pass any JSON object to it, it will save it in the corresponding key.

So... it's worth repeating, widgets are not that powerful, they are basically a view of a single data point, so I suggest you prepare your data accordingly on the RN side, something like:

```javascript
import SharedGroupPreferences from 'react-native-shared-group-preferences'

const appGroupIdentifier = 'group.com.yourcompany'

let myData = {
  datapoints: [
    {foo: 'bar', baz: 'boo', date: '2020-10-10T12:00:00z'},
    // ... more data points come here
  ]
}

SharedGroupPreferences.setItem('myAppData', myData, appGroupIdentifier)
```

## Reading data from your widget

Once that is done you can start on the swift side to read the data your app has created.

If you haven't changed any of the code XCode generated for you, you should be able to modify the `getTimeline` function:

```swift
struct MyObject: Decodable {
  datapoints: DataPoint

  struct DataPoint: Decodable {
    foo: string,
    baz: string,
    date: string
  }
}

func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
    let sharedDefaults = UserDefaults.init(suiteName: "group.com.yourcompany")
    var entries: [SimpleEntry] = []
    if sharedDefaults != nil {
      let aValue = sharedDefaults!.value(forKey: "myData") as! String
      if aValue != nil {
        let decoder = JSONDecoder()
        let data = aValue.data(using: .utf8)

        if let parsedData = try? decoder.decode(MyObject.self, from: data!) {
          let currentDate = Date()

          parsedData.periods.forEach { period in
            let entryDate = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate)!
            entries.append(SimpleEntry(date: entryDate, start: period.start, end: period.end))
          }
        } else {
          print("Could not parse data")
        }

      }
    }


    let timeline = Timeline(entries: entries, policy: .atEnd)
    completion(timeline)
}

struct SimpleEntry: TimelineEntry {
    let date: Date
  let start: String
  let end: String
}
```

NOTE: This is not my actual code nor the code perfect for the example, use your head, you need to parse the ISO date you wrote into your structure, etc.

Basically:
- Read the UserDefaults object from the shared group we created before
- Get the data (which has been encoded in string form)
- Decode into an object
- Create a timeline of said objects

As a side note and important for you to know, the final objects you put on the `Timeline` struct, need to comply with the `TimelineEntry` protocol, basically it needs to have a date field of type `Date` and that is it.

## Learn SwiftUI, call it a day
You can then play around with SwiftUI to display your object in whatever way you please, here is some placeholder code:

```swift
struct widgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
      VStack {
        Spacer()
        HStack {
          Spacer()
          ZStack {
            Circle()
              .fill(Color.white)
              .frame(width: 110, height: 110)
            Circle()
              .fill(Color.green)
              .frame(width: 80, height: 80)
          }
          Text(entry.start)
          Text(entry.end)
          Spacer()
        }
        Spacer()
      }
        .background(Color.green)
    }
}
```

That gives me:

![iOS14 widget]({{site.url}}/assets/BodyFastWidget.png "iOS14 widget")

Cheers! you now have a iOS 14 widget for your react-native app, follow me on [twitter](https://twitter.com/ospfranco) or even better buy a copy of [Tempomat](https://tempomat.dev)