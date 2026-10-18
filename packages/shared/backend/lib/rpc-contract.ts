/**
 * 跨域 RPC 契约的**代码**声明：接口 + DTO 即契约，编译期守卫。
 *
 * 上游的做法: 提供方在 `-api` 模块里用**接口 + DTO**声明自己能提供什么，
 * 消费方只依赖这个薄模块 —— 改错了编译不过。
 *
 * 本仓此前只有 `rpc-actions.json`（**手工维护的 JSON**）: 加方法忘登记、
 * 写错 module/target，都要到**运行时**才炸。这里把"声明"变成代码，
 * JSON 与 loader 变成**派生物**（见 scripts/generate-rpc-actions.cjs）。
 *
 * 用法（放在提供方域的 contract/ 下）:
 *
 *   export const WMS_RPC_CONTRACT = defineRpcContract("wms", {
 *     ping: {},
 *     listWarehouses: { service: "WmsService", module: "index", schema: "wmsPageQuerySchema" },
 *   })
 *
 * 约定:
 *   - key 就是跨域方法名（facade 上的方法名、catalog 里的 `method`）
 *   - `service` 是被查模块里的**导出名**；省略则按 key 在模块导出里找
 *   - `module` 是 `packages/<域>/backend/services/<module>.ts` 的文件名（不带扩展名）
 *   - `schema` 必须是**本域 validators 里真实存在的** zod schema 名（门禁会校验）
 */

export interface RpcActionDeclaration {
  /** 被调用模块里的导出名（对象或类）。省略则按方法名在模块导出里查。 */
  service?: string
  /** services 目录下的模块名（不带 .ts）。默认 "index"。 */
  module?: string
  /** 目标方法名。默认与方法名相同（用于 method 与实现名不一致的情况）。 */
  target?: string
  /** 入参 zod schema 的**导出名**，必须在提供方域的 validators 里存在。 */
  schema?: string
  /** 复用其他 action 的字段定义（如分页）。 */
  fieldsRef?: string
}

export interface RpcContract<M extends string = string> {
  domain: string
  methods: readonly M[]
  actions: Record<M, RpcActionDeclaration>
}

/**
 * 声明一个域的跨域契约。
 *
 * 返回值刻意**不做运行时处理** —— 它只是给生成器读的类型化常量。
 * 这样契约文件不引入任何运行期依赖，也不会被误当成业务代码。
 */
export function defineRpcContract<const M extends string>(
  domain: string,
  actions: Record<M, RpcActionDeclaration>,
): RpcContract<M> {
  return { domain, methods: Object.keys(actions) as M[], actions }
}
