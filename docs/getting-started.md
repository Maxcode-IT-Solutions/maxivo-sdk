---
title: Getting started
---

# Getting started

This takes about ten minutes and ends with a page showing your published blogs.

## 1. Get your credentials from Maxivo

Sign in to Maxivo and open your project, for example **Nexiify**.

1. **Settings → General**: note the **project key** (`nexiify`) and check the **site URL**.
2. **Settings → API tokens → Create token**: name it after the environment ("Nexiify production") and copy the token. It starts with `mxv_live_` and is shown only once.
3. **Settings → Integration**: copy the **webhook secret** (`whsec_…`). You will set the revalidate URL in the [webhooks guide](./webhooks.md).

## 2. Install

```bash
pnpm add @maxivo/sdk
# or: npm install @maxivo/sdk / yarn add @maxivo/sdk
```

## 3. Add environment variables

Add these to `.env.local` locally and to your hosting provider's secrets in production. **Never** prefix them with `NEXT_PUBLIC_`, because that would ship them to the browser.

```bash
MAXIVO_URL=https://cms.maxcode.in
MAXIVO_TOKEN=mxv_live_...
MAXIVO_WEBHOOK_SECRET=whsec_...
```

## 4. Create the client once

```ts
// lib/maxivo.ts
import { createMaxivoClient } from "@maxivo/sdk"

export const maxivo = createMaxivoClient({
  baseUrl: process.env.MAXIVO_URL!,
  projectKey: "nexiify",
  token: process.env.MAXIVO_TOKEN!,
  // Next.js caches responses for 5 minutes and tags them so webhooks can refresh them instantly.
  next: { revalidate: 300, tags: ["maxivo"] },
})
```

Import `maxivo` only from server code: server components, route handlers and `generateMetadata`.

## 5. Make your first call

```tsx
// app/blog/page.tsx
import Link from "next/link"
import { maxivo } from "@/lib/maxivo"

export default async function BlogIndex() {
  const { items, total } = await maxivo.listBlogs({ lang: "en", pageSize: 12 })
  return (
    <main>
      <h1>Blog ({total})</h1>
      <ul>
        {items.map((b) => (
          <li key={b.slug}>
            <Link href={`/blog/${b.slug}`}>{b.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

Run `pnpm dev` and open `/blog`. If the list is empty, publish a post in Maxivo first; drafts are never returned.

## Next steps

- Build the blog page, translated pages and metadata: [Next.js guide](./nextjs.md)
- Make pages update instantly on publish: [Revalidate webhooks](./webhooks.md)
