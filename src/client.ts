import type { z } from "zod"
import { MaxivoError } from "./errors"
import {
  PublicBlogListSchema,
  PublicBlogSchema,
  PublicCategoryListSchema,
  PublicSitemapSchema,
  type Language,
  type PublicBlog,
  type PublicBlogList,
  type PublicCategoryList,
  type PublicSitemap,
} from "./types"
import { SDK_VERSION } from "./version"

export interface MaxivoClientOptions {
  /** Maxivo CMS base URL, e.g. `https://cms.maxcode.in`. */
  baseUrl: string
  /** Project key from Maxivo settings, e.g. `nexiify`. */
  projectKey: string
  /** API token (`mxv_live_…`). Server-side only: never expose it to the browser. */
  token: string
  /** Passed to `fetch` as `next`, so Next.js caches and tags requests. */
  next?: { revalidate?: number | false; tags?: string[] }
  /** Per-request timeout in milliseconds. Default 10 000. */
  timeoutMs?: number
  /** Retries for network errors, timeouts, 429 and 5xx. Default 2. */
  retries?: number
  /** Validate responses against the schemas. Default: on outside production. */
  validate?: boolean
  /** Custom fetch implementation (tests, proxies). */
  fetch?: typeof fetch
}

export interface ListBlogsParams {
  lang?: Language
  page?: number
  pageSize?: number
  category?: string
}

type Query = Record<string, string | number | undefined>

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Creates a client for the Maxivo public delivery API. */
export function createMaxivoClient(options: MaxivoClientOptions) {
  if (!options.baseUrl) throw new TypeError("createMaxivoClient: baseUrl is required")
  if (!options.projectKey) throw new TypeError("createMaxivoClient: projectKey is required")
  if (!options.token) throw new TypeError("createMaxivoClient: token is required")

  const doFetch = options.fetch ?? globalThis.fetch
  const timeoutMs = options.timeoutMs ?? 10_000
  const retries = Math.max(0, options.retries ?? 2)
  const validate = options.validate ?? process.env.NODE_ENV !== "production"
  const base = `${options.baseUrl.replace(/\/+$/, "")}/api/public/v1/projects/${encodeURIComponent(options.projectKey)}`

  async function once<T>(url: URL, schema: z.ZodType<T>): Promise<T> {
    const init: RequestInit & { next?: MaxivoClientOptions["next"] } = {
      headers: {
        Authorization: `Bearer ${options.token}`,
        Accept: "application/json",
        "X-Maxivo-SDK": `js/${SDK_VERSION}`,
      },
      signal: AbortSignal.timeout(timeoutMs),
    }
    if (options.next) init.next = options.next

    let res: Response
    try {
      res = await doFetch(url, init)
    } catch (err) {
      const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")
      throw new MaxivoError(
        0,
        timedOut ? "timeout" : "network_error",
        timedOut ? `Request timed out after ${timeoutMs} ms` : "Network error",
        { cause: err },
      )
    }

    const requestId = res.headers.get("x-request-id") ?? undefined
    if (!res.ok) {
      let code = "http_error"
      let message = `Maxivo request failed with status ${res.status}`
      try {
        const body = (await res.json()) as { error?: { code?: string; message?: string } }
        code = body.error?.code ?? code
        message = body.error?.message ?? message
      } catch {
        // not JSON; keep defaults
      }
      throw new MaxivoError(res.status, code, message, { requestId })
    }

    const json: unknown = await res.json()
    if (!validate) return json as T
    const parsed = schema.safeParse(json)
    if (!parsed.success) {
      throw new MaxivoError(
        res.status,
        "invalid_response",
        `Unexpected response shape: ${parsed.error.issues[0]?.message ?? "unknown"}`,
        { requestId, cause: parsed.error },
      )
    }
    return parsed.data
  }

  async function request<T>(path: string, query: Query, schema: z.ZodType<T>): Promise<T> {
    const url = new URL(base + path)
    for (const [key, value] of Object.entries(query)) if (value !== undefined) url.searchParams.set(key, String(value))

    for (let attempt = 0; ; attempt++) {
      try {
        return await once(url, schema)
      } catch (err) {
        if (!(err instanceof MaxivoError) || !err.retryable || attempt >= retries) throw err
        await sleep(Math.min(200 * 2 ** attempt, 2_000))
      }
    }
  }

  return {
    /** Published blogs, newest first. */
    listBlogs(params: ListBlogsParams = {}): Promise<PublicBlogList> {
      return request(
        "/blogs",
        { lang: params.lang, page: params.page, pageSize: params.pageSize, category: params.category },
        PublicBlogListSchema,
      )
    },

    /** One published blog, or `null` when it is not published in that language. */
    async getBlog(slug: string, params: { lang?: Language } = {}): Promise<PublicBlog | null> {
      try {
        return await request(`/blogs/${encodeURIComponent(slug)}`, { lang: params.lang }, PublicBlogSchema)
      } catch (err) {
        if (err instanceof MaxivoError && err.status === 404) return null
        throw err
      }
    },

    /** Categories with their published blog counts. */
    listCategories(params: { lang?: Language } = {}): Promise<PublicCategoryList> {
      return request("/categories", { lang: params.lang }, PublicCategoryListSchema)
    },

    /** Every published slug and its languages, for sitemaps. */
    sitemap(): Promise<PublicSitemap> {
      return request("/sitemap", {}, PublicSitemapSchema)
    },
  }
}

export type MaxivoClient = ReturnType<typeof createMaxivoClient>
