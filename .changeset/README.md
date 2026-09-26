# Changesets

Every PR that changes the published package adds a changeset: run `pnpm changeset`, pick patch / minor / major, and write one line for the changelog. On merge to `main`, the release workflow opens a "Version Packages" PR; merging that PR publishes to npm.
