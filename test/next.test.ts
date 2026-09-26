import { beforeEach, describe, expect, it, vi } from "vitest"

const revalidatePath = vi.fn()
const revalidateTag = vi.fn()
vi.mock("next/cache", () => ({ revalidatePath, revalidateTag }))

const { createRevalidateHandler } = await import("../src/next")
const { signPayload } = await import("../src/signature")

const onRevalidate = vi.fn()
const handler = createRevalidateHandler({
  secret: "whsec_test",
  paths: ({ slug, langs }) =>
    langs.map((l) => (l === "en" ? `/blog/${slug}` : `/${l}/blog/${slug}`)).concat("/blog", "/blog"),
  onRevalidate,
})

const req = (body: string, signature?: string) =>
  new Request("https://site.test/api/maxivo/revalidate", {
    method: "POST",
    body,
    headers: signature ? { "x-maxivo-signature": signature } : {},
  })

describe("createRevalidateHandler", () => {
  beforeEach(() => {
    revalidatePath.mockClear()
    revalidateTag.mockClear()
    onRevalidate.mockClear()
  })

  it("requires a secret", () => {
    expect(() => createRevalidateHandler({ secret: "", paths: () => [] })).toThrow(/secret/)
  })

  it("revalidates unique paths and the default tag for a signed publish", async () => {
    const body = JSON.stringify({
      event: "blog.published",
      projectKey: "mdi",
      slug: "a",
      langs: ["en", "hi"],
      at: "now",
    })
    const res = await handler(req(body, await signPayload(body, "whsec_test")))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, revalidated: ["/blog/a", "/hi/blog/a", "/blog"] })
    expect(revalidateTag).toHaveBeenCalledWith("maxivo")
    expect(onRevalidate).toHaveBeenCalledOnce()
  })

  it("answers pings without revalidating", async () => {
    const body = JSON.stringify({ event: "ping", projectKey: "mdi", at: "now" })
    const res = await handler(req(body, await signPayload(body, "whsec_test")))
    expect(await res.json()).toEqual({ ok: true, revalidated: [] })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("rejects unsigned requests with 401", async () => {
    expect((await handler(req("{}"))).status).toBe(401)
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("rejects a signed but invalid payload with 400", async () => {
    const body = JSON.stringify({ event: "nope" })
    expect((await handler(req(body, await signPayload(body, "whsec_test")))).status).toBe(400)
  })

  it("uses custom tags", async () => {
    const custom = createRevalidateHandler({ secret: "s", paths: () => [], tags: ["blog", "home"] })
    const body = JSON.stringify({ event: "blog.unpublished", projectKey: "mdi", slug: "a", langs: [], at: "now" })
    await custom(req(body, await signPayload(body, "s")))
    expect(revalidateTag.mock.calls.map((c) => c[0])).toEqual(["blog", "home"])
  })
})
