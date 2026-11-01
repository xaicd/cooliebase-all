import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    // 必须包含 packages/** —— 各域与 shared 的测试已随代码迁到 packages/ 下，
    // 漏掉这条会静默地少跑一大半测试而仍然显示通过（实测 300+ -> 29）。
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts", "test/**/*.test.ts", "packages/**/*.test.ts"],
    // 文件级**串行**。原因: 本仓测试共享**同一个数据库**，并行运行本身就是不安全的 ——
    // 曾经表现为"plugin-registry 那个用例偶发失败"，实为两个文件各自 syncFromDisk
    // 逻辑删除对方刚装进去的插件（实测并行下 3/3 必现，串行后 0/3）。
    // 代价是总耗时变长，换来的是结果可信 —— 测试结果不可信比慢更糟。
    fileParallelism: false,
  },
  resolve: {
    alias: {
      // 必须与 tsconfig 的 paths 保持一致（Vitest 不读 tsconfig paths）。
      // 核心规范别名：shared / plugins / domains
      "@/shared": path.resolve(__dirname, "packages/shared"),
      "@/plugins": path.resolve(__dirname, "packages/plugins"),
      "@/domains": path.resolve(__dirname, "packages/domains"),
      // 兼容历史别名
      "@/modules/shared": path.resolve(__dirname, "packages/shared"),
      // 已改造成第一方插件的域（目录搬到了 packages/plugins/plugin-*）
      "@/modules/pay": path.resolve(__dirname, "packages/plugins/plugin-pay"),
      "@/modules/report": path.resolve(__dirname, "packages/plugins/plugin-report"),
      "@/modules/bpm": path.resolve(__dirname, "packages/plugins/plugin-bpm"),
      "@/modules/mp": path.resolve(__dirname, "packages/plugins/plugin-mp"),
      "@/modules/member": path.resolve(__dirname, "packages/plugins/plugin-member"),
      "@/modules/iot": path.resolve(__dirname, "packages/plugins/plugin-iot"),
      "@/modules/erp": path.resolve(__dirname, "packages/plugins/plugin-erp"),
      "@/modules/im": path.resolve(__dirname, "packages/plugins/plugin-im"),
      "@/modules/aigw": path.resolve(__dirname, "packages/plugins/plugin-aigw"),
      "@/modules/ai": path.resolve(__dirname, "packages/plugins/plugin-ai"),
      "@/modules/crm": path.resolve(__dirname, "packages/plugins/plugin-crm"),
      "@/modules/wms": path.resolve(__dirname, "packages/plugins/plugin-wms"),
      "@/modules/online": path.resolve(__dirname, "packages/plugins/plugin-online"),
      "@/modules/mall": path.resolve(__dirname, "packages/plugins/plugin-mall"),
      "@/modules/mes": path.resolve(__dirname, "packages/plugins/plugin-mes"),
      "@/modules/flipshop": path.resolve(__dirname, "packages/plugins/plugin-flipshop"),
      "@/modules/shop": path.resolve(__dirname, "packages/plugins/plugin-shop"),
      "@/modules": path.resolve(__dirname, "packages/domains"),
      "@": path.resolve(__dirname, "src"),
      "@prisma/data": path.resolve(__dirname, "prisma/data"),
    },
  },
})
