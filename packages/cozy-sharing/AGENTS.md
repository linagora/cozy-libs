# cozy-sharing — agent rules

## Keep README.md in sync with the code

The implementation is the behavioral source of truth. `README.md` documents the implemented behavior and usage, and MUST be updated in the same commit/PR whenever the behavior or usage changes.

### When to update the README

- **Feature flags** — a flag is added, removed, renamed, or its default changes → update the "Feature flags" table.
- **Feature behavior or conditions** — a permission rule, a restriction (e.g. `hasSharedParent` / `hasSharedChild`), a link lifecycle step, or a gating condition changes → update the matching "Feature conditions" table.
- **Architecture** — the `ShareModal` routing, a new modal/dialog, or the `SharingProvider` context shape changes → update "Architecture".

### When NOT to update

- Pure refactors with no behavior change.
- Bug fixes that don't change documented behavior.
- Test-only or style-only changes.

### Rule of thumb

If the code and the README disagree after your change, the change is incomplete — fix the README before committing.
