import { beforeEach, describe, expect, it } from "vitest"
import { AigwAccessTokenService } from "../aigw-access-token.service"
import { AigwChannelService } from "../aigw-channel.service"
import { AigwModelService } from "../aigw-model.service"
import { AigwRelayService } from "../aigw-relay.service"
import { aigwStore } from "../aigw.store"

describe("AIGW 模型中台网关域服务测试", () => {
  beforeEach(() => {
    aigwStore.resetForTest()
  })

  it("演示令牌 + mock 渠道可以转发对话", async () => {
    const result = await AigwRelayService.relayChatCompletion({
      apiKey: "sk-cooliebase-demo-gateway",
      model: "mock-chat",
      messages: [{ role: "user", content: "Hello Antigravity" }],
    })
    expect(result.choices[0]?.message.content).toContain("Hello Antigravity")
    expect(result.usage.total_tokens).toBeGreaterThan(0)
  })

  it("无效令牌返回 401", async () => {
    await expect(
      AigwRelayService.relayChatCompletion({
        apiKey: "sk-invalid",
        model: "mock-chat",
        messages: [{ role: "user", content: "Hi" }],
      }),
    ).rejects.toMatchObject({ status: 401 })
  })

  it("渠道分页查询正常返回", async () => {
    const page = await AigwChannelService.page({ page: 1, pageSize: 10 })
    expect(page.items.length).toBeGreaterThan(0)
    expect(page.total).toBeGreaterThan(0)
  })

  it("模型目录分页查询正常返回", async () => {
    const page = await AigwModelService.page({ page: 1, pageSize: 10 })
    expect(page.items.length).toBeGreaterThan(0)
  })

  it("新建令牌只回一次明文 key", async () => {
    // 名字必须**唯一**: 之前用固定名，共享库里第二次跑就撞 "令牌名称已存在"
    // （内存模式每次全新所以看不出来，真实库必现）。
    const tokenName = `单元测试临时令牌-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const created = await AigwAccessTokenService.create({ name: tokenName })
    expect(created.key).toMatch(/^sk-cooliebase-[0-9a-f]+$/)

    const list = await AigwAccessTokenService.page({ page: 1, pageSize: 20, keyword: tokenName })
    expect(list.items[0]?.key).toContain("...")

    // 清理放在**断言之后** —— 放前面会把列表清空，断言自己就挂了（内存模式当场抓到）。
    await AigwAccessTokenService.delete(created.id)
  })
})
