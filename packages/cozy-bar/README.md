[![Travis build status shield](https://img.shields.io/travis/com/cozy/cozy-bar)](https://travis-ci.org/cozy/cozy-bar)
[![NPM release version shield](https://img.shields.io/npm/v/cozy-bar.svg)](https://www.npmjs.com/package/cozy-bar)
[![NPM Licence shield](https://img.shields.io/npm/l/cozy-bar.svg)](https://github.com/cozy/cozy-bar/blob/master/LICENSE)

# \[Cozy]\[] Bar Library

## What's Cozy?

![Cozy Logo](https://cdn.rawgit.com/cozy/cozy-guidelines/master/templates/cozy_logo_small.svg)

\[Cozy]\[] is a platform that brings all your web services in the same private space.  With it, your webapps and your devices can share data easily, providing you with a new experience. You can install Cozy on your own hardware where no one's tracking you.

## What's CozyBar ?

The CozyBar is a banner on the top of your application, responsible of cross-apps navigation, user facilities, intents, etc. This is a React component.

## Getting started

The library requires your markup to contain an element with `role=application`. The DOM of the banner will be added before this element.

### Installation

1. Add the package

```sh
yarn add cozy-bar
```

2. Add the CSS

```jsx
import 'cozy-bar/dist/stylesheet.css'
```

### How to use

You need to include the `BarComponent` into your react tree :

```jsx
import { BarComponent } from 'cozy-bar'

<BarComponent />
```

The `BarComponent` will get default params into `data-cozy` attribute of the element `role=application`. You can still customize this parameter through props:

- `appName`: The name of the app.
- `appNamePrefix`: The prefix of the app. Originally used for apps maintained by Cozy Cloud teams.
- `appSlug`: The slug of the app.
- `iconPath`: The path to the app icon. Defaults to a blank GIF

There is also other parameter to adapt the bar to your app:

- `isPublic`: To show the public version of the Bar
- `onLogout`: A callback to react to the logout of the user

## Customizing the content of the bar

From within your app, you can decide to take over certain areas of the cozy-bar. This might especially be useful on mobile where the area it occupies is prime real estate — we generally don't recommend to use this option on larger screen resolutions.

The bar is divided in 4 areas that you can control individually : left, center, search and right:

![cozy-bar-triplet](https://user-images.githubusercontent.com/2261445/33609298-de4d379e-d9c7-11e7-839d-f5ab6155c902.png)

To do this, you need to wrap your `BarComponent` into an `BarProvider` after your can use component to modify component inside :

```jsx
import { BarLeft, BarCenter, BarRight, BarSearch } from 'cozy-bar'

// then, somewhere in a render function below the BarProvider
<BarLeft>
  <div>Hello!</div>
</BarLeft>
```

## Search and AI assistant

Search and AI assistant is now proposed by the cozy-bar. They are enabled by default so you need to:

1. Setup the search

In the app using the cozy-bar :

- cozy-dataproxy-lib must be installed
- DataProxyProvider must be added before BarProvider
- If you want to use the AI assistant, you need to add [the following permissions](https://github.com/cozy/cozy-libs/tree/master/packages/cozy-search#prerequisite-for-ai-components)

2. Add the routes

These routes allow to display the search and AI assistant dialogs.

```jsx
import { BarRoutes } from 'cozy-bar'

<Routes>
  // Your routes
  // ...

  {BarRoutes.map(BarRoute => BarRoute)}
</Routes>
```

3. You can still disabled the search

```jsx
<BarComponent searchOptions={{ enabled: false }} />
```

## Change theme bar

It's possible to update theme on the cozy-bar with `setTheme` function using the bar context

```jsx
import { useBarContext } from 'cozy-bar'

const { setTheme } = useBarContext()

setTheme('default')
setTheme('primary')
```

## Debugging

It is possible to activate the logger from the bar by activating the flag 'bar.debug'.
Then you have to reload the page.

```
flag(bar.debug, true)
```

## Development mode

- Then, follow these steps:

`$ yarn link` // in cozy-bar

`$ rlink cozy-bar` // in the cozy-app

`$ yarn start` // in cozy-bar

`$ yarn start` // in the cozy-app
