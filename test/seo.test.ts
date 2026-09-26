import { describe, expect, it } from "vitest"
import { blogPath, hreflangAlternates, sitemapEntries } from "../src/seo"

describe("seo helpers", () => {
  it("builds hreflang alternates with x-default", () => {
    expect(
      hreflangAlternates({
        alternates: [
          { lang: "en", url: "https://mydigitalindia.app/blog/a" },
          { lang: "hi", url: "https://mydigitalindia.app/hi/blog/a" },
        ],
      }),
    ).toEqual({
      en: "https://mydigitalindia.app/blog/a",
      hi: "https://mydigitalindia.app/hi/blog/a",
      "x-default": "https://mydigitalindia.app/blog/a",
    })
  })

  it("omits x-default without English", () => {
    expect(hreflangAlternates({ alternates: [{ lang: "hi", url: "https://x/hi/blog/a" }] })).toEqual({
      hi: "https://x/hi/blog/a",
    })
  })

  it("builds the default blog path", () => {
    expect(blogPath("a", "en")).toBe("/blog/a")
    expect(blogPath("a", "ar")).toBe("/ar/blog/a")
  })

  it("builds one sitemap entry per language, with custom paths", () => {
    const map = { items: [{ slug: "a", langs: ["en", "ar"] as const, updatedAt: "2026-10-01" }] }
    expect(
      sitemapEntries({ items: [{ ...map.items[0]!, langs: ["en", "ar"] }] }, { siteUrl: "https://nexiify.com/" }).map(
        (e) => e.url,
      ),
    ).toEqual(["https://nexiify.com/blog/a", "https://nexiify.com/ar/blog/a"])
    expect(
      sitemapEntries(
        { items: [{ slug: "a", langs: ["hi"], updatedAt: "x" }] },
        { siteUrl: "https://x", path: (s, l) => `/${l}/posts/${s}` },
      )[0]?.url,
    ).toBe("https://x/hi/posts/a")
  })
})
