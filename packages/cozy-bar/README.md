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

To hide the home button and its divider on desktop (e.g. in the home app itself), use `noCozyHome`. On mobile, it shows the app title instead of the home button. In both cases, the app title links to the home app:

```jsx
<BarComponent componentsProps={{ BarLeft: { noCozyHome: true } }} />
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
  {/* Your app routes */}
  {BarRoutes.map(BarRoute => BarRoute)}
</Routes>
```

To disable search:

```jsx
<BarComponent searchOptions={{ enabled: false }} />
```

To hide the AI assistant button in the search bar (e.g. when the assistant is already displayed):

```jsx
<BarComponent
  componentsProps={{ BarSearch: { disabledAssistantButton: true } }}
/>
```

## Standalone bar

`dist/standalone.js` is a self-contained bundle (React and every dependency included) for apps that are not Cozy React apps. Load it with a script tag, it exposes `window.TwakeBar`:

```html
<script src="standalone.js"></script>
<script>
  window.TwakeBar.mount({
    appSlug: 'mail',
    appName: 'Twake Mail',
    appIcon: '/icon.svg', // optional, served by the app
    appTextIcon: '/icon-text.svg', // optional, served by the app
    locale: 'fr', // optional, 'en' by default
    theme: 'dark', // optional, the device theme by default
    onLogOut: () => myApp.logOut(), // required unless public
    idToken: '…', // optional, the OIDC id token of the user
    cozyURL: 'https://alice.mycozy.cloud' // required with idToken
  })

  // When the app logs in after mount(), or renews its id token
  window.TwakeBar.setCredentials({
    idToken: '…',
    cozyURL: 'https://alice.mycozy.cloud'
  })

  // Whenever the app language or theme changes
  window.TwakeBar.setLocale('en')
  window.TwakeBar.setTheme('light')
</script>
```

- Every call returns a promise, rejected when the bar cannot load or when the call fails, e.g. `mount()` with an invalid config.
- `mount(config)` prepends a `#cozy-bar` element to the body. The app must reserve its space: `3rem` height, full width.
- `public: true` displays the bar logged out. Otherwise the bar waits for credentials (skeleton avatar) and falls back to logged out after 30 seconds.
- The bar exchanges the id token for a token of the user's Cozy with the cozy-stack `POST /auth/token_exchange` (`exchange_type: 'app'`). The Cozy must accept the id token audience in its `app_token_exchange` config, and the token gets the permissions of the Cozy app it is linked to.
- `mount()` with `idToken` and `cozyURL` exchanges the token right away, and its promise resolves once the bar is logged in. `setCredentials()` does the same after `mount()`: it creates the Cozy client and displays the logged in bar. Calling it again, e.g. with a renewed id token, only updates the token of the existing client. If the first exchange fails, the promise is rejected and the bar is displayed logged out.
- `unmount()` removes the bar, e.g. to give the page its own header back when `mount()` failed.
- `setLocale(locale)` re-renders the mounted bar in another language, without recreating the Cozy client. It is ignored before `mount()`. Supported locales are `en`, `fr`, `ru` and `vi`, others fall back to `en`.
- `setTheme(theme)` does the same with the theme, `light` or `dark`. Locale and theme come from the app, not from `io.cozy.settings`, so the bar always matches it.
- The log out item of the user menu calls `onLogOut`. It is required unless the page is public, since the app owns the session: `mount()` throws without it.
- The bar renders in a shadow root so its styles do not leak into the page and the page styles do not leak into the bar. The only globals added to the document head are the cozy-ui theme variables, scoped to hidden `.TwakeTheme--light|dark` nodes, and the Inter font stylesheet of the stack.

Build it with `yarn build:standalone`, it is also built by `yarn build`.

## License

Cozy Bar is distributed under the MIT license.
