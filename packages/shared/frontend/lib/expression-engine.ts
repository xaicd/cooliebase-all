/**
 * 零 eval 安全沙箱响应式表达式引擎 (PagePlug / Formily / Amis 风格)
 *
 * 支持语法：
 *   - 模板包裹：`{{ $form.orderType === 'VIP' && $form.amount > 100 }}` 或直接表达式 `$form.status === 1`
 *   - 上下文变量：`$form` / `form`、`$row` / `row`、`$state` / `state`、`$user` / `user`、`$queries` / `queries`
 *   - 比较与逻辑：`===`, `!==`, `==`, `!=`, `>=`, `<=`, `>`, `<`, `&&`, `||`, `!`, `? :` (三元)
 *   - 算术运算：`+`, `-`, `*`, `/`, `%`
 *   - 安全方法：`.includes()`, `.startsWith()`, `.endsWith()`, `.length`
 *
 * 安全红线（Invariants）：
 *   - 100% 禁用 `eval()`、`new Function()`、`setTimeout(string)`；
 *   - 拦截 `__proto__`、`prototype`、`constructor`、`window`、`globalThis`、`process` 等危险标识符；
 *   - 语法错误静默降级为 fallback，绝不导致 React 渲染树白屏崩溃。
 */

export interface ExpressionContext {
  $form?: Record<string, any>
  form?: Record<string, any>
  $row?: Record<string, any>
  row?: Record<string, any>
  $state?: Record<string, any>
  state?: Record<string, any>
  $user?: Record<string, any>
  user?: Record<string, any>
  $queries?: Record<string, any>
  queries?: Record<string, any>
  [key: string]: any
}

const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "window",
  "document",
  "globalThis",
  "global",
  "process",
  "Function",
  "eval",
  "require",
  "module",
  "exports",
])

/** 检查属性访问路径是否安全 */
export function isSafePath(pathStr: string): boolean {
  const parts = pathStr.split(/[.[\]]+/).filter(Boolean)
  return parts.length > 0 && parts.every((part) => !FORBIDDEN_KEYS.has(part))
}

/** 剥离外层 {{ ... }} 包裹 */
export function stripMustache(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith("{{") && trimmed.endsWith("}}")) {
    return trimmed.slice(2, -2).trim()
  }
  return trimmed
}

/** 提取表达式中引用的上下文变量路径（用于构建 Reactive Dependency Graph） */
export function extractExpressionDeps(exprInput: string | undefined | null): string[] {
  if (!exprInput || typeof exprInput !== "string") return []
  const body = stripMustache(exprInput)
  if (!body) return []
  const matches = body.match(/(?:\$?[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)+)/g) || []
  const cleaned = matches
    .map((m) => m.replace(/\.(includes|startsWith|endsWith|length)$/, ""))
    .filter((m) => isSafePath(m))
  return Array.from(new Set(cleaned))
}

type TokenType =
  | "NUMBER"
  | "STRING"
  | "BOOLEAN"
  | "NULL"
  | "UNDEFINED"
  | "IDENT"
  | "OP"
  | "PUNC"

interface Token {
  type: TokenType
  value: any
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const len = input.length

  while (i < len) {
    const ch = input[i]
    if (/\s/.test(ch)) {
      i++
      continue
    }

    // 字符串字面量
    if (ch === "'" || ch === '"') {
      const quote = ch
      i++
      let str = ""
      while (i < len && input[i] !== quote) {
        if (input[i] === "\\" && i + 1 < len) {
          i++
          str += input[i]
        } else {
          str += input[i]
        }
        i++
      }
      if (i !== len) i++ // 跳过闭合引号
      tokens.push({ type: "STRING", value: str })
      continue
    }

    // 数字字面量
    if (/[0-9]/.test(ch)) {
      let numStr = ""
      while (i < len && /[0-9.]/.test(input[i])) {
        numStr += input[i++]
      }
      tokens.push({ type: "NUMBER", value: Number(numStr) })
      continue
    }

    // 多字符运算符
    const threeChar = input.slice(i, i + 3)
    if (threeChar === "===" || threeChar === "!==") {
      tokens.push({ type: "OP", value: threeChar })
      i += 3
      continue
    }

    const twoChar = input.slice(i, i + 2)
    if (["==", "!=", ">=", "<=", "&&", "||"].includes(twoChar)) {
      tokens.push({ type: "OP", value: twoChar })
      i += 2
      continue
    }

    // 单字符运算符
    if ([">", "<", "!", "+", "-", "*", "/", "%", "?", ":"].includes(ch)) {
      tokens.push({ type: "OP", value: ch })
      i++
      continue
    }

    // 标点符号
    if (["(", ")", "[", "]", ",", "."].includes(ch)) {
      tokens.push({ type: "PUNC", value: ch })
      i++
      continue
    }

    // 标识符
    if (/[a-zA-Z_$]/.test(ch)) {
      let id = ""
      while (i < len && /[a-zA-Z0-9_$]/.test(input[i])) {
        id += input[i++]
      }
      if (id === "true") tokens.push({ type: "BOOLEAN", value: true })
      else if (id === "false") tokens.push({ type: "BOOLEAN", value: false })
      else if (id === "null") tokens.push({ type: "NULL", value: null })
      else if (id === "undefined") tokens.push({ type: "UNDEFINED", value: undefined })
      else if (id === "in") tokens.push({ type: "OP", value: "in" })
      else tokens.push({ type: "IDENT", value: id })
      continue
    }

    // 未知字符直接中断解析
    throw new Error(`Unexpected character: ${ch}`)
  }

  return tokens
}

function buildNormalizedContext(ctx: ExpressionContext = {}): Record<string, any> {
  const form = ctx.$form ?? ctx.form ?? {}
  const row = ctx.$row ?? ctx.row ?? {}
  const state = ctx.$state ?? ctx.state ?? {}
  const user = ctx.$user ?? ctx.user ?? {}
  const queries = ctx.$queries ?? ctx.queries ?? {}

  return {
    ...row,
    ...form,
    ...ctx,
    $form: form,
    form,
    $row: row,
    row,
    $state: state,
    state,
    $user: user,
    user,
    $queries: queries,
    queries,
  }
}

class SafeExpressionParser {
  private pos = 0
  constructor(
    private readonly tokens: Token[],
    private readonly scope: Record<string, any>,
  ) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  private consume(): Token {
    return this.tokens[this.pos++]
  }

  private match(type: TokenType, val?: string): boolean {
    const cur = this.peek()
    if (!cur || cur.type !== type) return false
    if (val !== undefined && cur.value !== val) return false
    this.pos++
    return true
  }

  parseExpression(): any {
    return this.parseTernary()
  }

  private parseTernary(): any {
    const cond = this.parseLogicalOr()
    if (this.match("OP", "?")) {
      const consequent = this.parseExpression()
      if (!this.match("OP", ":")) {
        throw new Error("Expected ':' in ternary expression")
      }
      const alternate = this.parseExpression()
      return cond ? consequent : alternate
    }
    return cond
  }

  private parseLogicalOr(): any {
    let left = this.parseLogicalAnd()
    while (this.match("OP", "||")) {
      const right = this.parseLogicalAnd()
      left = Boolean(left) || right
    }
    return left
  }

  private parseLogicalAnd(): any {
    let left = this.parseEquality()
    while (this.match("OP", "&&")) {
      const right = this.parseEquality()
      left = Boolean(left) && right
    }
    return left
  }

  private parseEquality(): any {
    let left = this.parseRelational()
    while (true) {
      const tok = this.peek()
      if (tok?.type === "OP" && ["===", "!==", "==", "!="].includes(tok.value)) {
        this.consume()
        const right = this.parseRelational()
        if (tok.value === "===" || tok.value === "==") left = left === right
        else left = left !== right
      } else {
        break
      }
    }
    return left
  }

  private parseRelational(): any {
    let left = this.parseAdditive()
    while (true) {
      const tok = this.peek()
      if (tok?.type === "OP" && [">", "<", ">=", "<=", "in"].includes(tok.value)) {
        this.consume()
        const right = this.parseAdditive()
        if (tok.value === ">") left = Number(left) > Number(right)
        else if (tok.value === "<") left = Number(left) < Number(right)
        else if (tok.value === ">=") left = Number(left) >= Number(right)
        else if (tok.value === "<=") left = Number(left) <= Number(right)
        else if (tok.value === "in") {
          left = Array.isArray(right) ? right.includes(left) : false
        }
      } else {
        break
      }
    }
    return left
  }

  private parseAdditive(): any {
    let left = this.parseMultiplicative()
    while (true) {
      const tok = this.peek()
      if (tok?.type === "OP" && (tok.value === "+" || tok.value === "-")) {
        this.consume()
        const right = this.parseMultiplicative()
        if (tok.value === "+") {
          if (typeof left === "string" || typeof right === "string") {
            left = `${left ?? ""}${right ?? ""}`
          } else {
            left = Number(left ?? 0) + Number(right ?? 0)
          }
        } else {
          left = Number(left ?? 0) - Number(right ?? 0)
        }
      } else {
        break
      }
    }
    return left
  }

  private parseMultiplicative(): any {
    let left = this.parseUnary()
    while (true) {
      const tok = this.peek()
      if (tok?.type === "OP" && ["*", "/", "%"].includes(tok.value)) {
        this.consume()
        const right = this.parseUnary()
        const rNum = Number(right)
        if (tok.value === "*") left = Number(left ?? 0) * rNum
        else if (tok.value === "/") left = rNum === 0 ? 0 : Number(left ?? 0) / rNum
        else left = rNum === 0 ? 0 : Number(left ?? 0) % rNum
      } else {
        break
      }
    }
    return left
  }

  private parseUnary(): any {
    const tok = this.peek()
    if (tok?.type === "OP" && (tok.value === "!" || tok.value === "-")) {
      this.consume()
      const arg = this.parseUnary()
      return tok.value === "!" ? !arg : -Number(arg ?? 0)
    }
    return this.parseMemberAndCall()
  }

  private parseMemberAndCall(): any {
    let obj = this.parsePrimary()

    while (true) {
      if (this.match("PUNC", ".")) {
        const propTok = this.consume()
        if (!propTok || propTok.type !== "IDENT") {
          throw new Error("Expected property identifier after '.'")
        }
        const propName = String(propTok.value)
        if (FORBIDDEN_KEYS.has(propName)) {
          throw new Error(`Forbidden property access: ${propName}`)
        }

        // 检查是否为安全白名单方法调用
        if (this.match("PUNC", "(")) {
          const args: any[] = []
          if (!this.match("PUNC", ")")) {
            do {
              args.push(this.parseExpression())
            } while (this.match("PUNC", ","))
            if (!this.match("PUNC", ")")) {
              throw new Error("Expected ')' after arguments")
            }
          }
          obj = this.invokeSafeMethod(obj, propName, args)
        } else {
          if (obj === null || obj === undefined) {
            obj = undefined
          } else if (propName === "length" && (typeof obj === "string" || Array.isArray(obj))) {
            obj = obj.length
          } else if (typeof obj === "object" && Object.prototype.hasOwnProperty.call(obj, propName)) {
            obj = obj[propName]
          } else {
            obj = undefined
          }
        }
      } else if (this.match("PUNC", "[")) {
        const indexVal = this.parseExpression()
        if (!this.match("PUNC", "]")) {
          throw new Error("Expected ']'")
        }
        const keyStr = String(indexVal)
        if (FORBIDDEN_KEYS.has(keyStr)) {
          throw new Error(`Forbidden index access: ${keyStr}`)
        }
        if (obj === null || obj === undefined) {
          obj = undefined
        } else if (Array.isArray(obj) && typeof indexVal === "number") {
          obj = obj[indexVal]
        } else if (typeof obj === "object" && Object.prototype.hasOwnProperty.call(obj, keyStr)) {
          obj = obj[keyStr]
        } else {
          obj = undefined
        }
      } else {
        break
      }
    }

    return obj
  }

  private invokeSafeMethod(target: any, methodName: string, args: any[]): any {
    if (target === null || target === undefined) return false
    const arg0 = args[0]
    if (methodName === "includes") {
      if (typeof target === "string") return target.includes(String(arg0 ?? ""))
      if (Array.isArray(target)) return target.includes(arg0)
      return false
    }
    if (methodName === "startsWith" && typeof target === "string") {
      return target.startsWith(String(arg0 ?? ""))
    }
    if (methodName === "endsWith" && typeof target === "string") {
      return target.endsWith(String(arg0 ?? ""))
    }
    if (methodName === "toLowerCase" && typeof target === "string") {
      return target.toLowerCase()
    }
    if (methodName === "toUpperCase" && typeof target === "string") {
      return target.toUpperCase()
    }
    if (methodName === "trim" && typeof target === "string") {
      return target.trim()
    }
    throw new Error(`Disallowed method call in sandbox: ${methodName}`)
  }

  private parsePrimary(): any {
    const tok = this.peek()
    if (!tok) throw new Error("Unexpected end of expression")

    if (
      tok.type === "NUMBER" ||
      tok.type === "STRING" ||
      tok.type === "BOOLEAN" ||
      tok.type === "NULL" ||
      tok.type === "UNDEFINED"
    ) {
      this.consume()
      return tok.value
    }

    if (tok.type === "IDENT") {
      this.consume()
      const name = String(tok.value)
      if (FORBIDDEN_KEYS.has(name)) {
        throw new Error(`Forbidden identifier: ${name}`)
      }
      return Object.prototype.hasOwnProperty.call(this.scope, name) ? this.scope[name] : undefined
    }

    if (this.match("PUNC", "(")) {
      const val = this.parseExpression()
      if (!this.match("PUNC", ")")) {
        throw new Error("Expected closing ')'")
      }
      return val
    }

    if (this.match("PUNC", "[")) {
      const arr: any[] = []
      if (!this.match("PUNC", "]")) {
        do {
          arr.push(this.parseExpression())
        } while (this.match("PUNC", ","))
        if (!this.match("PUNC", "]")) {
          throw new Error("Expected closing ']'")
        }
      }
      return arr
    }

    throw new Error(`Unexpected token: ${JSON.stringify(tok)}`)
  }
}

/**
 * 在零 eval 沙箱中求值单条表达式
 */
export function evaluateExpression<T = unknown>(
  exprInput: string | undefined | null,
  context: ExpressionContext = {},
  fallback?: T,
): T | undefined {
  if (exprInput === undefined || exprInput === null) return fallback
  const body = stripMustache(String(exprInput))
  if (!body) return fallback

  try {
    const tokens = tokenize(body)
    if (tokens.length === 0) return fallback
    const scope = buildNormalizedContext(context)
    const parser = new SafeExpressionParser(tokens, scope)
    const result = parser.parseExpression()
    return (result === undefined ? fallback : result) as T
  } catch {
    return fallback
  }
}

/**
 * 求值布尔条件表达式（专用于 visibleOn / disabledOn / requiredOn 联动）
 */
export function evaluateBooleanExpression(
  exprInput: string | undefined | null,
  context: ExpressionContext = {},
  defaultValue = true,
): boolean {
  if (!exprInput || !String(exprInput).trim()) return defaultValue
  const res = evaluateExpression(exprInput, context, defaultValue)
  return Boolean(res)
}

/**
 * 渲染混合字符串模板（如 "当前会员：{{ $user.nickname }}，余额 ¥{{ $form.balance / 100 }}"）
 */
export function interpolateTemplate(template: string, context: ExpressionContext = {}): string {
  if (!template || !template.includes("{{")) return template
  return template.replace(/\{\{([\s\S]*?)\}\}/g, (_match, expr) => {
    const val = evaluateExpression(expr, context, "")
    return val === null || val === undefined ? "" : String(val)
  })
}
