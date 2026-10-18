import { describe, expect, it } from "vitest"
import { SystemCaptchaService } from "../captcha.service"
import { SystemDictService } from "../dict.service"
import { SystemPermissionService } from "../permission.service"
import { SystemRoleRepository } from "@/modules/system/backend/repositories/role.repository"
import { SystemMenuRepository } from "@/modules/system/backend/repositories/menu.repository"
import { SystemUserRepository } from "@/modules/system/backend/repositories/user.repository"

// 本文件是 PostgreSQL 集成测试: 服务层直接经 cooliebasePrisma 落库, 依赖真实数据库。
// 未配置 DATABASE_URL 时跳过, 否则在默认本地环境下必然红灯(并非真实缺陷)。
// 运行方式: DATABASE_URL=postgresql://<user>:<pass>@<host>:<port>/<db> npm test
const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeWithDatabase("system persistence services", () => {
  it("persists captcha records and verifies them", async () => {
    const generated = await SystemCaptchaService.generate()
    const decoded = Buffer.from(generated.imageBase64, "base64").toString("utf8")
    const verified = await SystemCaptchaService.verify({
      captchaId: generated.captchaId,
      code: decoded.split(":")[1] ?? "",
    })

    expect(verified.success).toBe(true)
  })

  it("stores and lists dict items from the database", async () => {
    const type = await SystemDictService.createType({
      name: "测试状态",
      type: `test_status_${Date.now()}`,
      status: "ACTIVE",
    })

    const created = await SystemDictService.createData({
      dictTypeId: type.id,
      label: "测试",
      value: "TEST",
      status: "ACTIVE",
    })

    const result = await SystemDictService.listData(type.id)

    expect(created.id).toBeDefined()
    expect(result.some((item) => item.value === "TEST")).toBe(true)
  })

  it("assigns user roles and role menus through the database", async () => {
    const stamp = Date.now()
    const role = await SystemRoleRepository.create({
      name: "测试角色",
      code: `TEST_ROLE_${stamp}`,
      sort: 999,
      status: "ACTIVE",
    })
    const menu = await SystemMenuRepository.create({
      name: "测试菜单",
      path: "/test",
      permission: "test:view",
      type: "MENU",
      sort: 1,
    })
    const user = await SystemUserRepository.create({
      username: `test-${stamp}`,
      nickname: `测试-${stamp}`,
      password: "x",
      salt: "s",
      phone: `1380000${stamp.toString().slice(-4)}`,
      status: "ACTIVE",
    })

    const userRole = await SystemPermissionService.assignUserRole("op-1", {
      userId: user.id,
      roleIds: [role.id],
    })
    const roleMenu = await SystemPermissionService.assignRoleMenu("op-1", {
      roleId: role.id,
      menuIds: [menu.id],
    })

    expect(userRole.roleIds).toContain(role.id)
    expect(roleMenu.menuIds).toContain(menu.id)
  })
})
