import io

p = "scripts/project-init.cjs"
t = io.open(p, encoding="utf-8").read()

# ① 身份契约里不再硬编码基座名
old = '  profile.description = `${opts.title} — 基于 cooliebase-all 高阶工程底座构建的企业级数字化业务中台。`'
assert old in t, "锚点①未命中"
new = '  // **不要**把基座品牌写进产物的身份契约：它是产物首页/登录页会显示的自述，
  // 白标化的意义就在这里。实测泄漏过：产物 profile 里写着「基于 cooliebase-all …」。
  profile.description = `${opts.title} — 模块化单体与微服务平滑演进的企业级数字化业务中台。`'
t = t.replace(old, new, 1)

# ② package.json 里的 init echo 也要洗掉基座名
old2 = "  pkg.name = opts.name"
assert old2 in t, "锚点②未命中"
new2 = '''  pkg.name = opts.name
  // `init` 脚本的提示文案里带基座名（`echo '[cooliebase-all] …'`）—— 派生工程里必须一起换掉，
  // 否则产物自己的 `pnpm run init` 会打出基座的身份。实测泄漏过（产物 package.json 第 48 行）。
  if (typeof pkg.scripts?.init === "string") {
    pkg.scripts.init = pkg.scripts.init.replace(/\\[cooliebase-all\\]/g, `[${opts.name}]`)
  }'''
t = t.replace(old2, new2, 1)

io.open(p, "w", encoding="utf-8").write(t)
print("  ✓ 两处已修")
