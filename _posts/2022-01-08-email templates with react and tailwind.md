---
layout: post
title: Email templates with React and Tailwind
date: 2022-01-08 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/preview.jpg
---

Sending emails is basic SaaS 101, however it always feel broken to me. Instead of using the same tools I used to develop my apps, I always ended up importing a different framework, we used to use one many years ago with Java, on Node we used handlebars, this is just one more link of complexity in the modern tech stack.

I didn't want to go down that path one more time, so I spend some time trying to answer one question: can I create a email template using only React and Tailwind (with my existing configuration) and the answer is: YES! well, mostly...

## Render a React component to plain HTML Markup

The first part of this question was the easiest to answer, how to turn a React component into raw html string:

```ts
// unfortunately no type information for this module
// @ts-ignore
import ReactDOMServer from "react-dom/server";

const TestMail = () => {
  return (
    <html>
      // important to keep the color scheme on some email clients
      {/* <meta name="color-scheme" content="only"></meta> */}
      <head>// We will use this later</head>
      <div className="py-3">Hi I am a react component</div>
    </html>
  );
};

const emailHtml = ReactDOMServer.renderToStaticMarkup(<TestMail />);
```

This will take a React component and render it as a plain HTML markup, you can see I have a tailwind class in there `py-3`, unfortunately if you take a look inside the html, you will see it has not been transpiled, so we need to run this html through an inliner to it inlines all the classes as embedded style props in the html.

This was the tricky part, there are some frameworks that try to solve this exact problem, like maizzle for example, but just by reading the home page I already see an ocean of complexity, so early in my googling I stumbled upon [Mailwind](https://github.com/soheilpro/mailwind), the instructions were scant, but it was exactly what I wanted, it works based on [Juice](https://github.com/Automattic/juice), not going to bore you with the details, here is the snippet that makes it work:

```ts
import juice from "juice";

export async function juicify(html: string): Promise<string> {
  return new Promise((resolve, reject) => {
    juice.juiceResources(
      html,
      {
        webResources: {
          relativeTo: "public/",
        },
      },
      (err, processed) => {
        if (err) {
          reject(new Error(`Could not juice email${err}`));
        }

        resolve(processed);
      }
    );
  });
}
```

You also need to update the email component to include a stylesheet in the head tag:

```ts
<head>
  {/* eslint-disable-next-line @next/next/no-css-tags */}
  <link href="mailwind.css" rel="stylesheet" data-inline />
</head>
```

> You can already see that you need to import mailwind.css file and make it accessible somewhere in your project, on the juicify function the `relativeTo` path, will allow juice to correctly determine where to fetch the .css file

And TA-DA you have working email templates with React and Tailwind, no need for complex framework, configuration files, etc. The juicify function will output a raw string, which you can send to your email distributor and it should work just fine.

## The caveat

Now there is one small caveat here, which is the mailwind.css file, it's not going to be your application styles, some of the changes are good, for example everything being based on px styles, but you might need your own colors, or paddings, etc.

TBH this is where I stopped because this is good enough for me, but if you really need your own styles, I figure this is not too hard to achieve, you basically need to tell tailwind to process your `tailwind.config.js` and spit out a `.css` file, shouldn't be too hard, the small details of PX units I have not tried, but I think that should also be fixable. For me I only had to add 2 - 3 classes with some extra fill colors, and I can live with that.
