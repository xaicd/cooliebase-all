/**
 * 严格 JSON 重复键检测。
 *
 * 为什么需要：`JSON.parse` **不报错**，重复键静默取最后一个 —— 于是前面那份定义
 * 就成了死代码，而任何门禁都看不出来。
 *
 * 实测代价（2026-10-20）：`package.json` 里 `test:all` 出现两次 ——
 *   第 1 个：`bash scripts/lifecycle.sh . test`（某提交声明"新增 test:all"）
 *   第 2 个：`vitest run test/unit test/integration && playwright test`（更早就有）
 * 后者胜出，于是那次"新增"**从未生效**，而执行 test:all 时看起来一切正常。
 *
 * 这里不引入依赖：手写一个只关心"对象内键是否重复"的扫描器。
 * 它不是通用 JSON 解析器 —— 只走词法、跳过字符串与转义，不做类型校验。
 * 输入非法时会抛错；调用方据此把"JSON 坏了"也算作违规。
 */

/** 跳过字符串字面量，返回结束引号之后的下标。 */
function skipString(text, start) {
  // text[start] === '"'
  let i = start + 1
  while (i < text.length) {
    const ch = text[i]
    if (ch === "\\") {
      i += 2
      continue
    }
    if (ch === '"') return i + 1
    i += 1
  }
  throw new Error("字符串未闭合")
}

/**
 * 找出 text 里所有对象作用域内的重复键。
 * @returns {{ key: string, line: number, firstLine: number }[]}
 */
function findDuplicateKeys(text) {
  const duplicates = []
  // 栈元素: { keys: Map<string, number>, expectingKey: boolean }
  const stack = []
  let i = 0
  let line = 1

  const bump = (from, to) => {
    for (let k = from; k < to; k += 1) if (text[k] === "\n") line += 1
  }

  while (i < text.length) {
    const ch = text[i]

    if (ch === "\n") {
      line += 1
      i += 1
      continue
    }
    if (ch === '"') {
      const end = skipString(text, i)
      const raw = text.slice(i, end)
      const keyLine = line
      bump(i, end)
      i = end

      // 判断这个字符串是不是"键"：当前在对象里，且它的下一个非空白字符是 ':'
      let j = i
      while (j < text.length && /\s/.test(text[j])) j += 1
      if (stack.length > 0 && text[j] === ":") {
        const top = stack[stack.length - 1]
        if (top.kind === "object") {
          if (top.keys.has(raw)) {
            duplicates.push({ key: JSON.parse(raw), line: keyLine, firstLine: top.keys.get(raw) })
          } else {
            top.keys.set(raw, keyLine)
          }
        }
      }
      continue
    }

    if (ch === "{") {
      stack.push({ kind: "object", keys: new Map() })
      i += 1
      continue
    }
    if (ch === "[") {
      stack.push({ kind: "array" })
      i += 1
      continue
    }
    if (ch === "}" || ch === "]") {
      stack.pop()
      i += 1
      continue
    }
    i += 1
  }

  return duplicates
}

module.exports = { findDuplicateKeys }
