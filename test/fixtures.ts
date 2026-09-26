export const blog = {
  slug: "how-to-choose-a-domain",
  lang: "hi",
  title: "t",
  description: "d",
  seoTitle: "t",
  seoDescription: "d",
  html: "<p>x</p>",
  coverUrl: null,
  coverAlt: null,
  category: null,
  author: null,
  publishedAt: "2026-10-01T00:00:00.000Z",
  alternates: [{ lang: "en", url: "https://nexiify.com/blog/how-to-choose-a-domain" }],
}

export function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } })
}
