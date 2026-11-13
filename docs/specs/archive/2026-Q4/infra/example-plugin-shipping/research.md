# 研究：派生工程是否应携带示例插件 hello-world

> **本文件是 T1 的产物**（纯实测任务，无实现）。所有数字都是在真仓跑出来的，不是估计。

## 1. 被测对象

`packages/plugins/examples/hello-world/` —— 6 个文件：

```
plugin.manifest.json   worker.js   merged.js
ui/HelloWidget.js      migrations/001_init.sql   package.json
```

**它不是域**：`packages/shared/backend/constants/domain-catalog.json` 里没有它。

## 2. 引用面实测

命令：

```bash
grep -rl 'examples/hello-world' --include='*.ts' --include='*.cjs' --include='*.js' \
  --include='*.json' --include='*.md' --include='*.sql' . | grep -v node_modules
```

| 类别 | 数量 | 文件 |
|---|---|---|
| 示例本体 | 6 | `packages/plugins/examples/hello-world/*` |
| **测试夹具** | **7** | `packages/shared/backend/plugins/__tests__/` 下的 plugin-migrations / plugin-sources / route-mount / runtime-manager / ui-slots / worker-manager，以及 `test/integration/plugin-lifecycle.integration.test.ts` |
| 生产代码注释 | 1 | `packages/shared/backend/plugins/package-scanner.ts` |
| 文档 | 1 | `.agents/skills/plugin-authoring/SKILL.md`（插件作者参考） |
| 构建产物 | 忽略 | `.next-ruoyi/standalone/**`（旧构建残留，不是引用） |

## 3. 决定性实验：把它挪走会怎样

```bash
mv packages/plugins/examples /tmp/examples-probe
pnpm exec vitest run packages/shared/backend/plugins test/integration/plugin-lifecycle.integration.test.ts
pnpm run check
mv /tmp/examples-probe packages/plugins/examples     # 已还原
```

**实测结果**：

```
失败测试：11 个，跨 6 个文件
pnpm run check：EXIT=0        ← 静态门禁完全看不见
```

失败的用例名说明它被**真正使用**，不是被"提到"：

- `runtime-manager`：合并形态加载模块、**直接调用 handler**、health 正常；两种形态 health 契约一致；重复 start 先停旧实例
- `worker-manager`：**能启动真实示例插件** —— initialize 成功、health 返回 ok、stop 干净退出
- `ui-slots`：能读到插件包里**真实存在的 bundle 文件**；路径穿越被挡住
- `route-mount`：**真插件**的 merged 形态能被直接调用

## 4. 结论：问题的性质变了

最初假设是「一个示例插件混进了产物」。实测不成立：

> **它是插件系统的运行时测试夹具。**
> 插件系统要验证「加载真插件 / 调 handler / health 契约 / UI bundle 投送 / worker 启动」，
> 就必须有一个**真的能被加载的插件包**。hello-world 就是那个包。

于是取舍变成：

| 做法 | 产物得到什么 | 产物失去什么 |
|---|---|---|
| 保留 | 插件系统测试覆盖完整 | 目录里多一个与业务无关的目录，开发者要先判断能不能删 |
| 裁掉 | 目录干净 | **产物从第一天就红**：11 个测试失败，而 `check` 看不见 |
| 裁掉并连测试一起裁 | 目录干净 + 不红 | **插件系统在产物里完全没有测试覆盖** |

**关键约束**：`check` 看不见这个破损（EXIT=0），只有 `test:unit` 能发现 ——
所以**任何裁剪方案都必须在产物上跑 `test:unit` 才算验收**。

## 5. 选定方案（T2 的依据）

**方案 A：把夹具搬进测试树，让"示例"这个身份消失。**

把 `packages/plugins/examples/hello-world/` 移到测试树内部
（如 `packages/shared/backend/plugins/__tests__/fixtures/hello-world/`），
并把 7 个测试文件的路径指向新位置。

为什么选它：

1. **产物不再有 `examples/`** —— 开发者不用再判断"这能不能删"（原始诉求达成）；
2. **插件系统的测试覆盖完整保留** —— 不是删掉示例，而是夹具归位；
3. **不再有"示例还是夹具"的双重身份** —— 它是什么，位置就说什么；
4. 代价最小：只动路径，不动插件协议与 manifest 形态。

**不选**：

- 方案 B（保留 + 标注）：没解决"开发者要先判断"；
- 方案 C（移出 `packages/plugins/`）：测试照样要引它，等于把 A 做得更绕；
- 直接裁掉：见上表 —— 产物第一天就红，且 `check` 拦不住。

## 6. 对 T3 / T4 的直接输入

- **T3** 要改的引用面是**实测出来的 7 个测试文件 + 1 处生产注释**，不是猜的；
- **T4 的验收必须包含「产物跑 `test:unit`」** —— 因为 `check` 看不见这个破损（实测 EXIT=0）；
- 反向对照应当验证的是 `test:unit` 变红，而不是 `check` 变红。
