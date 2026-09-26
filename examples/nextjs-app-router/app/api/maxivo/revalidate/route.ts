import { createRevalidateHandler } from "@maxivo/sdk/next"

export const POST = createRevalidateHandler({
  secret: process.env.MAXIVO_WEBHOOK_SECRET!,
  paths: ({ slug, langs }) =>
    langs
      .map((l) => (l === "en" ? `/blog/${slug}` : `/${l}/blog/${slug}`))
      .concat(["/blog", ...langs.filter((l) => l !== "en").map((l) => `/${l}/blog`), "/sitemap.xml"]),
})
