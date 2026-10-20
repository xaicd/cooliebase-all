/**
 * 压测判定的三态。
 *
 * 为什么需要区分 `inconclusive` 与 `failed`：本仓实测过一台 12 核但被虚拟化实例
 * 压住的机器 —— 吞吐从 ~26,900 rps 掉到 ~2,700，护栏如实报红。
 * 那次**红是对的**（吞吐确实塌了），但如果只报"失败"，下一个人会先去查代码，
 * 而真实原因是机器过载；反过来若因为负载高就放行，那就是假绿。
 *
 * 所以这里既不放过也不误判：**没测准就说没测准**，并要求换环境重跑。
 *
 * 判据：1 分钟负载 ≥ 核数 ⇒ 机器已过载 ⇒ 吞吐塌陷不能归因于代码。
 */
function loadVerdict({ failed, loadavg1, cores }) {
  if (!(failed > 0)) return "passed"
  const ratio = cores > 0 ? loadavg1 / cores : Number.POSITIVE_INFINITY
  return ratio >= 1 ? "inconclusive" : "failed"
}

module.exports = { loadVerdict }
