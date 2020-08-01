---
layout: post
title: How to draw vector graphics on react-native (macOS) with d3 and without SVG or Canvas
date: 2020-08-01 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
location: Munich
image: assets/ARTGraph.png
twitter:
  username: "ospfranco"
  card: "summary_large_image"
  image: "assets/ARTGraph.png"
---

First of all, this would not be possible without [this great post](https://hswolff.com/blog/react-native-art-and-d3/) by Harry Wolff.

So, I'm currently in the middle of developing a Zettelkasten app for macOS, and basically I needed to draw a graph simulation that shows the connections between the notes/links, it's a fairly straightforward task and I do not need to write any math code, since it is all abstracted via [d3 force simulation](https://github.com/d3/d3-force).

The problem however is that I'm using react-native-macos, and while it's a great tool for the very short time it has existed, one of the major pain points is the lack of support of existing libraries, all the current libraries need to be ported/enabled to run on macOS.

Unfortunately this meant I could not use react-native-svg to draw my graphics, since support hasn't been added yet (and it might never do, but who knows)

Now when I reached this point, I was ready to give up and try to somehow generate a html and pass it to a react-native-webview (it does support rn macos), but out of casuality I ran accross [react-ART](https://github.com/reactjs/react-art), after I asked if which were the possibilities to draw vector graphics on the official rn-macos repo, it seemed the only sane choice.

So here is a quick premier on how to draw vector graphics on react-native without using any external library (ART is still bundled in the latest versions) on react-native (macOS)

## ART != SVG, but it does output to it

So ReactART is its own library, while I might have a similar API to other vector drawing libraries, it's not a 1 to 1 equivalence, it does however support passing a SVG path to it and rendering it.

Before we start you need to link the ART library to your project, even though it is included in the node_modules/react-native directory, it is not linked by default.

you can either do it via Cocoapods (add the ReactART dependency pointing to `../nodes_modules/react-native/ART`) or manually link the library (Add files to project, link with binaries, etc), not gonna go into to much detail here, if you ever linked a library you know what to do.

## Simple example

Once you have ART linked, you should be able to do a simple vector graphic test:

```javascript
import React from 'React'
import {ART} from 'react-native'

let {Surface, Shape, Path} = ART

export const Foo = () => {
  let line = new Path()
  line.moveTo(0, 0)
  line.lineTo(100, 100)
  return (
    <Surface width={100} height={100}>
      <Shape d={line} stroke="#000" strokeWidth={1}>
    </Surface>
  )
}
```

You should see a line that crosses from topleft corner to the bottomright corner

## Off to the races... almost!

So now that we are able to draw some graphics it's time to draw our graph, for that we are going to use D3 force simulation, now this is the part that was a bit hard for me to understand, most of the documentation you are going to find outthere lets d3 take care of manipulating the svg elements and the dom, since this is react-native there is no dom, so we're going to have to go around it a bit.

Another thing to take into account, in the original article Harry creates all the shapes in d3 and then turns them into paths for ART to render, but I find this step cumbersome (at least for this use case), so I just create the shapes myself as you will see.

And one last thing, I'm quite ambivalent with the use of hooks, when the use case is "simple" (that is, it's easy to reason in a declarative manner) I believe they provide a lot of value, but in this case I struggled quite a bit trying to re-bind the corresponding functions as my data got updated, at some point I grew tired and realized it is not worth my time, therefore for this simulation I'm using a class component, feel free to create a hook version of it.

Ok, so now we can start, let's first create our component and the simulation that will be in charge of the calculations:

```javascript
export class Graph extends React.Component {
  // any object will do, I put an id there for some application logic
  // since they represent another structure, you want to use that id
  // to later show text or other stuff
  graphNodes = [{ id: `1` }, { id: `2` }];
  // the links of the graph, source and target are needed and they don't point
  // to the ids, but rather to the indexes
  graphLinks = [{ source: 0, target: 1 }];
  simulation;

  constructor(props: any) {
    super(props);

    // Use a closure to bind to context
    // no need to mess around with the state (or hooks)
    // the force simulation will write into the original values
    // we just need to render each tick
    const ticked = () => {
      this.forceUpdate();
    };

    this.simulation = d3
      .forceSimulation(graphNodes)
      .force(`charge`, d3.forceManyBody().strength(-200))
      .force(`link`, d3.forceLink(graphLinks))
      .force(`x`, d3.forceX())
      .force(`y`, d3.forceY())
      .on(`tick`, ticked);
  }
}
```

This is also what took me a while to understand, it doesn't really matter which objects do you pass to the force simulation, if necessary it will inject/create all the necessary properties to run it's simulation, now, on a lot of the code/tutorials outthere you see a lot of d3 funky manipulation (add groups, modify the `cx` and `cy` proprety) but actually none of this is needed, the force simulation will already inject all the properties and since we will render the thing ourselves then our job is pretty much done with d3 (we still need to handle updates)

So now we will render the output of the force simulation, on our render function:

```javascript
render() {
  let {graphNodes, graphLinks} = this.state
  let NODE_RADIUS = 6
  return (
    <Surface width={400} height={400}>
          {graphLinks.map((link: any, ii: number) => {
            let line = new Path()
            line.moveTo(link.source.x + 200, link.source.y + 200)
            line.lineTo(link.target.x + 200, link.target.y + 200)
            return (
              <Shape
                d={line}
                stroke={linkColor}
                strokeWidth={1}
                key={`line-${ii}`}
              />
            )
          })}
          {graphNodes.map((node: any, ii: number) => {
            // This is how you draw a circle in ART
            const circle = new Path()
              .arc(0, NODE_RADIUS * 2, NODE_RADIUS)
              .arc(0, NODE_RADIUS * -2, NODE_RADIUS)

            return (
              <Shape
                fill={nodeColor}
                d={circle}
                x={node.x + 200}
                y={node.y + 196}
                key={`circle-${ii}`}
              />
            )
          })}
        </Surface>
  )
}

```

Notice I have given the surface a height and a width of 400, the force simulation will start at 0, therefore it is only a matter of adding the center of the surface (x: 200, y: 200) as an offset to "center" our graph

So it's pretty straightforward, you use the ART api to "draw" the shape (instead of using d3 as originally posted) and then simply pass it to the Shape component of ART.

Now there are some limitations to the ART library, basically there is no way to capture touches, so it's not a perfect replacement for react-native-svg or other drawing libraries, but it does allow to get the job done, in this case doing a graph visualization

on every tick of the force simulation, the component will be re-rendered and you will get a fluid animation, here is a bit more complete implementation and how it looks like in my app:

![ART Graph]({{site.url}}/assets/ARTGraph.png "ART Graph")

## Handling updates

There is one more point that I haven't touched yet, which is handling updates to your data and the truth is... it's not quite working well enough for me at the moment, so that is why I left it for last

You could take the lazy route and re-initialize everything and let the force simulation run from the beginning, but I would like to keep the graph nodes in the same position and let the any new node just pop and squeeze itself (it helps with spacial information), here is what I got so far:

```javascript
componentWillReceiveProps({links}: IProps) {
    let {links: oldLinks} = this.props
    // just some performance optimization
    if (links.length === oldLinks.length) {
      return
    }

	  // stop the simulation from ticking while we are updating the values
    this.simulation.stop()

    let newGraphNodes = []
    let newGraphLinks = []

    let jj = 0
    for (let ii = 0; ii < links.length; ii++) {
      // iterate over the old array, remove any value that is not present
      // insert any new nodes
      // why? because we want to keep existing x, y information
      if (jj < graphNodes.length) {
        if (links[ii].id === graphNodes[jj].id) {
          newGraphNodes.push(graphNodes[jj])
        }
        jj++
      } else {
        newGraphNodes.push({x: 0, y: 0, id: links[ii].id})
      }

      // generate new newGraphLinks
      // TODO here you need to generate your graph links one more time
    }

    this.simulation
      .nodes(newGraphNodes)
      .force(`link`, d3.forceLink(newGraphLinks))
      .restart()

		this.graphNodes = newGraphNodes
  	this.graphLinks = newGraphLinks
  }

	// To prevent annoying warnings if your component has been unmounted
	// and the simulation is still running
  componentWillUnmount() {
    this.simulation.stop()
  }
```

There it is, you should now be able to draw vector graphics on rn without the need for other library, if you need interactivity... can't be done for now, but hopefully someone will port the svg package soon for macOS.

Cheers
