# SPEC-AND-PROTOTYPE-STANDARD.md
# 统一规格包 (Spec Bundle)、原型 (HTML/PNG) 与工程任务标准化管理规范

> **生效对象**：所有在 `cooliebase-all` 基座上进行业务开发的工程师、架构师、产品经理、UI 设计师与 AI Agent  
> **核心宗旨**：打破「Feature 无法容纳 Bugfix 与重构」、「原型与代码脱节」以及「文档碎片化」的顽疾，依据 CMMI V2.0/V3.0 与 ISO/IEC/IEEE 29148 规范，推行 **统一规格驱动架构 (Unified Spec-Driven Architecture)** 与 **全息规格包 (Spec Bundle)**。

---

## 一、 顶层本质辨析：为什么是 Spec（规格）而非单纯的 Feature（特性）？

在经典软件工程与现代敏捷研发实践中，**将所有代码变更都冠以 “Feature” 是概念上的畸形**：
- 缺陷修复（Bugfix）**绝对不是 Feature**。给一个修复空指针异常的变更命名为 `feature/fix-npe`，在语义和审计上都是混乱的；
- 重构（Refactor）对外不改变任何功能行为，也不是业务 Feature；
- 性能调优或容量扩充是增量增强（Enhancement），而非全新 Feature。

在系统工程规范（IEEE 830 / ISO 29148 / CMMI RDM 需求开发与管理）中，所有变更的本质统一收敛为 **Specification Change（规格演进）**。`cooliebase-all` 确立 **4 大核心规格类型 (Spec Types)**：

| 规格类型 (`type`) | 语义本质与发生场景 | 核心关注点与输入要素 | 任务与代码白名单重点 |
|:---|:---|:---|:---|
| **`feature`** (新特性) | 引入全新业务能力、新建领域实体、开辟端到端用户流 | 商业目标、运营角色、用户故事、领域模型、EARS 验收标准 | 数据库迁移表、全动词 API、CRUD 界面、端到端集成测试 |
| **`bugfix`** (缺陷修复) | 纠正系统运行期实际行为与预期规格之间的**非预期偏离** | **Symptom (缺陷表现)**、**Root Cause (根本原因)**、受影响角色 | **红灯复现测试 (Red Test)**、防御性原位修复、防重入/状态守卫、回归验证 |
| **`enhancement`** (增量增强) | 既有能力上的性能优化、体验调优、容量扩容或细微扩展 | 优化指标（P95 耗时、QPS、操作步骤缩减）、旧基线对比 | 索引优化、算法改进、缓存加持、无破坏性接口扩展 |
| **`refactor`** (架构重构) | **外部规格与可见行为严格不变**前提下，内部架构演进 | 重构理由（坏味道治理、技术债务消除、解耦拆分） | 零 API 变更、无破坏性契约、覆盖既有业务状态机的真实单元测试 |

---

## 二、 统一规格全息包 (Spec Bundle) 物理拓扑

所有规格变更的过程资产统一封装在独立目录中，物理拓扑遵循 **按领域隔离 (Domain Partitioning)** 与 **活跃/归档双轨制 (Active & Archive)**：

- **活跃施工区**：`docs/specs/<domain>/<spec-name>/`（默认按域收敛，向下兼容旧版 `docs/features/<name>/`）；
- **历史归档区**：`docs/specs/archive/<YYYY-Qx>/<domain>/<spec-name>/`（交付后一键归档，杜绝目录污染）；

```
                  【统一规格全息包 (Spec Bundle)】

  docs/specs/<domain>/<spec-name>/
  ├── brief.json                 # 【核心输入】<500 Tokens 极简声明式 Brief (含 type 声明)
  ├── spec.json / feature.json   # 【元数据清单】名称、所属域、规格类型、上游溯源映射
  ├── requirements.md            # 【需求/规格】业务背景/缺陷根因、EARS 验收标准
  ├── design.md                  # 【设计】架构拓扑、领域实体、4 态状态机、关键不变量
  ├── prototype.md               # 【原型导读】文本线框、字段交互、四态规范、素材总索引
  ├── assets/                    # 【静态原型切图】PNG / SVG / JPG 视觉稿、设计导图
  │   ├── 01-main-screen.png     #    PC 管理端或移动端界面截图
  │   └── 02-defect-evidence.png #    缺陷复现截图或时序流程图
  ├── prototypes/                # 【HTML 动态原型】可真实点击运行的原型站点
  │   ├── index.html             #    单文件 HTML 交互原型
  │   └── (或 axure-site/)       #    Axure 导出的完整 HTML 站点
  └── tasks.md                   # 【任务】WBS 任务分解与 1 Task = 1 Commit 白名单
```

---

## 三、 原型 (Prototype: HTML / PNG) 的安放与管理标准

现实项目中，需求与设计的表现形式 **90% 以上是 PNG/SVG 视觉图或 HTML 交互文件**。

### 1. 静态视觉与切图原型 (`assets/`)
- **存放格式**：`.png`, `.jpg`, `.svg`, `.webp`, `.gif`；
- **文件命名**：采用数字编号与语义命名，例如 `01-order-list.png`、`02-refund-modal.png`；
- **引用规范**：在 `prototype.md` 中使用相对路径嵌入：
  ```markdown
  ## 订单退款界面原型
  ![退款操作弹窗](./assets/02-refund-modal.png)
  > 🎨 Figma 在线设计真源: [点击跳转 Figma 画布](https://www.figma.com/file/xxxx)
  ```
- **AI Agent 多模态协同**：AI 读取该目录的 PNG 图像后，可自动解析页面布局、色彩规范、按钮位置与表单项，直接展开为代码。

### 2. 可交互动态 HTML 原型 (`prototypes/`)
- **单文件原型**：由 v0.dev、Claude、Tailwind 或手写的单个 `.html` 文件，命名为 `prototypes/index.html` 或 `prototypes/<screen>.html`；
- **Axure 完整导出包**：
  - 解压后放入 `prototypes/axure/`；
  - 为防止 Git 仓库因 Axure 冗余资源膨胀，根目录 `.gitignore` 包含忽略规则：
    ```gitignore
    docs/features/**/prototypes/axure/resources/
    ```
- **本地预览**：在编辑器中右键 `Open with Live Server` 或双击浏览器打开直接交互测试。

### 3. 文本级线框模型 (`prototype.md`)
- 所有页面必须在 `prototype.md` 中配有 **ASCII 文本线框模型**；
- 文本线框为人类与 AI 提供最明确、无歧义的控件定义、字段字典、页面四态（加载态、空数据态、错误态、成功态）与二次确认防呆逻辑。

---

## 四、 规格驱动开发工作流 (Spec-Driven CLI)

统一的 CLI 工具链原生支持 `spec` 与 `feature` 别名，支持按类型脚手架初始化：

```
   ┌───────────────────────────┐       ┌─────────────────┐       ┌─────────────────┐
   │ 1. 创建规格脚手架          │ ────> │ 2. 填写 Brief   │ ────> │ 3. 一键展开资产 │
   │ (speckit:new --type ...)  │       │ (brief.json)    │       │ (speckit:build) │
   └───────────────────────────┘       └─────────────────┘       └─────────────────┘
                                                                          │
                                                                          ▼
   ┌───────────────────────────┐       ┌─────────────────┐       ┌─────────────────┐
   │ 6. 门禁验证与归档          │ <──── │ 5. 任务提交核验 │ <──── │ 4. 置入原型文件 │
   │ (speckit:check / archive) │       │ (speckit:tasks) │       │ (PNG / HTML)    │
   └───────────────────────────┘       └─────────────────┘       └─────────────────┘
```

### 1. 创建规格包
```bash
# 创建新业务特性 (Feature)
npm run speckit:new -- --name payment-split --domain pay --title "分账结算中心" --type feature

# 创建缺陷修补规格 (Bugfix)
npm run speckit:new -- --name fix-cart-race-condition --domain mall --title "修复购物车并发超卖" --type bugfix

# 创建增量增强规格 (Enhancement)
npm run speckit:new -- --name optimize-report-export --domain report --title "报表导出性能优化" --type enhancement

# 创建架构重构规格 (Refactor)
npm run speckit:new -- --name refactor-iot-parser --domain iot --title "重构设备网关协议解析器" --type refactor
```

### 2. 声明式 Brief (`brief.json`) 针对性差异
- **当 `--type feature` 时**：Brief 侧重商业目标、运营角色、用户故事、不变量与前端页面；
- **当 `--type bugfix` 时**：Brief 自动切换为针对缺陷的特化结构：
  - `symptom`: 缺陷复现现象、异常堆栈或线上告警；
  - `rootCause`: 代码设计或并发漏洞的根本原因；
  - `tasks`: 包含红灯单测复现 (`T1: Red Test`)、原位修补 (`T2: Fix`)、全量回归与门禁 (`T3: Regression`)；
- **遵守 Rule 0 极简法则**：模型只需填写此份 <500 Tokens 的 JSON，杜绝千行样板文档的人肉生成！

### 3. 一键展开生成 10~15 件套物理工程资产
```bash
npm run speckit:build -- --name fix-cart-race-condition
```
自动展开生成 `requirements.md`、`design.md`、`prototype.md`、`tasks.md` 等标准工程文档，格式 100% 结构化对齐。

### 4. 真实测试与 1 Task = 1 Commit 追溯
- 对 Bugfix 必须坚持 **反假 Mock 铁律**：写出能在真实数据库/状态机下红灯挂掉的测试用例；
- 每次提交关联任务：`git commit -m "fix(mall): [T1] 补充购物车并发超卖红灯复现单测"`；
- 任务执行与白名单核验：`npm run speckit:tasks -- --spec fix-cart-race-condition --summary`；
- 单项任务审查：`npm run speckit:tasks -- --spec fix-cart-race-condition --task T1`；
- 自动化门禁核查：`npm run speckit:check -- --spec fix-cart-race-condition` 与 `npm run check`。

### 5. 交付上线与规格归档 (Spec Archive)
上线割接完成并验证通过后，执行一键归档：
```bash
npm run speckit:archive -- --name fix-cart-race-condition
```
该规格包将自动从活跃施工区移动至 `docs/specs/archive/<YYYY-Qx>/<domain>/<name>/`，防止活跃目录随项目演进而膨胀污染；系统全息解析器依然保留对其全局可审计与双向追溯能力。

---

## 五、 CMMI 过程资产库 (PAL) 与交付物归档

依据 CMMI V2.0/V3.0 过程改进模型要求：
1. **组织级过程资产 (PAL)**：集中维护于 `docs/architecture/`、`.agents/rules/` 与 `.agents/skills/`，作为跨所有业务特性的统一制度与规范基线；
2. **项目级工作产品 (Work Products)**：收敛在各规格全息包 `docs/features/<name>/` 中，通过物理文件追溯需求（RDM）、技术解方案（TS）、验证确认（VV）与配置管理（CM）；
3. 详细规范请参阅 [`docs/architecture/CMMI-PROCESS-ASSETS-AND-DELIVERY-STANDARD.md`](file:///host-workspace/xaicd/cooliebase-all/docs/architecture/CMMI-PROCESS-ASSETS-AND-DELIVERY-STANDARD.md)。

---

## 六、 违规与避坑红线

- 🚫 **严禁将缺陷修复强行打包为伪 Feature**：必须使用 `--type bugfix` 声明，明确根因分析与红灯复现测试；
- 🚫 **严禁在代码仓库顶层乱建 `temp/`、`mockup/`、`proto/` 平铺目录**：所有原型切图与交互 HTML 必须统一收敛在所属规格包的 `assets/` 或 `prototypes/` 目录下；
- 🚫 **严禁无原型/无根因依据的凭空修改**：前端开发必须以 `prototype.md` 或切图为输入真源，Bugfix 必须以根因剖析和 Red Test 为先验依据；
- 🚫 **严禁伪造测试与跳过门禁**：Bug 修复必须有能复现的红灯测试变绿，严禁仅修改断言假装通过。
