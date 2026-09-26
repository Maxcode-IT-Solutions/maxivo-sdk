import { describe, expect, it } from "vitest"
import { MaxivoError, SDK_VERSION } from "../src"

describe("MaxivoError", () => {
  it("marks network, 429 and 5xx as retryable", () => {
    expect(new MaxivoError(0, "network_error", "x").retryable).toBe(true)
    expect(new MaxivoError(429, "rate_limited", "x").retryable).toBe(true)
    expect(new MaxivoError(500, "x", "x").retryable).toBe(true)
    expect(new MaxivoError(404, "x", "x").retryable).toBe(false)
  })

  it("keeps the cause", () => {
    const cause = new Error("root")
    expect(new MaxivoError(0, "network_error", "x", { cause }).cause).toBe(cause)
  })

  it("exposes the SDK version", () => {
    expect(typeof SDK_VERSION).toBe("string")
  })
})
