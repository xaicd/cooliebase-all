# ============================================================
# cooliebase-all 多阶段构建（standalone 模式）
# ============================================================

# Stage 1: 依赖安装
FROM node:24-alpine AS deps
WORKDIR /app
# pnpm 迁移后锁文件是 pnpm-lock.yaml（package-lock.json 已删除）——
# 必须把锁文件与 pnpm-workspace.yaml 一起拷进来，否则 --frozen-lockfile 无锁可依。
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# 构建工具只装在 deps 阶段（最终 runner 镜像不含它们）。
# 原因: better-sqlite3 的安装脚本是 `prebuild-install || node-gyp rebuild`，
# 一旦从 GitHub 拉预编译包超时, 就会回退到源码编译 —— 而 alpine 默认没有
# python3/make/g++, 于是整个镜像构建失败。装上这三样让回退路径真正可用,
# 构建就不再单点依赖一次外部下载。
RUN apk add --no-cache python3 make g++
# npm workspaces 要求各成员的 package.json 在 install 时已存在，
# 否则 pnpm install --frozen-lockfile 会因 workspace glob 指向不存在的目录而失败。
# 只拷 package.json（源码与 node_modules 由 .dockerignore / 后续 COPY 处理）。
COPY packages/plugins/sdk/package.json ./packages/plugins/sdk/package.json
COPY packages/plugins/examples/hello-world/package.json ./packages/plugins/examples/hello-world/package.json
# 包管理器切到 pnpm。corepack 的 shim 会读 package.json 的 packageManager 字段选版本，
# 故只需 enable，不必再 prepare（少一步不确定性）。
# --frozen-lockfile: CI/镜像构建必须用锁文件，不允许隐式升级依赖。
RUN corepack enable
RUN pnpm install --frozen-lockfile
# 【未验证项·迁移到 pnpm 后的已知风险】
# pnpm 的 node_modules 布局**大量使用符号链接**（node_modules/.pnpm + 成员链接）。
# npm 阶段我们已实测过: BuildKit 的跨阶段 COPY 解析这类链接时会报
#   "evalSymlinksInScope: too many links"
# 因此下面这步 `COPY --from=deps /app/node_modules` 在 pnpm 布局下有较大概率失败。
# 若构建在此处失败，两条标准解法（择一，不要用 hack）:
#   1) pnpm 官方做法: 用 `pnpm deploy --prod --filter <pkg> <outdir>` 产出自包含目录再 COPY
#   2) 退化为扁平布局: .npmrc 加 `node-linker=hoisted`（放弃 pnpm 严格布局，换取可 COPY）
# 本条在本机未能实测（镜像构建卡在更早的 apk 阶段，属环境网络问题），故如实标注而不是声称通过。
RUN rm -rf node_modules/@cooliebase node_modules/.pnpm/node_modules/@cooliebase node_modules/.pnpm/node_modules/@cooliebase

# Stage 2: 构建
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma Client is generated during the image build; migrations run separately before app replicas start.
RUN pnpm exec prisma generate

# Next.js build（standalone 模式）
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: 生产运行
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3100
ENV HOSTNAME="0.0.0.0"

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制 standalone 产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next-cooliebase/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next-cooliebase/static ./.next-cooliebase/static

# Prisma schema（运行时 migration 可能需要）
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3100

CMD ["node", "server.js"]
