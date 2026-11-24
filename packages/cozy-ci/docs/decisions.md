# Decisions

Decisions taken on cozy-ci, oldest first. Append only: a decision that changes gets a new entry that replaces the old one and cites it. Entry format: the `twake-decisions` skill of [linagora/twake-guidelines](https://github.com/linagora/twake-guidelines/blob/main/skills/twake-decisions/SKILL.md).

Categories: UX, UI, Product, Architecture, Infra, Tech.

## 2026-11-24, \[Infra] The packages are published from the CI with npm trusted publishing

- Decision: the packages are published by the `Publish` job of `.github/workflows/ci-cd.yml` through npm trusted publishing (OIDC), in the `npm` GitHub environment on master, with no npm token.
- Decided by: Théo Poizat (maintainer), in a Claude Code session on 2026-11-24, [linagora/cozy-libs#3263](https://github.com/linagora/cozy-libs/pull/3263)
- Why: npm recommends trusted publishing over tokens, and the other libs move to it (linagora/twake-libs#67, linagora/twake-ui#255).
- Scope: every package of the monorepo (`packages/*`, `config/*`). Recorded here for lack of a log at the repo root.

## 2026-11-24, \[Infra] A release is versioned, then published from the state of the registry

- Decision: the release runs `lerna version`, then `lerna publish from-package`, and a manual run of the workflow on master publishes the versions that a failed release left unpublished.
- Decided by: agent ([linagora/cozy-libs#3263](https://github.com/linagora/cozy-libs/pull/3263)), to be confirmed by Théo Poizat
- Why: lerna pushes the tags before it publishes and does not check the npm access first, so running `lerna publish` again could not finish a failed release.
- Scope: every package of the monorepo.

## 2026-11-24, \[Infra] The repository field of each package names linagora/cozy-libs and its directory

- Decision: every `package.json` sets `repository.url` to `git+https://github.com/linagora/cozy-libs.git` and `repository.directory` to the folder of the package.
- Decided by: agent ([linagora/cozy-libs#3263](https://github.com/linagora/cozy-libs/pull/3263)), to be confirmed by Théo Poizat
- Why: under trusted publishing lerna publishes with provenance, and npm rejects a publish whose provenance does not match `repository.url`.
- Scope: every package of the monorepo; a new package needs it before its first release.
