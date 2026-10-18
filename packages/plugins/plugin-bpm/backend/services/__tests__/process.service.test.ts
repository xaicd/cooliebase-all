import { afterEach, describe, expect, it, vi } from "vitest"
import { cooliebasePrisma } from "@/modules/shared/backend/prisma"
import { BpmProcessService } from "../process.service"

describe("BpmProcessService", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("propagates database failures instead of falling back to mock definitions", async () => {
    vi.spyOn(cooliebasePrisma.approvalTask, "groupBy").mockRejectedValueOnce(new Error("db unavailable"))

    await expect(
      BpmProcessService.listDefinitions({ page: 1, pageSize: 20, keyword: "" }),
    ).rejects.toThrow("db unavailable")
  })
})
