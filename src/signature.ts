import { SIGNATURE_TOLERANCE_SECONDS } from "./types"

// Web Crypto works in Node 18+, Edge runtimes and browsers, so the SDK has no Node-only imports.
const encoder = new TextEncoder()

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await globalThis.crypto.subtle.sign("HMAC", key, encoder.encode(message))
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("")
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Builds the `x-maxivo-signature` header value for a raw body. Used by Maxivo when it sends webhooks. */
export async function signPayload(
  body: string,
  secret: string,
  timestamp = Math.floor(Date.now() / 1000),
): Promise<string> {
  return `t=${timestamp},v1=${await hmacHex(secret, `${timestamp}.${body}`)}`
}

export type VerifyResult = { ok: true } | { ok: false; reason: "missing" | "malformed" | "expired" | "mismatch" }

/** Checks a `x-maxivo-signature` header against the raw request body. */
export async function verifySignature(
  body: string,
  header: string | null | undefined,
  secret: string,
  options: { now?: number; toleranceSeconds?: number } = {},
): Promise<VerifyResult> {
  if (!header) return { ok: false, reason: "missing" }
  const parts = new Map(
    header.split(",").map((part) => {
      const i = part.indexOf("=")
      return [part.slice(0, i).trim(), part.slice(i + 1).trim()] as const
    }),
  )
  const timestamp = Number(parts.get("t"))
  const given = parts.get("v1")
  if (!Number.isInteger(timestamp) || !given || !/^[0-9a-f]{64}$/.test(given)) return { ok: false, reason: "malformed" }
  const now = options.now ?? Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > (options.toleranceSeconds ?? SIGNATURE_TOLERANCE_SECONDS))
    return { ok: false, reason: "expired" }
  const expected = await hmacHex(secret, `${timestamp}.${body}`)
  return constantTimeEqual(expected, given) ? { ok: true } : { ok: false, reason: "mismatch" }
}
