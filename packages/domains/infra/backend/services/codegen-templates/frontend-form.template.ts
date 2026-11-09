import {
  type CodegenConfig,
  type CodegenOutput,
  formColumns,
  getFrontendPath,
  toKebab,
  jsxText,
  resolveColumnEnum,
} from "./common"

export function generateFormComponent(config: CodegenConfig): CodegenOutput {
  const { className, moduleName, businessName, submodule } = config
  const sub = submodule ? `/${submodule}` : ""
  const kebab = toKebab(className)
  const writeCols = formColumns(config)
  const hasReactiveExpr = writeCols.some((c) => Boolean(c.visibleOn || c.requiredOn || c.disabledOn))

  const wrapReactiveField = (c: typeof writeCols[number], innerJsx: string) => {
    if (!c.visibleOn) return innerJsx
    return `        {evaluateBooleanExpression(${JSON.stringify(c.visibleOn)}, { $form: formData }) && (\n${innerJsx}\n        )}`
  }

  const formFields = writeCols.map((c) => {
    const label = jsxText(c.comment) || c.name
    const resolvedEnum = resolveColumnEnum(c)
    const isStaticallyRequired = c.formValidation === "required" || !c.nullable
    const requiredAttr = c.requiredOn
      ? `required={evaluateBooleanExpression(${JSON.stringify(c.requiredOn)}, { $form: formData })}`
      : isStaticallyRequired
        ? "required"
        : ""
    const disabledAttr = c.disabledOn
      ? `disabled={evaluateBooleanExpression(${JSON.stringify(c.disabledOn)}, { $form: formData })}`
      : ""

    if (c.widget === "sub_table") {
      const subCols = c.subFields?.length
        ? c.subFields
        : [
            { name: "title", label: "明细名称" },
            { name: "qty", label: "数量" },
          ]
      const subHeaders = subCols.map((sf) => `<th className="px-2 py-1 text-left text-[11px] text-slate-500">${jsxText(sf.label)}</th>`).join("")
      const subInputs = subCols
        .map(
          (sf) =>
            `<td className="px-2 py-1"><input type="text" value={String(row.${sf.name} ?? "")} onChange={(e) => { const next = [...(Array.isArray(formData.${c.name}) ? formData.${c.name} : [])]; next[idx] = { ...next[idx], ${sf.name}: e.target.value }; setFormData((prev) => ({ ...prev, ${c.name}: next })); }} className="w-full px-2 py-1 text-xs border border-slate-200 rounded" placeholder="${jsxText(sf.label)}" /></td>`,
        )
        .join("")
      const defaultRowObj = JSON.stringify(Object.fromEntries(subCols.map((sf) => [sf.name, ""])))
      return wrapReactiveField(
        c,
        `        <div data-testid="subtable-${c.name}" className="border border-slate-200 rounded-lg p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">${label}（主子表明细）</span>
            <button
              type="button"
              data-testid="subtable-add-${c.name}"
              onClick={() => setFormData((prev) => ({ ...prev, ${c.name}: [...(Array.isArray(prev.${c.name}) ? prev.${c.name} : []), ${defaultRowObj}] }))}
              className="px-2 py-0.5 text-[11px] bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100"
            >
              + 添加明细行
            </button>
          </div>
          <table className="min-w-full divide-y divide-slate-200">
            <thead><tr>${subHeaders}<th className="px-2 py-1 text-right text-[11px] text-slate-500">操作</th></tr></thead>
            <tbody>
              {(Array.isArray(formData.${c.name}) ? formData.${c.name} : []).map((row: Record<string, unknown>, idx: number) => (
                <tr key={idx}>
                  ${subInputs}
                  <td className="px-2 py-1 text-right">
                    <button type="button" onClick={() => setFormData((prev) => ({ ...prev, ${c.name}: (Array.isArray(prev.${c.name}) ? prev.${c.name} : []).filter((_: unknown, i: number) => i !== idx) }))} className="text-xs text-rose-600">移除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>`,
      )
    }

    if (resolvedEnum) {
      const options = resolvedEnum.values
        .map((v) => `          <option value="${v}">${jsxText(resolvedEnum.labels[v] ?? "") || v}</option>`)
        .join("\n")
      return wrapReactiveField(
        c,
        `        <div>
          <label htmlFor="${kebab}-${c.name}" className="block text-xs text-slate-600 mb-1">${label}${isStaticallyRequired ? " *" : ""}</label>
          <select
            id="${kebab}-${c.name}"
            data-testid="field-${c.name}"
            data-agent-target="${kebab}:field:${c.name}"
            data-agent-state={formData.${c.name} ? "filled" : "empty"}
            aria-label="${label}"
            value={String(formData.${c.name} ?? "")}
            onChange={(e) => setFormData((prev) => ({ ...prev, ${c.name}: e.target.value }))}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            ${requiredAttr}
            ${disabledAttr}
          >
            <option value="">请选择</option>
${options}
          </select>
        </div>`,
      )
    }
    if (c.tsType === "boolean" || c.widget === "switch") {
      return wrapReactiveField(
        c,
        `        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="${kebab}-${c.name}"
            data-testid="field-${c.name}"
            data-agent-target="${kebab}:field:${c.name}"
            data-agent-state={formData.${c.name} ? "on" : "off"}
            aria-label="${label}"
            checked={Boolean(formData.${c.name})}
            onChange={(e) => setFormData((prev) => ({ ...prev, ${c.name}: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            ${disabledAttr}
          />
          <label htmlFor="${kebab}-${c.name}" className="text-xs text-slate-700 font-medium">${label}</label>
        </div>`,
      )
    }
    if (c.widget === "textarea" || c.widget === "rich_text") {
      return wrapReactiveField(
        c,
        `        <div>
          <label htmlFor="${kebab}-${c.name}" className="block text-xs text-slate-600 mb-1">${label}${isStaticallyRequired ? " *" : ""}</label>
          <textarea
            id="${kebab}-${c.name}"
            data-testid="field-${c.name}"
            data-agent-target="${kebab}:field:${c.name}"
            data-agent-state={formData.${c.name} ? "filled" : "empty"}
            aria-label="${label}"
            rows={3}
            value={formData.${c.name} ?? ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, ${c.name}: e.target.value }))}
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="请输入${label}"
            ${requiredAttr}
            ${disabledAttr}
          />
        </div>`,
      )
    }
    if (c.tsType === "number") {
      return wrapReactiveField(
        c,
        `        <div>
          <label htmlFor="${kebab}-${c.name}" className="block text-xs text-slate-600 mb-1">${label}${isStaticallyRequired ? " *" : ""}</label>
          <input
            type="number"
            id="${kebab}-${c.name}"
            data-testid="field-${c.name}"
            data-agent-target="${kebab}:field:${c.name}"
            data-agent-state={formData.${c.name} == null || formData.${c.name} === "" ? "empty" : "filled"}
            aria-label="${label}"
            value={formData.${c.name} != null ? String(formData.${c.name}) : ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, ${c.name}: e.target.value === "" ? undefined : Number(e.target.value) }))}
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="请输入${label}"
            ${requiredAttr}
            ${disabledAttr}
          />
        </div>`,
      )
    }
    return wrapReactiveField(
      c,
      `        <div>
          <label htmlFor="${kebab}-${c.name}" className="block text-xs text-slate-600 mb-1">${label}${isStaticallyRequired ? " *" : ""}</label>
          <input
            type="text"
            id="${kebab}-${c.name}"
            data-testid="field-${c.name}"
            data-agent-target="${kebab}:field:${c.name}"
            data-agent-state={formData.${c.name} ? "filled" : "empty"}
            aria-label="${label}"
            value={formData.${c.name} ?? ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, ${c.name}: e.target.value }))}
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="请输入${label}"
            ${requiredAttr}
            ${disabledAttr}
          />
        </div>`,
    )
  }).join("\n\n")

  const initFields = writeCols.map((c) => {
    if (c.tsType === "boolean") return `    ${c.name}: initialData?.${c.name} ?? false,`
    if (c.tsType === "number") return `    ${c.name}: initialData?.${c.name} ?? undefined,`
    return `    ${c.name}: initialData?.${c.name} ?? "",`
  }).join("\n")

  const exprImport = hasReactiveExpr
    ? `import { evaluateBooleanExpression } from "@/shared/frontend/lib/expression-engine"\n`
    : ""

  const content = `// Auto-generated by Codegen Engine\n"use client"

import React, { useState, useEffect } from "react"
import { ${className}Api } from "../api/${kebab}.api"
${exprImport}import type { ${className}CreateDTO, ${className}VO } from "@/modules/${moduleName}${sub}/backend/types/${kebab}.types"

interface ${className}FormProps {
  open: boolean
  initialData?: ${className}VO | null
  onClose: () => void
  onSuccess: () => void
}

export function ${className}Form({ open, initialData, onClose, onSuccess }: ${className}FormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})

  useEffect(() => {
    if (open) {
      setError(null)
      setFormData({
${initFields}
      })
    }
  }, [open, initialData])

  if (!open) return null

  const isEdit = Boolean(initialData?.id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (isEdit && initialData?.id) {
        await ${className}Api.update({ id: initialData.id, ...formData } as any)
      } else {
        await ${className}Api.create(formData as ${className}CreateDTO)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err?.message || "操作失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div data-testid="${kebab}-form-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "编辑${businessName}" : "新增${businessName}"}
        data-testid="${kebab}-form"
        data-agent-scope="${kebab}:form"
        data-agent-state={loading ? "submitting" : error ? "error" : "open"}
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">
            {isEdit ? "编辑${businessName}" : "新增${businessName}"}
          </h3>
          <button onClick={onClose} data-testid="${kebab}-form-close" data-agent-target="${kebab}:close" aria-label="关闭" className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
            {error && (
              <div data-testid="${kebab}-form-error" role="alert" className="p-2 text-xs text-red-600 bg-red-50 rounded border border-red-200">{error}</div>
            )}
${formFields}
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              data-testid="${kebab}-form-cancel"
              data-agent-target="${kebab}:cancel"
              className="px-4 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-300 rounded hover:bg-slate-100 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              data-testid="${kebab}-form-submit"
              data-agent-target="${kebab}:submit"
              data-agent-state={loading ? "busy" : "idle"}
              className="px-4 py-1.5 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
`
  return { path: `${getFrontendPath(config)}/components/${className}Form.tsx`, content, type: "component" }
}
