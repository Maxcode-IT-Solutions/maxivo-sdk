---
title: Releasing
---

# Releasing (maintainers)

1. Every PR that changes the published package adds a changeset: `pnpm changeset`. Pick `patch` for fixes, `minor` for new features, and `major` for breaking changes.
2. When the PR merges into `main`, the **Release** workflow opens or updates the **Version Packages** PR. That PR bumps `package.json` and writes `CHANGELOG.md`.
3. When the Version Packages PR merges, the workflow publishes to npm with provenance, tags `vX.Y.Z` and creates the GitHub release.
4. The **Docs** workflow redeploys this site on every push to `main`.

## Secrets

`NPM_TOKEN` is a granular npm access token for the `maxivo` account. It needs read and write access to `@maxivo/*` and has "bypass 2FA" enabled. Rotate it every 90 days in npm, then update the repository secret.

## Breaking changes

Avoid them within a major version. If one is unavoidable, add a `major` changeset and write a migration section in the changeset text. That text becomes the changelog entry.
