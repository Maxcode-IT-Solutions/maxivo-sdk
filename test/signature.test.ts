import { describe, expect, it } from "vitest"
import { createHmac } from "node:crypto"
import { signPayload, verifySignature } from "../src/signature"

const body = JSON.stringify({ event: "blog.published", projectKey: "nexiify", slug: "a", langs: ["en"], at: "x" })

describe("signature", () => {
  it("accepts a fresh, correct signature", async () => {
    const header = await signPayload(body, "whsec_1", 1000)
    expect(await verifySignature(body, header, "whsec_1", { now: 1100 })).toEqual({ ok: true })
  })

  it("matches Node's HMAC-SHA256, so CMS and sites agree", async () => {
    const expected = createHmac("sha256", "secret").update("1000.hello").digest("hex")
    expect(await signPayload("hello", "secret", 1000)).toBe(`t=1000,v1=${expected}`)
  })

  it("rejects a wrong secret, changed body, old timestamp, missing and malformed headers", async () => {
    const header = await signPayload(body, "whsec_1", 1000)
    expect(await verifySignature(body, header, "other", { now: 1000 })).toEqual({ ok: false, reason: "mismatch" })
    expect(await verifySignature(body + " ", header, "whsec_1", { now: 1000 })).toEqual({
      ok: false,
      reason: "mismatch",
    })
    expect(await verifySignature(body, header, "whsec_1", { now: 1301 })).toEqual({ ok: false, reason: "expired" })
    expect(await verifySignature(body, header, "whsec_1", { now: 1100, toleranceSeconds: 50 })).toEqual({
      ok: false,
      reason: "expired",
    })
    expect(await verifySignature(body, null, "whsec_1")).toEqual({ ok: false, reason: "missing" })
    expect(await verifySignature(body, "garbage", "whsec_1")).toEqual({ ok: false, reason: "malformed" })
    expect(await verifySignature(body, "t=1000,v1=zz", "whsec_1", { now: 1000 })).toEqual({
      ok: false,
      reason: "malformed",
    })
  })

  it("uses the current time by default", async () => {
    const header = await signPayload(body, "s")
    expect(await verifySignature(body, header, "s")).toEqual({ ok: true })
  })
})
