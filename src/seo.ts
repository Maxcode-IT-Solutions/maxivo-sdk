import type { Language, PublicBlog, PublicSitemap } from "./types"

/** `alternates.languages` for Next.js `generateMetadata`. English is also emitted as `x-default`. */
export function hreflangAlternates(blog: Pick<PublicBlog, "alternates">): Record<string, string> {
  const out: Record<string, string> = {}
  for (const alt of blog.alternates) out[alt.lang] = alt.url
  const en = blog.alternates.find((a) => a.lang === "en")
  if (en) out["x-default"] = en.url
  return out
}

export interface SitemapOptions {
  siteUrl: string
  /** Path for a slug in a language. Default: `/blog/{slug}` for English, `/{lang}/blog/{slug}` otherwise. */
  path?: (slug: string, lang: Language) => string
}

/** Default Maxivo URL pattern for a blog. */
export function blogPath(slug: string, lang: Language): string {
  return lang === "en" ? `/blog/${slug}` : `/${lang}/blog/${slug}`
}

/** Entries for Next.js `app/sitemap.ts`, one per blog per published language. */
export function sitemapEntries(
  sitemap: PublicSitemap,
  options: SitemapOptions,
): { url: string; lastModified: string }[] {
  const base = options.siteUrl.replace(/\/+$/, "")
  const toPath = options.path ?? blogPath
  return sitemap.items.flatMap((item) =>
    item.langs.map((lang) => ({ url: base + toPath(item.slug, lang), lastModified: item.updatedAt })),
  )
}
