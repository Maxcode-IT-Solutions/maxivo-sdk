---
title: Revalidate webhooks
---

# Revalidate webhooks

When a post is published or unpublished, Maxivo sends a signed `POST` to your site. The SDK verifies the signature and refreshes the affected pages, so changes go live in seconds.

## 1. Add the route

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

`paths` receives the event and returns every URL to refresh. Duplicates are removed. The `maxivo` cache tag is always refreshed too; pass `tags` to change it.

## 2. Register it in Maxivo

1. Deploy the route.
2. In Maxivo, go to **Settings → Integration** and set the revalidate URL to `https://your-site.com/api/maxivo/revalidate`.
3. Click **Send test**. You should see `200`. The test sends a `ping` event, which is acknowledged without refreshing anything.

## What Maxivo sends

```http
POST /api/maxivo/revalidate
Content-Type: application/json
x-maxivo-signature: t=1790000000,v1=5f2b…c9

{"event":"blog.published","projectKey":"nexiify","slug":"how-to-choose-a-domain","langs":["en","hi","ar"],"at":"2026-10-01T10:00:00.000Z"}
```

| Field        | Meaning                                        |
| ------------ | ---------------------------------------------- |
| `event`      | `blog.published`, `blog.unpublished` or `ping` |
| `projectKey` | The Maxivo project                             |
| `slug`       | The blog's slug (the same in every language)   |
| `langs`      | Languages affected                             |
| `at`         | When it happened (ISO 8601)                    |

## Responses

| Status                                 | When                                                                  |
| -------------------------------------- | --------------------------------------------------------------------- |
| `200 { ok: true, revalidated: [...] }` | Signature valid; paths refreshed                                      |
| `400 bad_payload`                      | Signature valid but the body is not a Maxivo event                    |
| `401 bad_signature`                    | Missing, malformed, expired (older than 5 minutes) or wrong signature |

Maxivo retries failed deliveries three times (after 2 s, 10 s and 30 s) and logs every attempt.

## Signature format

`v1` is the hex HMAC-SHA256 of `"<t>.<raw body>"`, keyed with the webhook secret. The handler recomputes it with Web Crypto, compares in constant time, and rejects timestamps more than 300 seconds away from the current time.

To verify it yourself (for example outside Next.js):

```ts
import { verifySignature } from "@maxivo/sdk"

const body = await request.text() // the raw body, before JSON.parse
const result = await verifySignature(
  body,
  request.headers.get("x-maxivo-signature"),
  process.env.MAXIVO_WEBHOOK_SECRET!,
)
if (!result.ok) return new Response(result.reason, { status: 401 })
```

## Logging

```ts
createRevalidateHandler({
  secret: process.env.MAXIVO_WEBHOOK_SECRET!,
  paths: /* … */,
  onRevalidate: (payload, paths) => console.info("[maxivo] revalidated", payload.event, payload.slug, paths),
})
```
