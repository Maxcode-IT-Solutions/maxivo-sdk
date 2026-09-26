import { z } from "zod"

/** Languages Maxivo supports. English is always the source language. */
export const SUPPORTED_LANGUAGES = ["en", "hi", "es", "zh", "ar", "fr", "pt", "de", "ja", "ko"] as const
export const LanguageSchema = z.enum(SUPPORTED_LANGUAGES)
export type Language = z.infer<typeof LanguageSchema>

/** Languages written right to left. Render these with `dir="rtl"`. */
export const RTL_LANGUAGES: readonly Language[] = ["ar"]

export const PublicBlogSummarySchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  coverUrl: z.string().url().nullable(),
  coverAlt: z.string().nullable(),
  category: z.object({ slug: z.string(), name: z.string() }).nullable(),
  author: z.object({ name: z.string() }).nullable(),
  publishedAt: z.string(),
})
export type PublicBlogSummary = z.infer<typeof PublicBlogSummarySchema>

export const PublicBlogListSchema = z.object({
  items: z.array(PublicBlogSummarySchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
})
export type PublicBlogList = z.infer<typeof PublicBlogListSchema>

export const PublicBlogSchema = PublicBlogSummarySchema.extend({
  lang: LanguageSchema,
  seoTitle: z.string(),
  seoDescription: z.string(),
  /** Sanitised HTML. Render it inside an element with class `cms-content`. */
  html: z.string(),
  alternates: z.array(z.object({ lang: LanguageSchema, url: z.string().url() })),
})
export type PublicBlog = z.infer<typeof PublicBlogSchema>

export const PublicCategoryListSchema = z.object({
  items: z.array(z.object({ slug: z.string(), name: z.string(), count: z.number() })),
})
export type PublicCategoryList = z.infer<typeof PublicCategoryListSchema>

export const PublicSitemapSchema = z.object({
  items: z.array(z.object({ slug: z.string(), langs: z.array(LanguageSchema), updatedAt: z.string() })),
})
export type PublicSitemap = z.infer<typeof PublicSitemapSchema>

export const WebhookEventSchema = z.enum(["blog.published", "blog.unpublished", "ping"])
export type WebhookEvent = z.infer<typeof WebhookEventSchema>

export const RevalidatePayloadSchema = z.object({
  event: WebhookEventSchema,
  projectKey: z.string(),
  slug: z.string().optional(),
  langs: z.array(LanguageSchema).default([]),
  at: z.string(),
})
export type RevalidatePayload = z.infer<typeof RevalidatePayloadSchema>

/** Header that carries `t=<unix seconds>,v1=<hex HMAC-SHA256 of "t.body">`. */
export const SIGNATURE_HEADER = "x-maxivo-signature"
/** Signed requests older than this are rejected. */
export const SIGNATURE_TOLERANCE_SECONDS = 300
