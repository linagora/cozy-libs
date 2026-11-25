# Cozy libs

> Sharing Helpers for Cozy Application Development

## Libraries

- [Cozy Device Helper](./packages/cozy-device-helper): To know more information about the device platform
- [Cozy Doctypes](./packages/cozy-doctypes): Tools for working with shared doctypes
- [Cozy Flags](./packages/cozy-flags): Client side feature flags
- [Cozy Interapp](./packages/cozy-interapp): Allows applications to interact with each other
- [Cozy Realtime](./packages/cozy-realtime): Be notified via websocket when something happens on the Cozy

## Dev tools

- [Babel Preset Cozy App](./config/babel-preset-cozy-app): Config for babel transpiling (for applications and libraries)
- [Cozy Commitlint Config](./config/commitlint-config-cozy): Commitlint config enforcing the cozy commit convention
- [Cozy Browserslist Config](./config/browserslist-config-cozy): Browserslist config enforcing the official Cozy supported browsers
- [ESLint Config Cozy App](./config/eslint-config-cozy-app): Config for eslint using prettier (for applications and libraries)
- [Remark Preset Cozy](./config/remark-preset-cozy): Remark config for markdown linting
- [Rslint Config Cozy App](./config/rslint-config-cozy-app): Config for Rslint and rs fmt (for applications and libraries)
- [Renovate Config Cozy](./config/renovate-config-cozy): Renovate config for dependency updates
- [Renovate Config Cozy Libs](./config/renovate-config-cozy-libs): Renovate config for libraries
- [Cozy Logger](./packages/cozy-logger): Logs message in a human friendly way while developing and logs in JSON when in production. It can be used by konnectors, services alike, and web apps.

## CLI

- [Cozy CI](.packages/cozy-ci): Utility scripts for Cozy Cloud CI integration
- [Cozy App Publish](./packages/cozy-app-publish): Publish an application/konnector to the Cozy Cloud registry

## Publishing

The CI publishes the packages: each push to master versions the changed
packages from the commits (`lerna version`), then publishes them
(`lerna publish from-package`) in the `Publish` job of `.github/workflows/ci-cd.yml`.

The job authenticates to npm with
[trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC): there is
no npm token. It runs in the `npm` GitHub environment, on master only.

lerna pushes the version commit and the tags before it publishes, and publishes
the packages one by one: a failed release can leave only some of them published.
Run the `CI/CD` workflow by hand on master (`Run workflow`) before anything else
is merged: it publishes the versions missing from the registry. Otherwise the
next release does it, and a package changed in between gets a new version while
its failed one stays unpublished.

The manual run only finishes the npm publish. If the job failed after pushing
the tags and before creating the GitHub releases, create them by hand from the
tags.

When master moves while a run is in progress, that run releases nothing: lerna
warns `EBEHIND` and stops, the job stays green, and the run of the newer commit
releases the changes of both.

A new package must exist on npm and have a trusted publisher before its first
merge to master, or the publish fails at that package and leaves the release
partly published. Do the two steps below, then finish the release with the
manual run:

1. Publish a `0.0.0` placeholder by hand: set the version to `0.0.0` locally (do
   not commit it) and run `npm publish`.
2. On npmjs.com, add a trusted publisher to the package: `linagora` /
   `cozy-libs` / `ci-cd.yml` / environment `npm`, with "Allow npm publish"
   checked. The configuration expires unless the package is released within 2 days.

Its `package.json` needs a `repository` field with
`"url": "git+https://github.com/linagora/cozy-libs.git"` and its `directory`:
npm rejects a publish whose provenance does not match it.

## Note

- To run unit tests of a package, as some packages may be required for testing, you must first build the cozy-libs packages by running `yarn build`.

## Deleted packages

- cozy-mespapiers-lib : lib has been merged again in [mespapiers](https://github.com/cozy/mespapiers) in 2024. Last commit where it exists in this repo: `b49bd1f6b71446235b2c5a702a13584765787ce8`. [Removal PR](https://github.com/cozy/cozy-libs/pull/2641).
- cozy-scanner : lib was used for qualifications that are now in [cozy-client](https://github.com/cozy/cozy-client). Last commit where it exists in this repo: `cd79f20a4c2e807ec57893548594e2a5f430eba7`. [Removal PR](https://github.com/cozy/cozy-libs/pull/2649).
- cozy-authentication : lib was used for our Cordova apps that have been replaced by the flagship app in React Native. Last commit where it exists in this repo: `de46949c3e4f85e262786f71ec9e4a5699ec319b`. [Removal PR](https://github.com/cozy/cozy-libs/pull/2650).
- webpack-expose-package-info-plugin : lib was unused. Last commit where it exists in this repo: `af2b4b48c01544820dd385be5914f6fd42ae72e5`. [Removal PR](https://github.com/cozy/cozy-libs/pull/2654).
- repo-doctor : tool was unused. Last commit where it exists in this repo: `66bcc84b56eae4f65a302775790b6095179f7fe7`. [Removal PR](https://github.com/cozy/cozy-libs/pull/2952).
- playgrounds : unused. Last commit where it exists in this repo: `903c7bf0d6a3bc1dac8e94f707eadbd2f3672026`. [Removal PR](https://github.com/cozy/cozy-libs/pull/2978).
- cozy-procedures : unused. Last commit where it exists in this repo: `777482ef292f014fe535f9654d18677557266682`. [Removal PR](https://github.com/cozy/cozy-libs/pull/2978).
