# cozy-bar standalone bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a self-contained `dist/standalone.js` build target to the `cozy-bar` package that any non-React host can load via `<script>` tag; it reads `window.twakeConfig`, instantiates a `CozyClient`, and mounts the real cozy-bar into the DOM with React + all deps bundled.

**Architecture:** A new `src/standalone.jsx` entry composes the existing `BarComponent` (unchanged) inside a `CozyProvider` + `BarProvider`, wrapping `createRoot` from `react-dom/client`. A new rspack build (`rspack.config.mjs`) bundles from `src/` with React, cozy-client, cozy-ui, and stylus CSS all inlined; a minimal `babel.config.rspack.js` keeps the main babel build path untouched. A jest spec exercises the polling/mount logic with fake timers and a mocked `CozyClient`.

**Tech Stack:** React 18.0.0 (already in cozy-bar devDeps), cozy-client, cozy-ui, cozy-ui-plus, cozy-search, twake-i18n, rspack (`@rspack/cli` + `@rspack/core`), babel-loader, stylus-loader, css-loader, style-loader, jest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-06-18-cozy-bar-standalone-design.md`

**Key reference facts (verified against the codebase):**
- `CozyClient` accepts `{ uri, token }` and forwards to `stackClient.setUri` / `setToken` — `node_modules/cozy-client/dist/CozyClient.js:329-333`.
- `BarComponent`'s `ReactPortal` checks `document.getElementById('cozy-bar')` first; only if missing does it fall back to `createWrapperAndAppendToBody`, which requires `[role=application]`. Pre-creating `<div id="cozy-bar">` bypasses that requirement — `src/components/BarComponent.jsx:49-69`.
- `CozyProvider` is exported by `cozy-client` — `node_modules/cozy-client/dist/index.js:34,183`.
- cozy-bar's local `react-dom@18.0.0` ships `react-dom/client` with `createRoot` — `packages/cozy-bar/node_modules/react-dom/client.js`.
- babel `module-resolver` with `root: ['./src']` makes `import X from 'components/X'` resolve to `src/components/X` — replicated in rspack via `resolve.modules`.
- babel preset `cozy-app` uses classic React runtime (React must be in scope for JSX).
- Existing jest config at `packages/cozy-bar/jest.config.js` uses jsdom, `moduleDirectories: ['node_modules', 'src']`, mocks `cozy-client`, `.styl`/`.css` → `identity-obj-proxy`. Reuse it.
- Existing test helpers: `test/lib/BarLike.jsx` (wraps with `CozyProvider` + `BreakpointsProvider` + `I18n`); `test/jestLib/setup.js` (mocks `cozy-search`, `cozy-ui-plus/dist/AppIcon`, `AppLinker`, `CozyTheme`).
- The `index.spec.jsx` pattern for mocking `cozy-client`: `jest.mock('cozy-client', () => ({ ...jest.requireActual('cozy-client'), useQuery: jest.fn()..., RealTimeQueries: () => null, useInstanceInfo: jest.fn()... }))`.

---

### Task 1: Add standalone entry — `src/standalone.jsx`

**Files:**
- Create: `packages/cozy-bar/src/standalone.jsx`

- [ ] **Step 1: Write the failing test for the happy-path mount**

Create `packages/cozy-bar/src/standalone.spec.jsx` with this exact content:

```jsx
import React from 'react'

import { BarLike } from '../test/lib/BarLike'

jest.mock('cozy-client', () => {
  const actual = jest.requireActual('cozy-client')
  return {
    ...actual,
    CozyProvider: actual.CozyProvider,
    useQuery: jest.fn().mockReturnValue({ data: [], fetchStatus: 'loaded' }),
    RealTimeQueries: () => null,
    useInstanceInfo: jest.fn().mockReturnValue({
      isLoaded: true,
      diskUsage: { data: { used: 0 } },
      instance: { data: {} },
      context: { data: {} }
    }),
    useFetchHomeShortcuts: jest.fn().mockReturnValue({ data: [], fetchStatus: 'loaded' })
  }
})

describe('cozy-bar standalone entry', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    document.body.innerHTML = ''
    delete window.twakeConfig
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('mounts the bar when twakeConfig has accessToken and cozyURL', async () => {
    window.twakeConfig = {
      accessToken: 'tok-123',
      cozyURL: 'http://cozy.localhost:8080',
      appSlug: 'tmail',
      appName: 'Twake Mail',
      iconURL: 'https://example.com/icon.png'
    }

    await import('./standalone')

    // Flush React effects
    jest.advanceTimersByTime(0)

    const barEl = document.getElementById('cozy-bar')
    expect(barEl).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `packages/cozy-bar`):
```bash
yarn jest src/standalone.spec.jsx
```
Expected: FAIL — module `./standalone` does not exist.

- [ ] **Step 3: Write the minimal `standalone.jsx`**

Create `packages/cozy-bar/src/standalone.jsx`:

```jsx
import React from 'react'
import { createRoot } from 'react-dom/client'

import CozyClient, { CozyProvider } from 'cozy-client'

import { BarComponent } from './components/BarComponent'
import { BarProvider } from './components/BarProvider'

const MOUNT_WARN =
  '[cozy-bar] window.twakeConfig.accessToken or cozyURL missing after 30s; bar not mounted'

let mounted = false
let intervalId = null
let attempts = 0

const tryMount = () => {
  if (mounted) return

  attempts += 1

  const cfg = window.twakeConfig
  if (!cfg || !cfg.accessToken || !cfg.cozyURL) {
    if (attempts >= 30) {
      if (intervalId) clearInterval(intervalId)
      // eslint-disable-next-line no-console
      console.warn(MOUNT_WARN)
    }
    return
  }

  mounted = true
  if (intervalId) clearInterval(intervalId)

  const client = new CozyClient({ uri: cfg.cozyURL, token: cfg.accessToken })

  const barHost = document.createElement('div')
  barHost.setAttribute('id', 'cozy-bar')
  barHost.setAttribute('role', 'banner')
  document.body.prepend(barHost)

  const root = document.createElement('div')
  document.body.appendChild(root)

  createRoot(root).render(
    <CozyProvider client={client}>
      <BarProvider>
        <BarComponent
          appSlug={cfg.appSlug}
          appName={cfg.appName}
          iconPath={cfg.iconURL}
          searchOptions={{ enabled: false }}
        />
      </BarProvider>
    </CozyProvider>
  )
}

tryMount()
if (!mounted) {
  intervalId = setInterval(tryMount, 1000)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
yarn jest src/standalone.spec.jsx
```
Expected: PASS. If it fails because `BarComponent` throws on missing optional fields (e.g. `appSlug` undefined), check the error — the spec calls for patching `standalone.jsx` with safe defaults. If `appSlug` is required by a child, change the `appSlug` line to:
```jsx
appSlug={cfg.appSlug || 'twake'}
```
Re-run until green.

- [ ] **Step 5: Commit**

```bash
git add packages/cozy-bar/src/standalone.jsx packages/cozy-bar/src/standalone.spec.jsx
git commit -m "feat(cozy-bar): add standalone entry that mounts the bar from window.twakeConfig"
```

---

### Task 2: Add the missing-config timeout test

**Files:**
- Modify: `packages/cozy-bar/src/standalone.spec.jsx`

- [ ] **Step 1: Add the failing test**

Append inside the `describe('cozy-bar standalone entry', ...)` block (after the happy-path `it`), before the closing `})`:

```jsx
  it('does nothing and warns when twakeConfig is missing after 30s', async () => {
    await import('./standalone')

    // Advance past the initial attempt + 29 interval ticks (30 total)
    jest.advanceTimersByTime(30000)

    expect(document.getElementById('cozy-bar')).toBe(null)
    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      '[cozy-bar] window.twakeConfig.accessToken or cozyURL missing after 30s; bar not mounted'
    )
  })
```

- [ ] **Step 2: Run the test to verify it fails or passes**

Run:
```bash
yarn jest src/standalone.spec.jsx
```
Expected: If it FAILS, the warning message or the 30-attempt boundary is off. Re-check `standalone.jsx`: `attempts` starts at 0, increments to 1 on the initial synchronous `tryMount()`, then 2..30 across 29 interval ticks. `advanceTimersByTime(30000)` fires 30 ticks (1 per second), so total attempts reach 31. The check `attempts >= 30` triggers on attempt 30. Adjust the assertion's `advanceTimersByTime` or the `>= 30` comparison until the test reflects actual behavior. Re-run until PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/cozy-bar/src/standalone.spec.jsx
git commit -m "test(cozy-bar): cover standalone missing-config timeout"
```

---

### Task 3: Add the delayed-config mount test

**Files:**
- Modify: `packages/cozy-bar/src/standalone.spec.jsx`

- [ ] **Step 1: Add the failing test**

Append inside the `describe` block:

```jsx
  it('mounts when twakeConfig appears after a delay', async () => {
    await import('./standalone')

    // 2s passes with no config — should be 2 failed attempts
    jest.advanceTimersByTime(2000)
    expect(document.getElementById('cozy-bar')).toBe(null)

    // Now config appears
    window.twakeConfig = {
      accessToken: 'tok-late',
      cozyURL: 'http://cozy.localhost:8080'
    }

    // Next tick (1s) should mount
    jest.advanceTimersByTime(1000)

    expect(document.getElementById('cozy-bar')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run the test to verify it passes**

Run:
```bash
yarn jest src/standalone.spec.jsx
```
Expected: PASS. If it fails, verify `tryMount` clears the interval after mounting and that `window.twakeConfig` is read fresh on each tick (not captured at module load).

- [ ] **Step 3: Commit**

```bash
git add packages/cozy-bar/src/standalone.spec.jsx
git commit -m "test(cozy-bar): cover standalone delayed twakeConfig mount"
```

---

### Task 4: Add minimal babel config for rspack

**Files:**
- Create: `packages/cozy-bar/babel.config.rspack.js`

- [ ] **Step 1: Write the file**

Create `packages/cozy-bar/babel.config.rspack.js`:

```js
module.exports = {
  presets: ['cozy-app']
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/cozy-bar/babel.config.rspack.js
git commit -m "chore(cozy-bar): add minimal babel config for rspack standalone build"
```

---

### Task 5: Add rspack config

**Files:**
- Create: `packages/cozy-bar/rspack.config.mjs`

- [ ] **Step 1: Write the config**

Create `packages/cozy-bar/rspack.config.mjs`:

```js
import path from 'node:path'

import { defineConfig } from '@rspack/cli'

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
- `resolve.modules` includes `src` so `import X from 'components/X'` resolves the same way the babel `module-resolver` plugin does in the normal build.
- `stylusOptions.use` passes the `cozy-ui/stylus` plugin — matches `preprocess.js:3` in the existing build.
- No `externals` — React, cozy-client, cozy-ui etc. are all bundled.

- [ ] **Step 2: Commit**

```bash
git add packages/cozy-bar/rspack.config.mjs
git commit -m "chore(cozy-bar): add rspack config for standalone bundle"
```

---

### Task 6: Add build deps and scripts to package.json

**Files:**
- Modify: `packages/cozy-bar/package.json`

- [ ] **Step 1: Add devDependencies**

Edit `packages/cozy-bar/package.json`. In the `devDependencies` object, add these keys (preserve existing alphabetical-ish order; no trailing commas per project prettier config):

```json
    "@rspack/cli": "^1.2.7",
    "@rspack/core": "^1.2.7",
```

Add to the bottom of `devDependencies` (these are new, not duplicates):

```json
    "babel-loader": "^9.1.2",
    "css-loader": "^6.10.0",
    "style-loader": "^3.3.4",
    "stylus-loader": "^8.1.0"
```

Versions match `cozy-external-bridge`'s rspack range where applicable; the loaders are recent stable majors. If `yarn install` reports conflicts with the monorepo's pinned versions, fall back to the lowest version that installs cleanly and note it in the commit body.

- [ ] **Step 2: Add the `build:standalone` script**

In `scripts`, add after `"build:watch"`:

```json
    "build:standalone": "rspack build --config rspack.config.mjs",
```

- [ ] **Step 3: Ship `dist/standalone.js` on npm**

Change the `files` array from:
```json
  "files": [
    "dist"
  ],
```
to:
```json
  "files": [
    "dist",
    "rspack.config.mjs",
    "babel.config.rspack.js"
  ],
```
The whole `dist/` directory is already shipped (which will include `standalone.js` once built); the extra entries let consumers rebuild standalone from source if they pin a git URL. If you prefer to ship only the built artifact, leave `files` as `["dist"]` and drop the config files.

- [ ] **Step 4: Install deps and verify the JSON is valid**

Run from repo root:
```bash
yarn install
```
Expected: install completes; cozy-bar's new devDeps are added to `yarn.lock`. If there's a peer-dep warning about `babel-loader`/`react` peer ranges, note it but proceed — standalone doesn't run in the app's React tree.

Then validate the package.json:
```bash
node -e "require('./packages/cozy-bar/package.json')" && echo OK
```
Expected: prints `OK`.

- [ ] **Step 5: Commit**

```bash
git add packages/cozy-bar/package.json yarn.lock
git commit -m "chore(cozy-bar): add rspack + loaders devDeps and build:standalone script"
```

---

### Task 7: Build the standalone bundle and smoke-test it

**Files:** (none — verification only)

- [ ] **Step 1: Run the build**

From `packages/cozy-bar`:
```bash
yarn build:standalone
```
Expected: `dist/standalone.js` is produced. If the build fails:
- Stylus plugin shape mismatch → the `stylusOptions.use` array may need a function wrapper or the `cozy-ui/stylus` export may need `.default`. Check `node_modules/cozy-ui/stylus.js` (or `package.json` `exports`) for the exact export shape and adjust `rspack.config.mjs` accordingly.
- Babel preset not found → confirm `babel-preset-cozy-app` is resolvable from `packages/cozy-bar` (it's a monorepo devDep).
- `Cannot find module 'components/X'` → confirm `resolve.modules` includes the absolute `src` path; print it with `console.log(path.resolve(__dirname, 'src'))` if needed.

- [ ] **Step 2: Confirm the bundle is self-contained**

```bash
ls -lh packages/cozy-bar/dist/standalone.js
```
Expected: file exists, 1–2 MB. Smaller would suggest deps were externalized — re-check `rspack.config.mjs` for stray `externals`.

- [ ] **Step 3: Static HTML smoke test**

Create a throwaway `standalone-smoke.html` in the package root (do NOT commit):

```html
<!doctype html>
<html>
  <head><meta charset="utf-8"><title>cozy-bar standalone smoke</title></head>
  <body>
    <h1>Host app content</h1>
    <script>
      window.twakeConfig = {
        accessToken: 'fake-token-for-smoke',
        cozyURL: 'http://cozy.localhost:8080',
        appSlug: 'tmail',
        appName: 'Twake Mail',
        iconURL: 'https://example.com/icon.png'
      }
    </script>
    <script src="./dist/standalone.js"></script>
  </body>
</html>
```

Open it in a browser (file:// is fine — no server needed for a quick check). Expected: the bar DOM appears at the top of `<body>` inside `<div id="cozy-bar" role="banner">`. Network calls to `cozy.localhost:8080` will fail (no stack running) — that's fine; the point is the bar mounts and renders its shell UI without throwing.

If the bar throws immediately on the failed network call, wrap the `createRoot(...).render(...)` call in `standalone.jsx`'s `tryMount` with a `try/catch` that logs and clears `mounted = false` so a later retry can re-attempt. Re-run the test suite if you change `standalone.jsx`.

- [ ] **Step 4: Clean up the smoke test file**

```bash
rm -f packages/cozy-bar/standalone-smoke.html
```

- [ ] **Step 5: Commit if anything changed**

If you patched `standalone.jsx` for network-failure resilience or `rspack.config.mjs` for the stylus plugin, commit those fixes:
```bash
git add -A packages/cozy-bar
git commit -m "fix(cozy-bar): harden standalone mount against initial stack errors"
```
Otherwise no commit — the artifacts are already produced.

---

### Task 8: Lint, full test run, final commit

**Files:** (none — verification only)

- [ ] **Step 1: Run the package's full test suite**

From `packages/cozy-bar`:
```bash
yarn test
```
Expected: all tests pass, including the 3 new `standalone.spec.jsx` cases.

- [ ] **Step 2: Run lint**

From repo root:
```bash
yarn lint
```
Expected: no new errors. If eslint flags `standalone.jsx` (e.g. unused `React` import with the classic runtime — it's required, so it shouldn't), fix and re-run.

- [ ] **Step 3: Run the monorepo's package-constraints check**

From repo root:
```bash
node scripts/check-packages-constraints.js
```
Expected: passes. If it complains about the new devDeps (e.g. disallowed packages), follow the existing convention to allow them or pin to an allowed version.

- [ ] **Step 4: Commit any lint/test fixes**

If any fix was needed:
```bash
git add -A packages/cozy-bar
git commit -m "test(cozy-bar): align standalone tests with lint rules"
```
Otherwise skip — no empty commit.

---

## Self-Review notes

- **Spec coverage:**
  - `twakeConfig` contract + validation → Task 1 (`standalone.jsx`) + Task 2 (missing-config timeout test).
  - Polling behavior (initial call + 1s interval, 30s give-up, idempotent) → Task 1 implementation + Tasks 2 & 3 tests.
  - `src/standalone.jsx` file with `CozyClient`, `CozyProvider`, `BarProvider`, `BarComponent`, `createRoot`, pre-created `#cozy-bar` div, `searchOptions={{ enabled: false }}`, optional `appSlug`/`appName`/`iconPath` → Task 1.
  - `rspack.config.mjs` with `resolve.modules`, stylus/css/jsx rules, no externals, `performance.hints: false` → Task 5.
  - `babel.config.rspack.js` minimal → Task 4.
  - `package.json` devDeps + `build:standalone` script + `files` → Task 6.
  - Verification (automated + smoke) → Tasks 1–3 (jest) and Task 7 (smoke).
  - Out-of-scope items (cozy-bar-standalone untouched, no token refresh, no `BarRoutes`) → not addressed by any task, as intended.
- **Placeholder scan:** no TBD / "implement later" / "similar to Task N" present. Every code step contains the actual code.
- **Type/name consistency:** `tryMount`, `mounted`, `intervalId`, `attempts`, `MOUNT_WARN` used consistently across the implementation in Task 1 and referenced by tests in Tasks 2 & 3. `window.twakeConfig` shape consistent throughout. `CozyProvider`, `BarProvider`, `BarComponent`, `createRoot` import paths all verified against the codebase.
