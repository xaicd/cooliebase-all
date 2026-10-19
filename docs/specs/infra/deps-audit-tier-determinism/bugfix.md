# Bugfix: 依赖 CVE 门禁分层判据改为从 pnpm-lock.yaml 离线推导（消除多父级包导致的 5/5/6 不确定）

状态：`PLAN_APPROVED`

## 1. 现象 (Symptom)
同一仓库状态下，`node scripts/check-deps-audit.cjs` 报出的 runtime 分层计数连跑三次得到 **5 / 5 / 6**。实测定位：43 条中只有 `braces@GHSA-vfj7-8cjw-p6xm` 一条在翻 —— 它的 importer roots 时而只有 `clients__expo`、时而含 `.`。因此台账 `cooliebase-all-dependency-policy.md` 无法给出可信的分层数字，已在其内标注"该数字不可作精确值引用"。

## 2. 根因 (Root Cause)
5-Whys：① 分层为何在翻 → 因为 `tierOf()` 读的是 `advisory.findings[].paths`；② 为何该字段会变 → `pnpm audit` **对多父级包会截断 `paths` 列表**（人类可读输出里就写着 "Found 8 paths" 却只列出 3 条）；③ 为何截断会导致误判 → `braces` 确实有两个父级（`tailwindcss → chokidar` 与 `react-native → babel-jest → micromatch`），截断发生时只剩 expo 那条，于是被错误标成 client-toolchain；④ 为何当初选了该字段 → 它看起来是现成的父级信息，省事；⑤ 根本原因 → **用了一个"采样式"字段当判据**。pnpm 没有提供完整父级链的稳定接口，所以正确修法不是换个字段、而是**换数据源**：依赖图的真源就在锁文件里，离线可解析且确定。

## 3. 防御不变量 (Invariants)
1. **分层确定性** —— 分层只由锁文件内容决定，不读任何采样字段；同一锁文件多次运行结果逐条相同（由回归测试断言）
2. **解析失败不静默** —— host 可达集合为空（或锁文件不可读）时直接报错退出，绝不返回一个全部 client-toolchain 的看似正常结果
