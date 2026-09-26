# @maxivo/sdk

Official SDK for **Maxivo CMS**. It reads published blogs in every language, refreshes your Next.js pages the moment a post is published, and builds hreflang and sitemap entries.

- Typed client with timeouts, retries and clear errors
- Signed revalidate webhooks (HMAC-SHA256), Node and Edge runtimes
- SEO helpers for multilingual blogs
- ESM + CommonJS, full TypeScript types, one runtime dependency (`zod`)

Works with Next.js 14 and 15 (App Router) and any Node 20+ runtime (Node 18 is end-of-life and has no global Web Crypto).

## Install

```bash
pnpm add @maxivo/sdk     # or npm i @maxivo/sdk / yarn add @maxivo/sdk
```

Set these **server-only** environment variables (never prefix them with `NEXT_PUBLIC_`):

| Variable                | Where to find it                                   |
| ----------------------- | -------------------------------------------------- |
| `MAXIVO_URL`            | Your Maxivo CMS URL, e.g. `https://cms.maxcode.in` |
| `MAXIVO_TOKEN`          | Maxivo → Settings → API tokens → Create token      |
| `MAXIVO_WEBHOOK_SECRET` | Maxivo → Settings → Integration → Webhook secret   |

## Quick start

```ts
// lib/maxivo.ts
import { createMaxivoClient } from "@maxivo/sdk"

export const maxivo = createMaxivoClient({
  baseUrl: process.env.MAXIVO_URL!,
  projectKey: "nexiify",
  token: process.env.MAXIVO_TOKEN!,
  next: { revalidate: 300, tags: ["maxivo"] },
})
```

```tsx
// app/blog/[slug]/page.tsx
const blog = await maxivo.getBlog(params.slug, { lang: "hi" })
if (!blog) notFound()
return <div className="cms-content" dangerouslySetInnerHTML={{ __html: blog.html }} />
```

`blog.html` is sanitised by Maxivo before it is published. Style it with a `.cms-content` stylesheet.

A complete Next.js example is in [`examples/nextjs-app-router`](examples/nextjs-app-router).

## Client API

`createMaxivoClient(options)`

| Option       | Default               | Description                                                     |
| ------------ | --------------------- | --------------------------------------------------------------- |
| `baseUrl`    | required              | Maxivo CMS URL                                                  |
| `projectKey` | required              | Project key from Maxivo settings                                |
| `token`      | required              | API token (`mxv_live_…`)                                        |
| `next`       | none                  | Passed to `fetch` as `next` (`revalidate`, `tags`)              |
| `timeoutMs`  | `10000`               | Timeout per request                                             |
| `retries`    | `2`                   | Retries for network errors, timeouts, 429 and 5xx, with backoff |
| `validate`   | on outside production | Validate responses against the schemas                          |
| `fetch`      | global `fetch`        | Custom fetch                                                    |

| Method                                              | Returns                                                     |
| --------------------------------------------------- | ----------------------------------------------------------- |
| `listBlogs({ lang?, page?, pageSize?, category? })` | `{ items, page, pageSize, total }`                          |
| `getBlog(slug, { lang? })`                          | `PublicBlog`, or `null` when not published in that language |
| `listCategories({ lang? })`                         | `{ items: [{ slug, name, count }] }`                        |
| `sitemap()`                                         | `{ items: [{ slug, langs, updatedAt }] }`                   |

### Errors

Every failure throws `MaxivoError` with `status` (0 for network errors and timeouts), `code` (e.g. `bad_token`, `timeout`, `invalid_response`), `message`, `requestId` and `retryable`.

```ts
import { MaxivoError } from "@maxivo/sdk"

try {
  await maxivo.listBlogs()
} catch (err) {
  if (err instanceof MaxivoError && err.status === 401) console.error("Check MAXIVO_TOKEN")
  throw err
}
```

## Refresh pages on publish

```ts
// app/api/maxivo/revalidate/route.ts
import { createRevalidateHandler } from "@maxivo/sdk/next"

export const POST = createRevalidateHandler({
  secret: process.env.MAXIVO_WEBHOOK_SECRET!,
  paths: ({ slug, langs }) =>
    langs
      .map((l) => (l === "en" ? `/blog/${slug}` : `/${l}/blog/${slug}`))
      .concat(["/blog", ...langs.filter((l) => l !== "en").map((l) => `/${l}/blog`), "/sitemap.xml"]),
})
```

Then set `https://your-site.com/api/maxivo/revalidate` as the revalidate URL in Maxivo → Settings → Integration, and click **Send test**.

The handler checks the `x-maxivo-signature` header (HMAC-SHA256 of `timestamp.body`), rejects requests older than 5 minutes, and returns `401` for bad signatures and `400` for bad payloads. You can also call `verifySignature(body, header, secret)` yourself.

## SEO

```ts
import { hreflangAlternates, sitemapEntries, blogPath } from "@maxivo/sdk/seo"

// generateMetadata
alternates: {
  languages: hreflangAlternates(blog)
}

// app/sitemap.ts
return sitemapEntries(await maxivo.sitemap(), { siteUrl: "https://nexiify.com" })
```

## Languages

`SUPPORTED_LANGUAGES` lists every language Maxivo supports: `en hi es zh ar fr pt de ja ko`. `RTL_LANGUAGES` lists those written right to left (`ar`); render them with `dir="rtl"`.

## Versioning

This package follows [semantic versioning](https://semver.org). See [CHANGELOG.md](CHANGELOG.md).

## Support

Report bugs in this repository's issues. For security problems, see [SECURITY.md](SECURITY.md).

© Maxcode IT Solutions. Proprietary; see [LICENSE](LICENSE).
