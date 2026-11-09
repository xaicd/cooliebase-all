# 原型与交互规范: 生产环境必须禁止使用硬编码默认 AES 密钥

> **Spec-Kit UI/UX 文本线框原型与交互状态契约 (UI Prototypes & Interaction States)**
> 上游真源：`brief.json`。线框用纯文本表达，100% 具备机器可读性与 Agent 操作确定性。
> 状态：`PLAN_APPROVED` | 所属领域：`infra` | 规格标识：`crypto-default-key-guard`

---

## 1. 主要页面线框视图 (Screen Wireframes)

### 密钥配置启动守卫（CLI / Server 控制台诊断输出）

```
当生产环境缺失或配置弱密钥时阻断数据源密码加解密并输出可读诊断错误
```

## 2. 交互要点与防误触守卫 (Interaction Guards)

* 启动或首次调用 encrypt/decrypt 时读取 NODE_ENV 与 COOLIEBASE_SHARED_AES_KEY / COOLIEBASE_VAULT_AES_KEY，生产环境未配置时立即抛出明确异常

## 3. 状态与空态处理 (States & Degraded UI)

- production-missing-key（阻断抛错）
- production-valid-key（正常加解密）
- non-production-fallback（开发/测试回退默认密钥）
