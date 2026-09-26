import { describe, expect, it, vi } from "vitest"
import { createMaxivoClient, MaxivoError } from "../src"
import { blog, jsonResponse } from "./fixtures"

const make = (fetch: typeof globalThis.fetch, extra: Partial<Parameters<typeof createMaxivoClient>[0]> = {}) =>
  createMaxivoClient({
    baseUrl: "https://cms.test/",
    projectKey: "nexiify",
    token: "mxv_live_x",
    fetch,
    validate: true,
    retries: 0,
    ...extra,
  })

describe("createMaxivoClient", () => {
  it("requires baseUrl, projectKey and token", () => {
    expect(() => createMaxivoClient({ baseUrl: "", projectKey: "p", token: "t" })).toThrow(/baseUrl/)
    expect(() => createMaxivoClient({ baseUrl: "https://x", projectKey: "", token: "t" })).toThrow(/projectKey/)
    expect(() => createMaxivoClient({ baseUrl: "https://x", projectKey: "p", token: "" })).toThrow(/token/)
  })

  it("sends auth, SDK and query headers and parses a blog", async () => {
    const fetch = vi.fn(async () => jsonResponse(200, blog))
    const result = await make(fetch, { next: { revalidate: 60, tags: ["maxivo"] } }).getBlog("how-to-choose-a-domain", {
      lang: "hi",
    })
    expect(result?.lang).toBe("hi")
    const [url, init] = fetch.mock.calls[0] as unknown as [URL, RequestInit & { next?: unknown }]
    expect(String(url)).toBe("https://cms.test/api/public/v1/projects/nexiify/blogs/how-to-choose-a-domain?lang=hi")
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe("Bearer mxv_live_x")
    expect(headers["X-Maxivo-SDK"]).toMatch(/^js\//)
    expect(init.next).toEqual({ revalidate: 60, tags: ["maxivo"] })
  })

  it("lists blogs, categories and the sitemap", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { items: [], page: 2, pageSize: 5, total: 0 }))
      .mockResolvedValueOnce(jsonResponse(200, { items: [{ slug: "a", name: "A", count: 1 }] }))
      .mockResolvedValueOnce(jsonResponse(200, { items: [{ slug: "a", langs: ["en"], updatedAt: "x" }] }))
    const client = make(fetch)
    expect((await client.listBlogs({ page: 2, pageSize: 5, category: "domains" })).page).toBe(2)
    expect(String(fetch.mock.calls[0]?.[0])).toContain("page=2&pageSize=5&category=domains")
    expect((await client.listCategories({ lang: "en" })).items).toHaveLength(1)
    expect((await client.sitemap()).items[0]?.langs).toEqual(["en"])
  })

  it("returns null for a 404 blog", async () => {
    expect(
      await make(vi.fn(async () => jsonResponse(404, { error: { code: "not_found", message: "no" } }))).getBlog("nope"),
    ).toBeNull()
  })

  it("throws MaxivoError with the API code and request id", async () => {
    const client = make(
      vi.fn(async () =>
        jsonResponse(401, { error: { code: "bad_token", message: "Invalid token" } }, { "x-request-id": "req_1" }),
      ),
    )
    const err = await client.listBlogs().catch((e: unknown) => e)
    expect(err).toBeInstanceOf(MaxivoError)
    expect(err).toMatchObject({ status: 401, code: "bad_token", requestId: "req_1", retryable: false })
  })

  it("handles non-JSON error bodies", async () => {
    const client = make(vi.fn(async () => new Response("oops", { status: 502 })))
    await expect(client.listBlogs()).rejects.toMatchObject({ status: 502, code: "http_error", retryable: true })
  })

  it("rejects responses with the wrong shape when validating", async () => {
    const client = make(vi.fn(async () => jsonResponse(200, { items: "nope" })))
    await expect(client.listBlogs()).rejects.toMatchObject({ code: "invalid_response" })
  })

  it("skips validation when turned off", async () => {
    const client = make(
      vi.fn(async () => jsonResponse(200, { anything: true })),
      { validate: false },
    )
    expect(await client.listBlogs()).toEqual({ anything: true })
  })

  it("retries network errors and 5xx, then succeeds", async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(jsonResponse(503, {}))
      .mockResolvedValueOnce(jsonResponse(200, { items: [], page: 1, pageSize: 25, total: 0 }))
    const result = await make(fetch, { retries: 2 }).listBlogs()
    expect(result.total).toBe(0)
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it("does not retry 4xx", async () => {
    const fetch = vi.fn(async () => jsonResponse(400, { error: { code: "bad_lang", message: "x" } }))
    await expect(make(fetch, { retries: 3 }).listBlogs()).rejects.toMatchObject({ code: "bad_lang" })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it("reports timeouts as retryable MaxivoErrors", async () => {
    const timeout = Object.assign(new Error("timed out"), { name: "TimeoutError" })
    const client = make(
      vi.fn(async () => Promise.reject(timeout)),
      { timeoutMs: 5 },
    )
    await expect(client.listBlogs()).rejects.toMatchObject({ status: 0, code: "timeout", retryable: true })
  })
})
