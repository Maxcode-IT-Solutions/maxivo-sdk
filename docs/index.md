# Maxivo SDK

The official SDK for **Maxivo CMS**. It lets any Next.js site show blogs written and translated in Maxivo, and refresh them the moment they are published.

```bash
pnpm add @maxivo/sdk
```

## What it does

- **Reads published content.** It lists blogs, fetches one blog in any language, and returns categories and sitemap data from the Maxivo delivery API.
- **Refreshes pages instantly.** Maxivo calls your site when a post is published or unpublished. The SDK checks the signature and refreshes exactly the pages that changed.
- **Handles multilingual SEO.** It builds hreflang alternates and sitemap entries for every language.

## Start here

1. [Getting started](./getting-started.md): install, create an API token, make your first call.
2. [Next.js guide](./nextjs.md): blog list, blog page, translated pages, metadata and sitemap.
3. [Revalidate webhooks](./webhooks.md): refresh pages when a post is published.

## Reference

- [SEO and languages](./seo-and-i18n.md)
- [Errors and retries](./errors-and-retries.md)
- [Security](./security.md)
- [Troubleshooting](./troubleshooting.md)
- [Releasing (maintainers)](./releasing.md)
- The API reference covers every exported function and type. It is in the sidebar under **Modules**: `index`, `next` and `seo`.

## Requirements

- Node.js 20 or newer.
- Next.js 14 or 15 (App Router) for the `next` helpers. The client itself works in any JavaScript server runtime.
- A Maxivo project with an API token and a webhook secret.
