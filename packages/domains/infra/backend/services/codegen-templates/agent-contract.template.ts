import { type CodegenConfig, type CodegenOutput, domainBaseDir, formColumns, queryColumns, toCamel, toKebab, jsxText } from "./common"

/**
 * Agent 操作契约（机器可读）。
 *
 * 为什么要有它：agent-device / agent-browser 这类自动化要驱动一个页面或一批接口，
 * 需要的不是"读源码猜"，而是一份**稳定的、随代码同步更新**的声明：
 *   - 页面在哪、叫什么（route / title）
 *   - 接口面在哪（插件挂载点 + 五个动作的方法与路径）
 *   - 怎么定位元素（testid + 无障碍标签 —— agent-browser 走无障碍树）
 *   - 一条典型旅程分几步
 *   - 有哪些可自动化的运营动作
 *
 * 它由**同一份表元数据**产出，所以改表 = 契约同步更新，不存在"文档过时"。
 * 消费方: test/agent/agent-contract.spec.ts（L4 驱动）/ scripts/agent/run-ops.cjs（运营）。
 */
export function generateAgentContract(config: CodegenConfig): CodegenOutput {
  const { className, moduleName, businessName, submodule, permissionPrefix } = config
  const kebab = toKebab(className)
  const sub = submodule ? `/${submodule}` : ""
  const pluginId = `cooliebase.${moduleName}`

  const fields = formColumns(config).map((column) => ({
    name: column.name,
    label: jsxText(column.comment) || column.name,
    type: column.tsType,
    required: column.formValidation === "required" || !column.nullable,
    testId: `field-${column.name}`,
    selector: `[data-testid="field-${column.name}"]`,
  }))

  const searchFields = queryColumns(config).map((column) => ({
    name: column.name,
    label: jsxText(column.comment) || column.name,
    testId: `search-${column.name}`,
    selector: `[data-testid="search-${column.name}"]`,
  }))

  const tx = (name: string) => `[data-testid="${kebab}-${name}"]`

  const contract = {
    $schema: "cooliebase.agent.contract/v1",

    // ---- 身份 ----
    domain: moduleName,
    entity: className,
    kebab,
    businessName: jsxText(businessName),
    permissionPrefix: permissionPrefix ?? `${moduleName}:${toKebab(className).replace(/-/g, "")}`,

    // ---- 页面（agent-browser: goto -> 操作 -> 断言）----
    page: {
      route: `/admin/${moduleName}${sub}/${kebab}`,
      // 插件域若已插件化，页面仍由 Next 直接渲染；接口面走插件挂载点（见下）
      title: `${businessName}管理`,
      titleSelector: tx("title"),
    },

    // ---- 接口面（agent-device: 直接调接口做运营/造数）----
    api: {
      // 插件挂载点。同域内部（BFF 直连）用 /api/v1/admin/<域>/<kebab>，
      // 对外/跨进程走插件挂载点 —— 两者路由相同，只是前缀不同。
      pluginMount: `/api/v1/plugins/${pluginId}/api`,
      bffMount: `/api/v1/admin/${moduleName}`,
      resource: kebab,
      methods: {
        list: { http: "GET", path: `/${kebab}`, query: ["page", "pageSize", ...searchFields.map((f) => f.name)] },
        get: { http: "GET", path: `/${kebab}/:id` },
        create: { http: "POST", path: `/${kebab}` },
        update: { http: "PUT", path: `/${kebab}/:id` },
        delete: { http: "DELETE", path: `/${kebab}/:id` },
      },
    },

    // ---- 鉴权（自动化前置）----
    auth: {
      login: { http: "POST", path: "/api/v1/admin/system/auth", payload: { username: "$COOLIEBASE_AGENT_USERNAME", password: "$COOLIEBASE_AGENT_PASSWORD" } },
      tokenField: "data.token",
      header: "Authorization",
      scheme: "Bearer",
    },

    // ---- 元素定位（testid 给 Playwright；labels 给无障碍树）----
    selectors: {
      title: tx("title"),
      refresh: tx("refresh"),
      createButton: tx("create"),
      searchForm: tx("search"),
      searchSubmit: tx("search-submit"),
      searchReset: tx("search-reset"),
      total: tx("total"),
      table: tx("table"),
      row: tx("row"),
      editButton: tx("edit"),
      deleteButton: tx("delete"),
      form: tx("form"),
      formError: tx("form-error"),
      formSubmit: tx("form-submit"),
      formCancel: tx("form-cancel"),
      formClose: tx("form-close"),
    },
    accessibility: {
      tableLabel: `${jsxText(businessName)}列表`,
      dialogLabel: { create: `新增${jsxText(businessName)}`, edit: `编辑${jsxText(businessName)}` },
      searchFields,
      fields,
    },

    // ---- Agent-Native 属性规范（机器可读，agent 不必读源码猜）----
    // 约定: 交互元素必带 data-agent-target="模块:动作"，根节点带 data-agent-scope，
    //       元素状态走 data-agent-state，页面顶层用 data-agent-page-ready 报就绪，
    //       多层弹窗打开时基底打 inert 做节点剪枝（避免点到被遮挡元素）。
    // 严禁让 agent 依赖无文本 CSS/坐标定位。
    agentNative: {
      scheme: "cooliebase.agent.native/v1",
      scope: kebab,
      readiness: { attribute: "data-agent-page-ready", readySelector: `[data-agent-scope="${kebab}"][data-agent-page-ready="true"]`, states: ["true", "false"] },
      state: { attribute: "data-agent-state", page: ["loading", "modal-open", "empty", "ready"], row: ["idle", "editing"], form: ["open", "submitting", "error"] },
      modal: { overlay: tx("form-overlay"), dialog: tx("form"), pruneAttribute: "inert", pruneTarget: "页面基底内容容器" },
      targets: {
        search: `${kebab}:search`,
        reset: `${kebab}:reset`,
        refresh: `${kebab}:refresh`,
        create: `${kebab}:create`,
        edit: `${kebab}:edit`,
        delete: `${kebab}:delete`,
        submit: `${kebab}:submit`,
        cancel: `${kebab}:cancel`,
        close: `${kebab}:close`,
        row: `${kebab}:row`,
        pagination: `${kebab}:pagination`,
        fields: Object.fromEntries(...[fields.map((f) => [f.name, `${kebab}:field:${f.name}`]) as [string, string][]]),
      },
      // 移动端（clients/expo）统一用 [Screen]__[Component]__[Action] 命名空间，不用 web 属性
      mobile: {
        testIdScheme: "[Screen]__[Component]__[Action]",
        screen: `${moduleName}.${kebab}`,
        examples: [`${moduleName}.${kebab}__List__Refresh`, `${moduleName}.${kebab}__ListItem__Open`, `${moduleName}.${kebab}__Form__Submit`],
      },
    },

    // ---- 旅程（供 L4 用例与探索式 agent 共用）----
    // ---- 字段词汇表（供 agent 理解"这个实体有哪些可枚举状态"）----
    // 为什么必须有：实测 **0/340 份契约**曾暴露任何枚举 —— agent 读到
    // `status: "ACTIVE"` 时不知道还有哪些值、哪个是终态，只能去读代码或猜。
    // 枚举就是 agent 的动作空间。只输出**有枚举声明**的列，保持契约精简。
    // **只在有枚举声明时才输出** —— 否则 340 份契约会各多一个空的 `enums: {}`，纯噪音。
    ...(() => {
      const enums = Object.fromEntries(
        (config.table.columns ?? [])
          .filter((column) => Array.isArray(column.enumValues) && column.enumValues.length > 0)
          .map((column) => [
            column.name,
            {
              type: "enum",
              values: column.enumValues,
              ...(column.enumLabels ? { labels: column.enumLabels } : {}),
              ...(column.enumTerminal ? { terminal: column.enumTerminal } : {}),
              ...(column.comment ? { description: jsxText(column.comment) } : {}),
            },
          ]),
      )
      return Object.keys(enums).length > 0 ? { enums } : {}
    })(),

    journey: ["goto", "assertTitle", "search", "openCreateForm", "fillForm", "submitForm", "edit", "delete"],

    // ---- 运营动作（agent-device / 定时任务可直接执行）----
    ops: {
      automations: [
        { name: "health", kind: "query", description: "列表接口连通性 + 返回结构", method: "list" },
        { name: "seed-sample", kind: "mutation", description: "写入一条样例数据（幂等靠业务字段）", method: "create" },
        { name: "purge-sample", kind: "mutation", description: "清理本契约造的样例数据", method: "delete" },
      ],
    },
  }

  return {
    path: `${domainBaseDir(config.moduleName)}/agent/${kebab}.agent.json`,
    content: JSON.stringify(contract, null, 2) + "\n",
    type: "agent-contract" as any,
  }
}

/** 供 `toCamel` 显式引用，避免 tree-shaking 误删（契约里用到的工具保持导出）。 */
export const __agentContractHelpers = { toCamel }
