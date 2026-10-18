import { describe, expect, it } from "vitest"
import { buildApiSignature, verifyApiSignature } from "./protection-signature"
import { decryptApiPayload, encryptApiPayload } from "./web-crypto"
import { sanitizeXssPayload } from "./web-xss"

describe("web and protection libs", () => {
  it("verifies api signature", () => {
    const payload = JSON.stringify({ key: "system.site_name", value: "hello" })
    const timestamp = Date.now()
    const nonce = "nonce-1"
    const secret = "cooliebase-signature-secret"

    const signature = buildApiSignature(payload, timestamp, nonce, secret)
    const headers = new Headers({
      "x-signature": signature,
      "x-signature-timestamp": String(timestamp),
      "x-signature-nonce": nonce,
    })

    expect(() => verifyApiSignature(headers, payload, secret)).not.toThrow()
    expect(() => verifyApiSignature(headers, payload, "bad-secret")).toThrow("签名校验失败")
  })

  it("encrypts and decrypts payload", () => {
    const plain = { key: "system.site_name", value: "CoolieBase" }
    const encrypted = encryptApiPayload(plain, "api-crypto-secret")
    const restored = decryptApiPayload(encrypted, "api-crypto-secret")
    expect(restored).toEqual(plain)
  })

  it("sanitizes xss payload", () => {
    const payload = {
      key: "system.site_name",
      value: '<script>alert(1)</script><b onmouseover="hack()">name</b>',
    }
    const safe = sanitizeXssPayload(payload)
    expect(safe.value).not.toContain("<script")
    expect(safe.value).not.toContain("onmouseover")
  })
})
