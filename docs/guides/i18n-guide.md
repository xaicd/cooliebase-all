# cooliebase-all-base 国际化多语言 (i18n) 开发与使用指南

更新时间：2026-10-09

本指南说明 `cooliebase-all-base` 前端国际化与多语言引擎的架构设计、使用方式与扩展规范。

---

## 一、 架构设计与特性

底座多语言引擎位于 `packages/shared/frontend/lib/i18n.tsx`，具备以下核心特性：

1. **四国语言开箱即用**：
   - 🇨🇳 **简体中文** (`zh-CN`，系统默认语言)
   - 🇺🇸 **English** (`en-US`)
   - 🇯🇵 **日本語** (`ja-JP`)
   - 🇰🇷 **한국어** (`ko-KR`)
2. **零外部依赖 (Zero External Dependencies)**：
   - 基于纯原生 React 19 Context 与 Hook 封装，不引入 `react-i18next` 或 `next-intl` 等庞大重量级外部库，极致压缩包体积（<10KB）。
3. **响应式与自动检测**：
   - 首选读取用户持久化配置（`localStorage.getItem("cooliebase_locale")`）；
   - 若未设置，自动根据客户端浏览器语言环境（`navigator.language`）智能匹配；
   - 切换语言时，自动同步更新 HTML 根标签属性（`<html lang="...">`）与 `localStorage`。
4. **三级平滑降级机制 (Robust Fallback Chain)**：
   - 查找当前语言字典键值 $\rightarrow$ 若缺失回退至 `zh-CN` 字典 $\rightarrow$ 若缺失回退至组件传入的 `fallback` 缺省文案 $\rightarrow$ 兜底返回 `key` 字符串，彻底杜绝界面出现空文本或报错崩溃。
5. **SSR 与独立组件安全**：
   - 即便在未包裹 `I18nProvider` 的独立测试环境或孤立组件中，`useI18n()` 亦自带 Safe Fallback，返回默认中文与空函数，绝不抛出 context null 异常。

---

## 二、 基础使用方法 (Client Components)

所有管理端 Admin 页面与插件前端页面均可在客户端组件（`"use client"`）中直接消费：

```tsx
"use client"

import React from "react"
import { useI18n } from "@/shared/frontend/lib/i18n"

export function UserToolbar() {
  const { t, locale, setLocale, currentMeta } = useI18n()

  return (
    <div className="flex items-center gap-3">
      {/* 1. 标准翻译取词 */}
      <button className="btn-primary">
        {t("action.create")} {/* 中文: "新建", 英文: "New", 日文: "新規作成", 韩文: "신규 생성" */}
      </button>

      <button className="btn-secondary">
        {t("action.search")} {/* 中文: "查询", 英文: "Search", 日文: "検索", 韩文: "조회" */}
      </button>

      {/* 2. 带自定义 Fallback 的取词 */}
      <span>{t("custom.welcome", "欢迎访问控制台")}</span>

      {/* 3. 获取当前语言元数据 */}
      <span className="text-xs text-muted-foreground">
        {currentMeta.flag} {currentMeta.nativeName} ({locale})
      </span>
    </div>
  )
}
```

---

## 三、 全局语言切换组件 (LanguageSwitcher)

系统已提供开箱即用的语言切换组件：
- 文件路径：`packages/shared/frontend/components/language-switcher.tsx`
- 导入方式：
  ```tsx
  import { LanguageSwitcher } from "@/shared/frontend/components/language-switcher"
  ```
- **挂载位置**：全局后台顶栏 `src/app/(admin-pages)/layout.tsx` 右上角工具区，呈现国旗徽标与本地化语言名称，支持点击下拉菜单即时响应式切换。

---

## 四、 常用内置词条命名空间 (Translation Keys)

通用词库集中声明于 `packages/shared/frontend/lib/i18n.tsx` 的 `TRANSLATIONS` 对象中：

| 命名空间 | 键名前缀 | 示例键名 | 中文含义 | 英文对照 |
|---|---|---|---|---|
| **导航/菜单** | `nav.*` | `nav.portalHome` | 门户首页 | Home |
| | | `nav.searchMenu` | 搜索菜单... | Search menu... |
| | | `nav.logout` | 退出 | Logout |
| | | `nav.switchLanguage` | 切换语言 | Language |
| **通用操作** | `action.*` | `action.create` | 新建 | New |
| | | `action.edit` | 编辑 | Edit |
| | | `action.delete` | 删除 | Delete |
| | | `action.search` | 查询 | Search |
| | | `action.reset` | 重置 | Reset |
| | | `action.export` | 导出 | Export |
| | | `action.save` | 保存 | Save |
| | | `action.confirm` | 确认 | Confirm |
| | | `action.cancel` | 取消 | Cancel |
| **常用字段** | `field.*` | `field.name` | 名称 | Name |
| | | `field.status` | 状态 | Status |
| | | `field.createdAt` | 创建时间 | Created At |
| | | `field.operation` | 操作 | Operation |
| **状态/提示** | `msg.*` | `msg.success` | 操作成功 | Operation successful |
| | | `msg.failed` | 操作失败 | Operation failed |
| | | `msg.loading` | 加载中... | Loading... |
| | | `msg.noData` | 暂无数据 | No data available |

---

## 五、 如何扩充新词条与业务插件词条

1. **修改通用词典**：
   在 `packages/shared/frontend/lib/i18n.tsx` 的 `TRANSLATIONS` 中，按四种语言分别添加同名键值：
   ```ts
   // zh-CN
   "mall.order.pendingPay": "待支付",
   
   // en-US
   "mall.order.pendingPay": "Pending Payment",
   
   // ja-JP
   "mall.order.pendingPay": "支払い待ち",
   
   // ko-KR
   "mall.order.pendingPay": "결제 대기",
   ```
2. **业务插件内的最佳实践**：
   - 基础操作按钮（增删改查/保存取消/状态提示）必须复用 `action.*`、`field.*` 与 `msg.*` 全局词条，避免在各业务插件重复造词；
   - 业务专有领域词条建议使用 `{domain}.{entity}.{property}` 作为键名命名空间（如 `wms.inventory.lock`）。

---

## 六、 架构铁律与防污染规范

> [!IMPORTANT]
> 1. **严禁旧路径污染**：导入 i18n 相关能力时，必须严格使用 `@/shared/frontend/lib/i18n`，**绝对严禁**编写 `@/modules/shared/...`；
> 2. **第一方业务插件隔离**：业务插件前端（`packages/plugins/plugin-<name>/frontend/`）只允许依赖 `@/shared/*` 或本插件内部能力，禁止跨插件直接 import 其他插件的组件或状态；
> 3. **无缝自动化测试**：所有 i18n 变更必须维护配套单测（`test/unit/i18n.test.ts`），确保 4 种语言字典与 fallback 机制通过 `npm run test:unit` 100% 验证。
