[![NPM release version shield](https://img.shields.io/npm/v/cozy-bar.svg)](https://www.npmjs.com/package/cozy-bar)
[![NPM Licence shield](https://img.shields.io/npm/l/cozy-bar.svg)](https://github.com/cozy/cozy-libs/blob/main/packages/cozy-bar/LICENSE)

# Cozy Bar

## What's Cozy?

![Cozy Logo](https://cdn.rawgit.com/cozy/cozy-guidelines/master/templates/cozy_logo_small.svg)

[Cozy](https://cozy.io/) is a platform that brings all your web services in the same private space. With it, your webapps and your devices can share data easily, providing you with a new experience. You can install Cozy on your own hardware where no one's tracking you.

## What's Cozy Bar?

The Cozy Bar is a banner at the top of your application, responsible for cross-apps navigation, user facilities, intents, etc. This is a React component.

## Getting started

The library requires your markup to contain an element with `role=application`. The bar DOM will be inserted before this element.

### Installation

1. Add the package

```sh
yarn add cozy-bar
```

2. Add the CSS

```jsx
import 'cozy-bar/dist/stylesheet.css'
```

### Usage

Place the `BarComponent` in your React tree:

```jsx
import { BarComponent } from 'cozy-bar'

<BarComponent />
```

`BarComponent` reads default configuration from the `data-cozy` attribute on the `[role=application]` element.

## Customizing the content of the bar

From within your app, you can take over certain areas of the cozy-bar. This is especially useful on mobile where the area it occupies is valuable — we generally don't recommend this on larger screen resolutions.

The bar is divided in 4 areas that you can control individually: left, center, search and right.

![cozy-bar-triplet](https://user-images.githubusercontent.com/2261445/33609298-de4d379e-d9c7-11e7-839d-f5ab6155c902.png)

First wrap your app in a `BarProvider`, then use the slot components:

```jsx
import { BarProvider, BarLeft, BarCenter, BarRight, BarSearch, BarComponent } from 'cozy-bar'

<BarProvider>
  <BarLeft>
    <div>My custom content</div>
  </BarLeft>
  <BarRight>
    <button>Menu</button>
  </BarRight>
  <BarComponent />
</BarProvider>
```

Available slots:

- `<BarLeft>` — Replaces the default app title and home button
- `<BarCenter>` — Inserts content in the center of the bar
- `<BarSearch>` — Replaces the default search / AI assistant area
- `<BarRight>` — Replaces the default help link, apps menu and user menu

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
  {/* Your app routes */}
  {BarRoutes.map(BarRoute => BarRoute)}
</Routes>
```

To disable search:

```jsx
<BarComponent searchOptions={{ enabled: false }} />
```

## License

Cozy Bar is distributed under the MIT license.
