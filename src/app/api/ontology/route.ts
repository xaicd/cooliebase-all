import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

/**
 * GET /api/ontology
 * 内嵌活体本体注册表自省端点 (对标 ODD code-paas 规范与 Layer B Gate G8-1 标准)
 * 动态暴露当前商业系统的七模型（M1:实体、M2:行为动词、M3:业务规则、M5:角色参与者、M6:状态机、MU:UI动作）
 */
export async function GET() {
  const cwd = process.cwd();
  
  // 1. 基础系统实体 (M1)
  const coreObjects = [
    {
      key: "system_user",
      name: "系统用户",
      description: "企业数字员工与人类操作员实体，强绑定租户与组织部门",
      properties: [
        { name: "id", type: "number", primary: true, note: "唯一主键" },
        { name: "username", type: "string", required: true, note: "登录账号" },
        { name: "nickname", type: "string", required: true, note: "显示昵称" },
        { name: "dept_id", type: "number", required: true, note: "归属部门 ID" },
        { name: "tenant_id", type: "number", required: true, note: "归属租户 ID" },
        { name: "status", type: "number", required: true, note: "状态 (0:正常 1:停用)" }
      ]
    },
    {
      key: "system_role",
      name: "系统角色",
      description: "RBAC 权限角色实体，承载菜单与动词操作权限集合",
      properties: [
        { name: "id", type: "number", primary: true, note: "角色 ID" },
        { name: "name", type: "string", required: true, note: "角色名称" },
        { name: "code", type: "string", required: true, note: "角色权限字符" },
        { name: "tenant_id", type: "number", required: true, note: "租户隔离 ID" }
      ]
    },
    {
      key: "system_tenant",
      name: "企业租户",
      description: "多租户组织物理与行级隔离第一实体",
      properties: [
        { name: "id", type: "number", primary: true, note: "租户 ID" },
        { name: "name", type: "string", required: true, note: "租户全称" },
        { name: "package_id", type: "number", required: true, note: "订阅套餐 ID" },
        { name: "status", type: "number", required: true, note: "租户状态" }
      ]
    },
    {
      key: "system_dept",
      name: "组织部门",
      description: "企业组织架构与数据权限树状实体",
      properties: [
        { name: "id", type: "number", primary: true, note: "部门 ID" },
        { name: "name", type: "string", required: true, note: "部门名称" },
        { name: "parent_id", type: "number", required: true, note: "上级部门 ID" }
      ]
    }
  ];

  // 2. 闭环业务动词 (M2)
  const coreBehaviors = [
    {
      actionKey: "user.create",
      displayName: "创建用户",
      description: "录入新员工或数字员工，原子绑定租户与角色",
      targetEntity: "system_user",
      requiredRoles: ["admin", "supervip"],
      sideEffects: ["audit_log", "notify_message"]
    },
    {
      actionKey: "user.assign_role",
      displayName: "分配角色",
      description: "为指定用户更新角色与动词权限范围",
      targetEntity: "system_user",
      requiredRoles: ["admin"],
      sideEffects: ["token_refresh"]
    },
    {
      actionKey: "tenant.switch",
      displayName: "切换租户上下文",
      description: "在允许的租户集合间安全平滑切换当前工作区",
      targetEntity: "system_tenant",
      requiredRoles: ["operator", "admin"],
      sideEffects: ["session_context_reset"]
    },
    {
      actionKey: "system.export_logs",
      displayName: "导出审计流水",
      description: "安全审计日志导出为不可变证据报表",
      targetEntity: "system_user",
      requiredRoles: ["auditor", "admin"],
      sideEffects: ["export_file_generation"]
    }
  ];

  // 3. 声明式业务不变量与规则 (M3)
  const coreInvariants = [
    {
      ruleId: "RULE_TENANT_ISOLATION",
      name: "租户行级物理隔离守恒律",
      description: "所有业务数据持久化与查询必须携带 tenant_id，禁止越权跨租户访问",
      enforcedAt: "prisma_middleware"
    },
    {
      ruleId: "RULE_SUPERVIP_IMMUTABLE",
      name: "超级管理特权防自锁不变量",
      description: "系统默认超管 supervip 不允许被停用或删除",
      enforcedAt: "service_guard"
    },
    {
      ruleId: "RULE_AUDIT_EVIDENCE_LOG",
      name: "高危写操作必记审计证据",
      description: "任何状态变更动词执行完毕必须向审计总线写入操作人与变更 Diff",
      enforcedAt: "aspect_listener"
    }
  ];

  // 4. 参与者与角色 (M5)
  const coreActors = [
    { code: "supervip", label: "超级架构特权管理员", scope: "global" },
    { code: "admin", label: "租户企业管理员", scope: "tenant" },
    { code: "operator", label: "前线业务操作员", scope: "dept" },
    { code: "auditor", label: "风控合规审计官", scope: "tenant_readonly" }
  ];

  // 5. 业务状态流转与生命周期 (M6)
  const coreStateflows = [
    {
      entity: "system_tenant",
      field: "status",
      states: [
        { value: 0, label: "正常运行", allowTransitions: [1, 2] },
        { value: 1, label: "已停用", allowTransitions: [0, 2] },
        { value: 2, label: "已销户", allowTransitions: [] }
      ]
    },
    {
      entity: "system_user",
      field: "status",
      states: [
        { value: 0, label: "正常", allowTransitions: [1] },
        { value: 1, label: "已锁定", allowTransitions: [0] }
      ]
    }
  ];

  // 6. 动态扫描插槽 packages/domains 中的扩展领域
  const customDomains: Array<{ domain: string; path: string }> = [];
  const domainsDir = path.join(cwd, "packages", "domains");
  if (fs.existsSync(domainsDir)) {
    try {
      const dirs = fs.readdirSync(domainsDir, { withFileTypes: true });
      for (const d of dirs) {
        if (d.isDirectory() && d.name !== "system" && d.name !== "infra") {
          customDomains.push({ domain: d.name, path: `packages/domains/${d.name}` });
        }
      }
    } catch {
      // 容错忽略
    }
  }

  return NextResponse.json({
    code: 0,
    message: "success",
    data: {
      platform: "cooliebase-all",
      version: "1.2.0",
      architecture: "Next.js 16 + React 19 + Prisma + ODD Living Ontology",
      timestamp: new Date().toISOString(),
      ontology: {
        M1_Objects: coreObjects,
        M2_Behaviors: coreBehaviors,
        M3_Invariants: coreInvariants,
        M5_Actors: coreActors,
        M6_Stateflows: coreStateflows,
        MU_UI: {
          zeroDeadButtonsStrict: true,
          copilotDrawerEnabled: true
        }
      },
      pluggedDomains: customDomains
    }
  });
}
