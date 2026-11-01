import { describe, expect, it } from "vitest"
import {
  createIdempotencyKey,
  deriveDetailState,
  deriveListState,
  formatPriceCents,
  isNotFoundError,
  isSkuConflict,
  normalizeProductStatus,
  statusLabel,
  truncateText,
} from "../product.view"

describe("formatPriceCents", () => {
  it("把分格式化为元（两位小数，杜绝浮点误差）", () => {
    expect(formatPriceCents(0)).toBe("¥0.00")
    expect(formatPriceCents(5)).toBe("¥0.05")
    expect(formatPriceCents(1234)).toBe("¥12.34")
    expect(formatPriceCents(100000)).toBe("¥1000.00")
  })

  it("非法 / 空值回落为 0", () => {
    expect(formatPriceCents(null)).toBe("¥0.00")
    expect(formatPriceCents(undefined)).toBe("¥0.00")
    expect(formatPriceCents(Number.NaN)).toBe("¥0.00")
  })
})

describe("deriveListState", () => {
  it("loading 优先于一切", () => {
    expect(deriveListState({ loading: true, hasError: true, count: 3 })).toBe("loading")
  })
  it("其次是 error", () => {
    expect(deriveListState({ loading: false, hasError: true, count: 0 })).toBe("error")
  })
  it("0 条为 empty", () => {
    expect(deriveListState({ loading: false, hasError: false, count: 0 })).toBe("empty")
  })
  it("有数据为 ready", () => {
    expect(deriveListState({ loading: false, hasError: false, count: 2 })).toBe("ready")
  })
})

describe("deriveDetailState", () => {
  it("覆盖 loading / not-found / error / ready", () => {
    expect(deriveDetailState({ loading: true, notFound: false, hasError: false, hasData: false })).toBe("loading")
    expect(deriveDetailState({ loading: false, notFound: true, hasError: false, hasData: false })).toBe("not-found")
    expect(deriveDetailState({ loading: false, notFound: false, hasError: true, hasData: false })).toBe("error")
    expect(deriveDetailState({ loading: false, notFound: false, hasError: false, hasData: true })).toBe("ready")
  })
  it("无数据且非异常时回落 not-found（防御）", () => {
    expect(deriveDetailState({ loading: false, notFound: false, hasError: false, hasData: false })).toBe("not-found")
  })
})

describe("错误码判定", () => {
  it("409 CONFLICT 通过 code 命中", () => {
    expect(isSkuConflict({ code: "CONFLICT" })).toBe(true)
  })
  it("409 通过文案兜底命中", () => {
    expect(isSkuConflict({ error: "SKU FLIP-1 在当前租户内已存在" })).toBe(true)
  })
  it("正常错误不算冲突", () => {
    expect(isSkuConflict({ code: "VALIDATION_ERROR", error: "参数校验失败" })).toBe(false)
    expect(isSkuConflict(null)).toBe(false)
  })
  it("404 NOT_FOUND 命中", () => {
    expect(isNotFoundError({ code: "NOT_FOUND" })).toBe(true)
    expect(isNotFoundError({ error: "商品不存在" })).toBe(true)
    expect(isNotFoundError({ code: "INTERNAL_ERROR" })).toBe(false)
    expect(isNotFoundError(undefined)).toBe(false)
  })
})

describe("状态与文本", () => {
  it("normalize / label 只认 on_shelf", () => {
    expect(normalizeProductStatus("on_shelf")).toBe("on_shelf")
    expect(normalizeProductStatus("whatever")).toBe("off_shelf")
    expect(normalizeProductStatus(null)).toBe("off_shelf")
    expect(statusLabel("on_shelf")).toBe("已上架")
    expect(statusLabel(undefined)).toBe("已下架")
  })
  it("truncateText 超长加省略号", () => {
    expect(truncateText("abc", 5)).toBe("abc")
    expect(truncateText("abcdef", 3)).toBe("abc…")
    expect(truncateText(null)).toBe("")
  })
})

describe("createIdempotencyKey", () => {
  it("生成非空且两次不重复", () => {
    const a = createIdempotencyKey()
    const b = createIdempotencyKey()
    expect(a.length).toBeGreaterThan(0)
    if (typeof globalThis.crypto?.randomUUID === "function") {
      expect(a).not.toBe(b)
      expect(a).toMatch(/^[0-9a-f-]{36}$/)
    }
  })
})
