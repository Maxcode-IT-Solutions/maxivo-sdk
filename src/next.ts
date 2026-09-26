import { revalidatePath, revalidateTag } from "next/cache"
import { verifySignature } from "./signature"
import { RevalidatePayloadSchema, SIGNATURE_HEADER, type RevalidatePayload } from "./types"

export interface RevalidateHandlerOptions {
  /** The project's webhook secret from Maxivo → Settings → Integration (`MAXIVO_WEBHOOK_SECRET`). */
  secret: string
  /** Paths to refresh for an event, e.g. the blog URL in every language plus the list pages. */
  paths: (payload: RevalidatePayload) => string[]
  /** Cache tags to refresh. Default `["maxivo"]`, the tag used in the README's client setup. */
  tags?: string[]
  /** Called after a successful revalidation (logging, analytics). */
  onRevalidate?: (payload: RevalidatePayload, paths: string[]) => void | Promise<void>
}

/** Returns a `POST` route handler for `app/api/maxivo/revalidate/route.ts`. Works on the Node and Edge runtimes. */
export function createRevalidateHandler(options: RevalidateHandlerOptions) {
  if (!options.secret) throw new TypeError("createRevalidateHandler: secret is required")

  return async function POST(request: Request): Promise<Response> {
    const body = await request.text()
    const check = await verifySignature(body, request.headers.get(SIGNATURE_HEADER), options.secret)
    if (!check.ok) return Response.json({ error: { code: "bad_signature", message: check.reason } }, { status: 401 })

    let payload: RevalidatePayload
    try {
      payload = RevalidatePayloadSchema.parse(JSON.parse(body))
    } catch {
      return Response.json({ error: { code: "bad_payload", message: "Invalid payload" } }, { status: 400 })
    }

    if (payload.event === "ping") return Response.json({ ok: true, revalidated: [] })

    const paths = [...new Set(options.paths(payload))]
    for (const path of paths) revalidatePath(path)
    for (const tag of options.tags ?? ["maxivo"]) revalidateTag(tag)
    await options.onRevalidate?.(payload, paths)

    return Response.json({ ok: true, revalidated: paths })
  }
}
