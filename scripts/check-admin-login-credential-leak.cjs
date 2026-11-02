#!/usr/bin/env node
/**
 * scripts/check-admin-login-credential-leak.cjs
 *
 * 后台登录页「凭据泄露」静态守门（T7 R2 必修清单第 1 条 / G5 硬阻断）。
 *
 * 病历（2026-11-02，3300 实例公开泄露 supervip 口令约 13.5h，COOA-610.2 / web-3503-实例正在公开泄露-01）：
 *   `src/app/login/page.tsx` 曾把 `ADMIN_BOOTSTRAP_USERNAME/PASSWORD` 塞进
 *   `bootstrapCredentials` prop ⇒ React SSR 把它序列化进响应体 ⇒
 *   **未登录 `curl /admin/login` 就能读到明文口令**（实测 `value="supervip"` /
 *   `value="Test@SuperVip2026!"`，匿名可读，泄露数小时）。
 *
 *   旧判据 `NODE_ENV !== "production"` 是**伪安全**：
 *     ① `next dev` 恒为 development ⇒ 本地预览实例照样泄露；
 *     ② 「开发模式就安全」与「匿名可读面不得出现凭据」根本不是一回事。
 *
 * 判据（静态 AST 无关的**结构化判据**，针对真实源码文本）：
 *   ① 登录页**不得**把 `ADMIN_BOOTSTRAP_PASSWORD` 读进任何下发给客户端的对象
 *      ⇒ 源码中不得出现 `ADMIN_BOOTSTRAP_PASSWORD`；
 *   ② 回填必须**默认关闭**：判据要能识别「显式开关」形态（`ADMIN_LOGIN_PREFILL`），
 *      且开关读取必须出现在**条件表达式**里（不能是裸常量真值）；
 *   ③ fail-closed：源码必须存在「进程 env 带口令 ⇒ 不回填」的守卫
 *      （`ADMIN_BOOTSTRAP_PASSWORD` 出现在**布尔守卫**里且用于**否定**回填）。
 *      —— 这一条与 ① 冲突时，以 ① 为准：口令**一次都不许出现在源码里**，
 *         fail-closed 守卫改用「口令是否在 env」的**间接**判据（见下）。
 *
 * 实际口径（本次落地）：
 *   服务端只回填**用户名**，口令由用户手输；口令不进响应体是**结构性保证**，
 *   不依赖任何运行时分支 —— 所以 ① 判据（口令变量名不得出现在登录页源码里）
 *   是唯一且充分的判据，其余两条是对「回填开关必须显式且默认关」的补充。
 *
 * 用法: node scripts/check-admin-login-credential-leak.cjs
 * 退出码: 0 = 通过；1 = 报红（每条违规一行）。
 */

const fs = require("fs")
const path = require("path")

const root = path.resolve(__dirname, "..")
const LOGIN_PAGE = path.join(root, "src", "app", "login", "page.tsx")
const LOGIN_FORM = path.join(root, "packages", "domains", "system", "frontend", "pages", "login.page.tsx")

const violations = []

function fail(message) {
  violations.push(message)
}

// ① 登录页不得读取引导口令（结构性保证：口令不进响应体）。
//    只扫**代码**（剔除注释行）：注释里引用变量名做病历说明是正常的，
//    判据要抓的是「代码真的读了这个变量」。
function stripComments(source) {
  return source
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .join("\n")
}

for (const file of [LOGIN_PAGE, LOGIN_FORM]) {
  if (!fs.existsSync(file)) {
    fail(`缺少被测文件: ${path.relative(root, file)}`)
    continue
  }
  const source = stripComments(fs.readFileSync(file, "utf8"))
  if (source.includes("ADMIN_BOOTSTRAP_PASSWORD")) {
    fail(
      `${path.relative(root, file)} 读取了 ADMIN_BOOTSTRAP_PASSWORD —— ` +
        `登录页源码一旦出现口令变量，就可能被 SSR 序列化进匿名可读响应（T7 R2 第 1 条 / G5 硬阻断）`,
    )
  }
}

// ② 回填必须显式开关且默认关闭：读 ADMIN_BOOTSTRAP_USERNAME 必须发生在条件表达式里。
if (fs.existsSync(LOGIN_PAGE)) {
  const source = fs.readFileSync(LOGIN_PAGE, "utf8")
  const usesUsername = source.includes("ADMIN_BOOTSTRAP_USERNAME")
  if (!usesUsername) {
    fail(`${path.relative(root, LOGIN_PAGE)} 未读取 ADMIN_BOOTSTRAP_USERNAME —— 回填能力被整体删除，` +
      `若确为有意为之请改判据，不要留下无法区分「已修」与「已删」的空洞判据`)
  }
  if (usesUsername && !source.includes("ADMIN_LOGIN_PREFILL")) {
    fail(`${path.relative(root, LOGIN_PAGE)} 回填用户名时缺少显式开关 ADMIN_LOGIN_PREFILL —— ` +
      `回填必须默认关闭（缺省即安全），不得依赖 NODE_ENV 之类的环境推断`)
  }
  // ②b **开关必须真的在门控**（变异测试实证：只判「开关名出现过」会被
  //     `const prefillEnabled = true` 绕过 ⇒ 恒开回填 ⇒ 假绿）。
  //     判据：存在一个**布尔变量**，它的取值表达式里含 ADMIN_LOGIN_PREFILL；
  //     并且该布尔变量**参与**了回填条件的判定。
  //     —— 关键：不能只看「开关出现在哪一行」，必须看**数据流**：
  //        `const prefillEnabled = <读开关>` ⇒ `const usernameOnly = prefillEnabled && ...`
  if (usesUsername) {
    const code = stripComments(source)
    const lines = code.split("\n")
    // 找出「读开关」的赋值：形如 `const X = ...ADMIN_LOGIN_PREFILL...`
    const switchVarNames = new Set()
    for (const line of lines) {
      const m = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=[^;]*ADMIN_LOGIN_PREFILL/.exec(line)
      if (m) switchVarNames.add(m[1])
    }
    // 找出「回填条件」所在的赋值：形如 `const Y = ...X... && ...`；
    // 要求 Y 的表达式里出现某个开关变量名。
    // 注意：**不能**用「条件里内联读开关」的兜底 —— 那会让
    // 「读了开关却没用」的形态蒙混过关（变异 M4 实证的假绿）。
    let switchGatesDecision = false
    for (const line of lines) {
      const m = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;]+)/.exec(line)
      if (!m) continue
      const [, name, expr] = m
      if (!/bootstrapCredentials|usernameOnly|prefill|credentials/i.test(name + expr)) continue
      for (const sv of switchVarNames) {
        if (new RegExp(`\\b${sv}\\b`).test(expr)) switchGatesDecision = true
      }
    }
    if (!switchVarNames.size) {
      fail(`${path.relative(root, LOGIN_PAGE)} 未把 ADMIN_LOGIN_PREFILL 赋给任何变量 —— ` +
        `回填必须由显式开关驱动（缺省即安全），不得硬编码`)
    } else if (!switchGatesDecision) {
      fail(`${path.relative(root, LOGIN_PAGE)} 读取了 ADMIN_LOGIN_PREFILL 但它未参与回填条件判定 —— ` +
        `开关形同虚设，回填实际恒开（变异测试实证的假绿形态）`)
    }
  }
}

// ③ 不得再以 NODE_ENV 作为「是否可回填凭据」的唯一判据。
//    只扫**代码**（剔除注释行），否则注释里引用旧写法就会误报。
if (fs.existsSync(LOGIN_PAGE)) {
  const code = fs
    .readFileSync(LOGIN_PAGE, "utf8")
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .join("\n")
  if (/NODE_ENV\s*!==\s*["']production["']/.test(code)) {
    fail(`${path.relative(root, LOGIN_PAGE)} 仍用 NODE_ENV !== "production" 门控回填 —— ` +
      `next dev 恒为 development（预览实例照样泄露），该判据是伪安全，必须换成显式开关`)
  }
}

// ④ 登录表单的口令输入框不得带预填值（结构性：服务端只回填用户名）。
if (fs.existsSync(LOGIN_FORM)) {
  const source = fs.readFileSync(LOGIN_FORM, "utf8")
  const passwordInput = /<input\b[^>]*type=["']password["'][^>]*>/i.exec(source)
  if (passwordInput && /\bvalue=["'][^"']+["']/i.test(passwordInput[0])) {
    fail(`${path.relative(root, LOGIN_FORM)} 口令输入框带预填 value= —— 预填即泄露`)
  }
}

if (violations.length > 0) {
  console.error("❌ 后台登录凭据泄露守门: %d 处违规:", violations.length)
  for (const v of violations) console.error(`   - ${v}`)
  process.exit(1)
}

console.log("✅ 后台登录凭据泄露守门: 登录页不读取口令 + 回填显式开关默认关 + 无 NODE_ENV 伪安全门控。")
