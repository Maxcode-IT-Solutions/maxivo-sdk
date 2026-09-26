---
title: Next.js guide
---

# Next.js guide (App Router)

This guide builds a complete multilingual blog. English lives at `/blog/...` and every other language at `/{lang}/blog/...`, which is the URL pattern Maxivo expects by default.

It assumes you have finished [Getting started](./getting-started.md) and have `lib/maxivo.ts`.

## Blog page with SEO metadata

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { hreflangAlternates } from "@maxivo/sdk/seo"
import { maxivo } from "@/lib/maxivo"

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const blog = await maxivo.getBlog(params.slug, { lang: "en" })
  if (!blog) return {}
  return {
    title: blog.seoTitle,
    description: blog.seoDescription,
    alternates: { canonical: `/blog/${blog.slug}`, languages: hreflangAlternates(blog) },
    openGraph: { title: blog.seoTitle, description: blog.seoDescription, images: blog.coverUrl ? [blog.coverUrl] : [] },
  }
}

export default async function BlogPage({ params }: Props) {
  const blog = await maxivo.getBlog(params.slug, { lang: "en" })
  if (!blog) notFound()
  return (
    <article>
      {blog.coverUrl && <img src={blog.coverUrl} alt={blog.coverAlt ?? ""} />}
      <h1>{blog.title}</h1>
      <p>
        {blog.author?.name} · {new Date(blog.publishedAt).toLocaleDateString("en-IN")}
      </p>
      <div className="cms-content" dangerouslySetInnerHTML={{ __html: blog.html }} />
    </article>
  )
}
```

`getBlog` returns `null` when the post is not published in that language, so `notFound()` gives a proper 404.

In Next.js 15, `params` is a Promise: write `const { slug } = await params`.

## Translated pages

Add one dynamic segment for the language. Restrict it to your site's languages so it never swallows other routes such as `/login`.

```tsx
// app/[lang]/blog/[slug]/page.tsx
import { notFound } from "next/navigation"
import { RTL_LANGUAGES, type Language } from "@maxivo/sdk"
import { maxivo } from "@/lib/maxivo"

const LANGS = ["hi", "es", "zh", "ar", "fr", "pt", "de", "ja", "ko"] as const // your site's languages, minus "en"

export const dynamicParams = false
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }))
}

export default async function TranslatedBlog({ params }: { params: { lang: Language; slug: string } }) {
  const blog = await maxivo.getBlog(params.slug, { lang: params.lang })
  if (!blog) notFound()
  const dir = RTL_LANGUAGES.includes(params.lang) ? "rtl" : "ltr"
  return (
    <article lang={params.lang} dir={dir}>
      <h1>{blog.title}</h1>
      <div className="cms-content" dangerouslySetInnerHTML={{ __html: blog.html }} />
    </article>
  )
}
```

My Digital India only needs `["hi"]`; Nexiify uses all nine.

## Language switcher

Every blog has `alternates`, with one entry per language it is published in. Show only those:

```tsx
<nav aria-label="Language">
  {blog.alternates.map((a) => (
    <a key={a.lang} href={a.url} hrefLang={a.lang} aria-current={a.lang === blog.lang ? "page" : undefined}>
      {a.lang.toUpperCase()}
    </a>
  ))}
</nav>
```

## Pagination and categories

```ts
const page = Number(searchParams.page ?? 1)
const { items, total, pageSize } = await maxivo.listBlogs({
  lang: "en",
  page,
  pageSize: 12,
  category: searchParams.category,
})
const pages = Math.ceil(total / pageSize)

const { items: categories } = await maxivo.listCategories({ lang: "en" })
```

## Sitemap

```ts
// app/sitemap.ts
import type { MetadataRoute } from "next"
import { sitemapEntries } from "@maxivo/sdk/seo"
import { maxivo } from "@/lib/maxivo"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [{ url: "https://nexiify.com/" }, { url: "https://nexiify.com/blog" }]
  return [...staticPages, ...sitemapEntries(await maxivo.sitemap(), { siteUrl: "https://nexiify.com" })]
}
```

## Styling `.cms-content`

Maxivo returns plain semantic HTML: `h2`, `h3`, `p`, lists, `blockquote`, `pre/code`, tables, `figure/img/figcaption` and YouTube iframes. Style it once:

```css
.cms-content {
  max-width: 720px;
  line-height: 1.7;
}
.cms-content h2 {
  font-size: 1.6rem;
  margin: 2rem 0 0.75rem;
}
.cms-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}
.cms-content pre {
  overflow-x: auto;
  padding: 1rem;
  background: #f7f7f5;
  border-radius: 6px;
}
.cms-content table {
  width: 100%;
  border-collapse: collapse;
}
.cms-content :where(th, td) {
  border: 1px solid #e9e9e7;
  padding: 0.5rem;
}
.cms-content iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
}
.cms-content:lang(hi) {
  font-family: "Noto Sans Devanagari", sans-serif;
}
[dir="rtl"] .cms-content {
  text-align: right;
}
```

## Caching model

- `next: { revalidate: 300 }` means Next.js serves cached data and refetches at most every 5 minutes.
- `tags: ["maxivo"]` lets the webhook handler clear the cache the instant something is published, so readers do not wait for those 5 minutes.
- Leave `revalidate` in place as a safety net in case a webhook is missed.
