# Contributing to @maxivo/sdk

## Setup

```
corepack enable
pnpm install          # also installs the git hooks (husky)
pnpm test
```

## Rules

- Branch from `main`; open a PR into `main`. Direct pushes to `main` are blocked.
- Commit messages follow Conventional Commits (`feat: …`, `fix: …`, `docs: …`, `chore: …`). The `commit-msg` hook checks this.
- The `pre-commit` hook runs ESLint and Prettier on staged files; `pre-push` runs typecheck and tests.
- Every change to the published package needs a changeset: `pnpm changeset`.
- Keep the public API backwards compatible within a major version. Breaking changes need a `major` changeset and a migration note in the README.
- Coverage must stay at or above the thresholds in `vitest.config.ts` (CI fails otherwise).

## Releasing

Merging to `main` makes the release workflow open or update a **Version Packages** PR. Merging that PR bumps the version, updates `CHANGELOG.md` and publishes to npm using the `NPM_TOKEN` repository secret.
