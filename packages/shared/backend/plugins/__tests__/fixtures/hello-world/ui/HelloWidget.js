/**
 * 参考插件的 UI 组件（**预构建**产物形态：宿主不编译它，只按 URL 投送 + 按导出名挂载）。
 * 这里用原生 DOM 写法演示，真实插件通常由自己的构建产出 React/Vue 组件。
 */
export function HelloWidget({ pluginKey, slotId }) {
  const el = document.createElement("div")
  el.className = "rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
  el.textContent = `来自插件 ${pluginKey} 的组件（slot=${slotId}）`
  return el
}
