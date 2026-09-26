import type { MetadataRoute } from "next"
import { sitemapEntries } from "@maxivo/sdk/seo"
import { maxivo } from "@/lib/maxivo"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return sitemapEntries(await maxivo.sitemap(), { siteUrl: "https://nexiify.com" })
}
