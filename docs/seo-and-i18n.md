---
title: SEO and languages
---

# SEO and languages

## Supported languages

| Code | Language             | Direction |
| ---- | -------------------- | --------- |
| `en` | English (source)     | ltr       |
| `hi` | Hindi                | ltr       |
| `es` | Spanish              | ltr       |
| `zh` | Chinese (Simplified) | ltr       |
| `ar` | Arabic               | **rtl**   |
| `fr` | French               | ltr       |
| `pt` | Portuguese           | ltr       |
| `de` | German               | ltr       |
| `ja` | Japanese             | ltr       |
| `ko` | Korean               | ltr       |

`SUPPORTED_LANGUAGES` and `RTL_LANGUAGES` are exported so you never hard-code these. Each Maxivo project enables a subset; the API returns `400` for a language the project does not have.

## hreflang

`hreflangAlternates(blog)` turns `blog.alternates` into the object Next.js expects, and adds `x-default` pointing at English:

```ts
alternates: {
  languages: hreflangAlternates(blog)
}
// { en: "https://nexiify.com/blog/a", hi: "https://nexiify.com/hi/blog/a", "x-default": "https://nexiify.com/blog/a" }
```

Only languages the post is actually published in are included, so you never link to a 404.

## URLs

`blogPath(slug, lang)` returns the default pattern: `/blog/{slug}` for English and `/{lang}/blog/{slug}` otherwise. If your site uses a different pattern, pass `path` to `sitemapEntries` and set the same pattern in Maxivo → Settings → General, so `alternates` URLs match.

## Sitemap

`sitemapEntries(await maxivo.sitemap(), { siteUrl })` returns one entry per blog per published language, with `lastModified`.

## Fonts

Load a font per script so translations render well: Noto Sans Devanagari (Hindi), Noto Sans SC (Chinese), Noto Sans JP, Noto Sans KR and Noto Sans Arabic. Scope them with `:lang(hi)` and similar selectors so English pages do not download them.
