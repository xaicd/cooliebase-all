# Bugfix: compat-manifest 单一真源：把 deployment/apiPartitions/harness 声明并入真源并加机检堵住静默丢失

状态：`PLAN_APPROVED`

## 1. 现象 (Symptom)
母本仓同时存在两份 compat-manifest：真源 packages/shared/contract/compat-manifest.json 与生成物 compat-manifest.json（根）/ public/compat-manifest.json（由 pnpm surface:sync 从真源单向回写）。77dda012 只改了根生成物、补了 deployment / apiPartitions / harness 共 35 行，真源未同步 ⇒ 两份分叉。2026-11-04 14:28 真源副本被回写进根文件，那 35 行声明被整段抹掉，母本工作树自此长期 dirty；而 compat:check 全绿 —— 它只校验真源里『已经声明』的东西，既不校验『必须有哪些节』，也不比对镜像与真源是否一致。派生侧同样受害：本客户工作区的两份 manifest 均无这三节 ⇒ COO-64 的部署双模与三类 API 分区声明没有随派生进入客户工作区。复现：cd 母本仓 && git diff 77dda012^ HEAD -- compat-manifest.json && git diff HEAD:compat-manifest.json -- packages/shared/contract/compat-manifest.json

## 2. 根因 (Root Cause)
5-Whys：① 为什么 35 行声明会消失？—— 被 surface:sync 按真源整段覆盖；② 为什么会被覆盖？因为声明只写在生成物里，真源没有；③ 为什么声明会只写在生成物里？因为根 compat-manifest.json 与真源同名同格式、躺在最显眼的仓库根目录，看起来才是『入口文件』，而 AGENTS/CLAUDE 里『真源在 packages/shared/contract/』的说明不足以让人不去手改它；④ 为什么没人拦住？因为 compat:check 只校验『已声明项的正确性』，从不断言『必须有哪些节』，也不比对镜像与真源；⑤ 为什么没人发现？因为 check 链把 contracts:sync（含 surface:sync）排在 surface:check 之前 —— 漂移被自动『治好』，人的错误改动被吃掉且不报错。根因=缺少『必备声明』的机检 + 回写路径不区分『生成物比真源旧』（该同步）与『生成物比真源多』（会吃掉内容，不该同步）。

## 3. 防御不变量 (Invariants)
1. **生成物与真源逐字节一致** —— compat:check 逐字节比对真源与两个生成物；surface:sync 在回写前拒绝丢弃真源没有的内容
2. **必备声明不会静默消失** —— 三节声明的存在性由 scripts/lib/compat-manifest-sections.cjs 断言，缺失即红；单测提供反向对照
3. **声明不许悬空** —— harness.checkCommand / doctorCommand 指向的 npm script 必须在 package.json 里存在，否则判红
