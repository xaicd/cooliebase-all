import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { GET as getOntology } from "../../src/app/api/ontology/route";
import { POST as postCopilotQuery } from "../../src/app/api/copilot/query/route";

describe("底座内嵌活体本体与 AI Copilot 只读沙箱", () => {
  it("GET /api/ontology 成功输出系统的 M1/M2/M3/M6 自省元数据", async () => {
    const res = await getOntology();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.code).toBe(0);
    expect(json.message).toBe("success");
    expect(json.data).toBeDefined();

    const data = json.data;
    const ont = data.ontology;
    expect(Array.isArray(ont.M1_Objects)).toBe(true);
    expect(ont.M1_Objects.length).toBeGreaterThan(0);
    expect(Array.isArray(ont.M2_Behaviors)).toBe(true);
    expect(ont.M2_Behaviors.length).toBeGreaterThan(0);
    expect(Array.isArray(ont.M3_Invariants)).toBe(true);
    expect(ont.M3_Invariants.length).toBeGreaterThan(0);
    expect(Array.isArray(ont.M6_Stateflows)).toBe(true);
    expect(ont.M6_Stateflows.length).toBeGreaterThan(0);
    expect(ont.MU_UI.zeroDeadButtonsStrict).toBe(true);
  });

  it("POST /api/copilot/query 允许安全的 SELECT 只读查询并注入租户隔离", async () => {
    const req = new Request("http://localhost:3000/api/copilot/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sql: "SELECT id, username FROM system_user WHERE tenant_id = 1",
        tenantId: 1,
        maxRows: 10,
      }),
    });

    const res = await postCopilotQuery(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.readOnly).toBe(true);
    expect(json.data.tenantId).toBe(1);
    expect(Array.isArray(json.data.rows)).toBe(true);
    expect(Array.isArray(json.data.columns)).toBe(true);
  });

  it("POST /api/copilot/query 允许基于自然语言 prompt 安全生成只读查询", async () => {
    const req = new Request("http://localhost:3000/api/copilot/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "查看系统在线员工",
        tenantId: 1,
      }),
    });

    const res = await postCopilotQuery(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.sql).toContain("SELECT");
    expect(json.data.sql).toContain("system_user");
    expect(json.data.readOnly).toBe(true);
  });

  it("POST /api/copilot/query 严厉拦截非 SELECT 写入指令 (DML/DDL 403 阻断)", async () => {
    const forbiddenStatements = [
      "DROP TABLE system_user",
      "DELETE FROM system_user WHERE id = 1",
      "INSERT INTO system_user (username) VALUES ('hacker')",
      "UPDATE system_user SET status = 0",
      "TRUNCATE TABLE system_tenant",
    ];

    for (const sql of forbiddenStatements) {
      const req = new Request("http://localhost:3000/api/copilot/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });

      const res = await postCopilotQuery(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.forbidden).toBe(true);
      expect(json.error).toContain("SQL_SECURITY_VIOLATION");
    }
  });

  it("POST /api/copilot/query 拦截敏感表直接访问与注释注入", async () => {
    const attackPayloads = [
      "SELECT * FROM system_oauth2_token",
      "SELECT * FROM system_user -- 尝试注释逃逸",
    ];

    for (const sql of attackPayloads) {
      const req = new Request("http://localhost:3000/api/copilot/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });

      const res = await postCopilotQuery(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.forbidden).toBe(true);
    }
  });

  it("前端抽屉组件与全局布局挂载合规性检查 (零死穴与纯白标)", () => {
    const root = path.resolve(__dirname, "../..");
    const drawerPath = path.join(root, "packages/shared/frontend/components/ontology-copilot-drawer.tsx");
    const layoutPath = path.join(root, "src/app/layout.tsx");

    expect(fs.existsSync(drawerPath)).toBe(true);
    expect(fs.existsSync(layoutPath)).toBe(true);

    const drawerContent = fs.readFileSync(drawerPath, "utf8");
    const layoutContent = fs.readFileSync(layoutPath, "utf8");

    // 零死穴按钮断言：不得包含空回调 onClick={() => {}}
    expect(drawerContent.includes("onClick={() => {}}")).toBe(false);
    expect(drawerContent.includes("onClick={undefined}")).toBe(false);

    // layout 挂载断言
    expect(layoutContent.includes("OntologyCopilotDrawer")).toBe(true);

    // 白标纯净度断言：不得包含私有客户硬编码
    expect(drawerContent.includes("jiuxia-smart-private")).toBe(false);
    expect(drawerContent.includes("yunnan-mobile-internal-token")).toBe(false);
  });
});
