# Decisions

Decisions taken on rslint-config-cozy-app, oldest first. Append only: a decision that changes gets a new entry that replaces the old one and cites it. Entry format: the `twake-decisions` skill of [linagora/twake-guidelines](https://github.com/linagora/twake-guidelines/blob/main/skills/twake-decisions/SKILL.md).

Categories: UX, UI, Product, Architecture, Infra, Tech.

## 2026-11-25, \[Tech] Imports with extensions are an opt-in preset

- Decision: the rule `node/file-extension-in-import` is the opt-in preset `rslint-config-cozy-app/node-esm`, out of `basics` and `react`. Packages published as ES modules that Node loads as is add it to their config.
- Decided by: Crash-- (CTO), 2026-11-25, after [linagora/twake-libs#87](https://github.com/linagora/twake-libs/pull/87)
- Why: Node refuses a relative import without its extension ([linagora/twake-ui#274](https://github.com/linagora/twake-ui/issues/274)), but the apps bundled by rsbuild import without extensions on purpose: in the default config the rule would flag hundreds of their imports for nothing.
- Scope: `node-esm.js`; the library repos (twake-libs, twake-ui) use it in place of declaring the rule.
