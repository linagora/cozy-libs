# cozy-bar standalone bundle

## Goal

Add a new build target to the `cozy-bar` package that produces a single
autonomous `dist/standalone.js` script, importable via `<script>` tag by
non-React apps like tmail-flutter. The script embeds React and all cozy-bar
dependencies, reads `window.twakeConfig`, instantiates a `CozyClient` with the
access token, and mounts the bar into the DOM.

## Motivation

`cozy-bar` is currently a React component library consumed by Cozy apps that
already host React, a `CozyClient`, and a `CozyProvider`. Non-Cozy hosts
(tmail-flutter is the first) have no React tree, no `CozyClient`, and use a
different auth mechanism (an externally-issued access token instead of cozy
cookies/OAuth). They still want the real cozy-bar UI, so we need a build that
is self-contained: one `<script>` tag, no host-side React, no host-side
client setup.

## `window.twakeConfig` contract

```js
window.twakeConfig = {
  accessToken: string,  // required
  cozyURL: string,      // required — stack URL passed to CozyClient.uri
  appSlug: string,      // optional — bar hides home button / app identity if absent
  appName: string,      // optional — display name shown in the bar
  iconURL: string       // optional — app icon shown in the bar
}
```

### Validation

- If `accessToken` **or** `cozyURL` is missing when the script tries to mount,
  it does nothing this tick. (Polling behavior — see below.)
- If the script gives up after 30s of polling without ever seeing both fields,
  it logs `console.warn('[cozy-bar] window.twakeConfig.accessToken or cozyURL missing after 30s; bar not mounted')`
  and exits.
- `appSlug`, `appName`, `iconURL` are passed through to `BarComponent` as-is.
  If undefined, `BarComponent` already falls back to defaults from the
  `data-cozy` attribute on `[role=application]` (see `src/dom.js`); since the
  standalone build has no `[role=application]` host, those fallbacks return
  `null`/empty and the bar is expected to render without an app icon / home
  button. The implementation verifies this renders without throwing and, if a
  child component crashes on a missing field, patches `standalone.jsx` to pass
  safe defaults (e.g. `appSlug: 'twake'`).

## Polling behavior

On script execution:

1. Call `tryMount()` (attempt #1).
2. If `window.twakeConfig?.accessToken && window.twakeConfig?.cozyURL` are both
   present, mount immediately and stop (clear any pending interval).
3. Otherwise start `setInterval(tryMount, 1000)`.
4. Each interval tick is a new attempt. On attempt #30 (≈30s elapsed since the
   initial call) with no successful mount, `clearInterval` and log the warning
   above.

This means host pages can load the `<script>` tag at any time (head, body,
deferred) and set `window.twakeConfig` whenever — the bar appears within ~1s of
the config becoming available.

`tryMount` is idempotent: if it has already mounted, subsequent calls are
no-ops (the interval is cleared on first successful mount).

## Files added to `cozy-bar`

### 1. `src/standalone.jsx`

The standalone entry. Responsibilities:

- Read `window.twakeConfig`.
- If `accessToken` + `cozyURL` present:
  - Create `const client = new CozyClient({ uri: cozyURL, token: accessToken })`.
  - Prepend `<div id="cozy-bar" role="banner">` to `document.body` so
    `BarComponent`'s `ReactPortal` finds it via `getElementById('cozy-bar')`
    and skips the `[role=application]` code path.
  - Create a hidden root container appended to `document.body`.
  - Call `createRoot(root).render(
      <CozyProvider client={client}>
        <BarProvider>
          <BarComponent
            appSlug={twakeConfig.appSlug}
            appName={twakeConfig.appName}
            iconPath={twakeConfig.iconURL}
            searchOptions={{ enabled: false }}
          />
        </BarProvider>
      </CozyProvider>
    )`.
  - Set a module-level `mounted = true` flag so subsequent `tryMount` calls
    no-op.
- Otherwise: return without doing anything (the interval will retry).

Self-executing; no exports. The polling logic lives at module top-level.

### 2. `rspack.config.mjs`

```js
import path from 'node:path'
import { defineConfig } from '@rspack/cli'
import { Configuration } from '@rspack/core'

export default defineConfig({
  entry: './src/standalone.jsx',
  output: {
    filename: 'standalone.js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'production',
  target: 'web',
  resolve: {
    modules: ['node_modules', path.resolve(__dirname, 'src')],
    extensions: ['.js', '.jsx', '.json']
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: { configFile: './babel.config.rspack.js' }
        }
      },
      {
        test: /\.styl$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'stylus-loader',
            options: {
              stylusOptions: {
                use: [require('cozy-ui/stylus')]
              }
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  performance: { hints: false }
})
```

Notes:

- `resolve.modules` includes `src` to replicate the babel `module-resolver`
  `root: ['./src']` used by the normal build (so `import X from 'components/X'`
  resolves to `src/components/X`).
- All dependencies (React, cozy-client, cozy-ui, cozy-search, etc.) are
  bundled — no `externals`. Bundle size is accepted as 1–2 MB minified.
- `performance.hints: false` because the bundle is intentionally large.

### 3. `babel.config.rspack.js`

```js
module.exports = { presets: ['cozy-app'] }
```

Minimal config for rspack's `babel-loader`. The main `babel.config.js`
(used by the normal `yarn build`) is **not modified** — it keeps
`module-resolver` and `css-modules-transform` for the React-app consumer
build path.

## `package.json` changes (cozy-bar)

- Add devDependencies:
  - `@rspack/cli`
  - `@rspack/core`
  - `babel-loader`
  - `stylus-loader`
  - `css-loader`
  - `style-loader`
- Add script: `"build:standalone": "rspack build --config rspack.config.mjs"`.
- Add `dist/standalone.js` to the `files` array so it ships on npm.
- Existing `build` script (babel → `dist/index.js` + `dist/stylesheet.css`)
  is unchanged and keeps serving React-app consumers.

## Out of scope

- The existing `packages/cozy-bar-standalone` (the minimal custom-element bar)
  is **not touched**. It is a separate, unrelated implementation. Merging or
  removing it is a separate task.
- `BarRoutes` is not mounted — search is disabled by default, so the routes
  are not needed.
- No token refresh / OAuth flow. The host (tmail-flutter) owns the token
  lifecycle and must refresh `window.twakeConfig.accessToken` itself. If the
  token expires, the host updates `window.twakeConfig` and reloads the page
  (or the script). A live `window.cozyBar.setToken(newToken)` API is a future
  enhancement, not part of this design.

## Verification

### Automated

One spec file `src/standalone.spec.jsx` (jsdom, following cozy-bar's existing
jest config):

- `it('mounts the bar when twakeConfig has accessToken and cozyURL')` — sets
  `window.twakeConfig = { accessToken: 'tok', cozyURL: 'http://x' }`, imports
  the entry, asserts `document.querySelector('#cozy-bar')` exists and
  `BarComponent` rendered (use a `data-testid` on the bar root or assert on a
  known cozy-bar class).
- `it('does nothing when twakeConfig is missing')` — leaves `window.twakeConfig`
  undefined, imports the entry, advances jest fake timers past 30s, asserts no
  `#cozy-bar` div was added and `console.warn` was called with the expected
  message.
- `it('mounts when twakeConfig appears after a delay')` — leaves
  `window.twakeConfig` undefined, imports the entry, advances fake timers by
  2s, then sets `window.twakeConfig`, advances 1s more, asserts the bar
  mounted.

`jest.useFakeTimers()` is used to control the `setInterval`. The
`CozyClient` instantiation is mocked via `jest.mock('cozy-client', ...)` to
avoid real network setup in jsdom.

### Manual smoke test

Serve `dist/standalone.js` via a static HTML file with a fake `twakeConfig`
pointing at a dev cozy-stack, confirm the bar renders.

## Risks / open items

- **CSS extraction vs. inline**: the normal build extracts one
  `stylesheet.css` via `css-modules-transform`. The standalone build inlines
  CSS via `style-loader` at runtime (no separate `.css` file to ship). This
  is intentional — the point of standalone is one autonomous script.
- **stylus `cozy-ui/stylus` plugin**: must be passed to `stylus-loader` via
  `stylusOptions.use`. If the plugin's CommonJS shape is incompatible with
  rspack's stylus-loader option format, the build will fail at first run and
  need a small adapter. Flagged here so the implementer knows where to look.
- **Bundle size**: accepted at 1–2 MB. If it becomes a problem for
  tmail-flutter, a follow-up could investigate code-splitting or excluding
  unused cozy-ui components, but that is out of scope.
- **`createRoot` React 18 API**: cozy-bar's devDeps pin `react@18.0.0`, which
  ships `createRoot` from `react-dom/client`. The standalone entry uses this
  API; no compatibility shim needed.
