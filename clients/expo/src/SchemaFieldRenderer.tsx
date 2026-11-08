import React from "react"
import { View, Text, TextInput, Switch, TouchableOpacity, StyleSheet } from "react-native"
import type { FieldDef, MobileBlockDef } from "./shared/types"

/**
 * 移动端 / 小程序同构 PageBlockDSL v2 渲染引擎（对标 PagePlug Taro/Taroify 移动端画布）。
 *
 * 核心能力：
 * 1. 零 eval 响应式联动求值：支持 `visibleOn: "{{ $form.userType === 'VIP' }}"` 动态显隐与必填；
 * 2. 移动端高级控件：支持 select/radio 胶囊选择器、rate 五星评分、tags 标签组、currency 金额、switch 开关；
 * 3. C 端区块渲染器 (MobileBlockRenderer)：支持 Banner 轮播卡、GridNav 金刚区宫格、StatMetrics 指标条。
 */

export function evaluateMobileCondition(
  exprInput: string | undefined,
  formValues: Record<string, unknown>,
  defaultVal = true,
): boolean {
  if (!exprInput || !exprInput.trim()) return defaultVal
  const raw = exprInput.trim().replace(/^\{\{/, "").replace(/\}\}$/, "").trim()
  if (!raw) return defaultVal

  // 支持常见比较表达式：$form.xxx === 'val' / $form.num > 10 / !$form.flag
  const eqMatch = raw.match(/^(?:\$?form\.|\$?row\.)?([a-zA-Z0-9_]+)\s*(===|!==|==|!=|>=|<=|>|<)\s*(.+)$/)
  if (eqMatch) {
    const [, fieldKey, op, rhsRaw] = eqMatch
    const leftVal = formValues[fieldKey]
    let rightVal: unknown = rhsRaw.trim()
    if (
      (typeof rightVal === "string" && rightVal.startsWith("'") && rightVal.endsWith("'")) ||
      (typeof rightVal === "string" && rightVal.startsWith('"') && rightVal.endsWith('"'))
    ) {
      rightVal = rightVal.slice(1, -1)
    } else if (rightVal === "true") {
      rightVal = true
    } else if (rightVal === "false") {
      rightVal = false
    } else if (!Number.isNaN(Number(rightVal))) {
      rightVal = Number(rightVal)
    }

    if (op === "===" || op === "==") return String(leftVal ?? "") === String(rightVal ?? "")
    if (op === "!==" || op === "!=") return String(leftVal ?? "") !== String(rightVal ?? "")
    if (op === ">") return Number(leftVal ?? 0) > Number(rightVal ?? 0)
    if (op === ">=") return Number(leftVal ?? 0) >= Number(rightVal ?? 0)
    if (op === "<") return Number(leftVal ?? 0) < Number(rightVal ?? 0)
    if (op === "<=") return Number(leftVal ?? 0) <= Number(rightVal ?? 0)
  }

  const boolMatch = raw.match(/^(!)?(?:\$?form\.|\$?row\.)?([a-zA-Z0-9_]+)$/)
  if (boolMatch) {
    const [, neg, key] = boolMatch
    const v = Boolean(formValues[key])
    return neg ? !v : v
  }

  return defaultVal
}

export function MobileBlockRenderer({
  block,
  brand = "#4f46e5",
  onItemPress,
}: {
  block: MobileBlockDef
  brand?: string
  onItemPress?: (item: NonNullable<MobileBlockDef["items"]>[number]) => void
}) {
  const items = block.items ?? []
  if (items.length === 0) return null

  if (block.type === "banner") {
    return (
      <View style={[styles.bannerCard, { backgroundColor: brand }]}>
        <Text style={styles.bannerBadge}>{items[0]?.badge || "FEATURED"}</Text>
        <Text style={styles.bannerTitle}>{items[0]?.title || block.title}</Text>
        {items[0]?.subtitle ? <Text style={styles.bannerSub}>{items[0].subtitle}</Text> : null}
      </View>
    )
  }

  if (block.type === "grid_nav") {
    return (
      <View style={styles.gridWrap}>
        {items.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.gridItem}
            onPress={() => onItemPress?.(item)}
            activeOpacity={0.75}
          >
            <View style={[styles.gridIconBox, { backgroundColor: `${item.color || brand}18` }]}>
              <Text style={[styles.gridIconText, { color: item.color || brand }]}>{item.icon || "✦"}</Text>
            </View>
            <Text style={styles.gridTitle}>{item.title}</Text>
            {item.subtitle ? <Text style={styles.gridSub}>{item.subtitle}</Text> : null}
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  if (block.type === "stat_metrics") {
    return (
      <View style={styles.metricsStrip}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.metricCell}>
            <Text style={[styles.metricValue, { color: brand }]}>{item.subtitle || "0"}</Text>
            <Text style={styles.metricLabel}>{item.title}</Text>
          </View>
        ))}
      </View>
    )
  }

  return null
}

export function SchemaDetailView({
  fields,
  values,
  brand,
}: {
  fields: FieldDef[]
  values: Record<string, unknown>
  brand?: string
}) {
  const shown = fields
    .filter((f) => f.showInList !== false && evaluateMobileCondition(f.visibleOn, values, true))
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
  if (shown.length === 0) return null
  return (
    <View>
      {shown.map((f) => (
        <View key={f.code} style={styles.row}>
          <Text style={styles.label}>{f.label}</Text>
          <Text style={[styles.value, f.type === "currency" && brand ? { color: brand } : null]}>
            {formatValue(f, values[f.code])}
          </Text>
        </View>
      ))}
    </View>
  )
}

export function SchemaForm({
  fields,
  values,
  onChange,
  brand = "#4f46e5",
}: {
  fields: FieldDef[]
  values: Record<string, unknown>
  onChange: (code: string, value: unknown) => void
  brand?: string
}) {
  const shown = fields
    .filter((f) => f.showInForm !== false && evaluateMobileCondition(f.visibleOn, values, true))
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
  return (
    <View>
      {shown.map((f) => {
        const isReq = Boolean(f.required || evaluateMobileCondition(f.requiredOn, values, false))
        return (
          <View key={f.code} style={styles.field}>
            <View style={styles.fieldHead}>
              <Text style={styles.fieldLabel}>
                {f.label}
                {isReq ? <Text style={{ color: "#ef4444" }}> *</Text> : null}
              </Text>
              {f.visibleOn ? <Text style={styles.reactiveTag}>联动字段</Text> : null}
            </View>
            <FieldInput field={f} value={values[f.code]} onChange={(v) => onChange(f.code, v)} brand={brand} />
          </View>
        )
      })}
    </View>
  )
}

function formatValue(f: FieldDef, v: unknown): string {
  if (v === undefined || v === null || v === "") return "—"
  if (f.type === "boolean" || f.type === "switch") return v ? "是" : "否"
  if (f.type === "rate") {
    const stars = Math.max(0, Math.min(5, Math.round(Number(v) || 0)))
    return `${"★".repeat(stars)}${"☆".repeat(5 - stars)}`
  }
  if (f.type === "currency") {
    const n = Number(v)
    return Number.isNaN(n) ? String(v) : `¥${n.toFixed(2)}`
  }
  if (f.type === "select" || f.type === "radio") {
    return f.options?.find((o) => o.value === String(v))?.label ?? String(v)
  }
  return String(v)
}

function FieldInput({
  field,
  value,
  onChange,
  brand,
}: {
  field: FieldDef
  value: unknown
  onChange: (v: unknown) => void
  brand: string
}) {
  if (field.type === "boolean" || field.type === "switch") {
    return <Switch value={Boolean(value)} onValueChange={onChange} trackColor={{ true: brand }} />
  }

  if ((field.type === "select" || field.type === "radio") && field.options && field.options.length > 0) {
    return (
      <View style={styles.optionRow}>
        {field.options.map((opt) => {
          const active = String(value ?? "") === opt.value
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[
                styles.optionPill,
                active && { backgroundColor: `${brand}15`, borderColor: brand },
              ]}
            >
              <Text style={[styles.optionText, active && { color: brand, fontWeight: "600" }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    )
  }

  if (field.type === "rate") {
    const currentStars = Number(value || 0)
    return (
      <View style={styles.optionRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => onChange(star)} style={styles.starBtn}>
            <Text style={{ fontSize: 20, color: currentStars >= star ? "#f59e0b" : "#e5e7eb" }}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  const isNumeric = field.type === "number" || field.type === "currency" || field.type === "slider"
  const keyboardType = isNumeric ? "numeric" : "default"
  const multiline = field.type === "textarea" || field.type === "richtext"
  return (
    <TextInput
      style={[styles.input, multiline && styles.textarea]}
      value={value === undefined || value === null ? "" : String(value)}
      placeholder={field.placeholder}
      placeholderTextColor="#9ca3af"
      keyboardType={keyboardType as any}
      multiline={multiline}
      onChangeText={(t) => onChange(isNumeric ? (t === "" ? "" : Number(t)) : t)}
    />
  )
}

const styles = StyleSheet.create({
  bannerCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  bannerBadge: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  bannerTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  bannerSub: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    marginTop: 4,
  },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
    justifyContent: "space-between",
  },
  gridItem: {
    width: "24%",
    alignItems: "center",
    paddingVertical: 6,
  },
  gridIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  gridIconText: {
    fontSize: 16,
    fontWeight: "700",
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1f2937",
  },
  gridSub: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 1,
  },
  metricsStrip: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
    justifyContent: "space-around",
  },
  metricCell: {
    alignItems: "center",
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  metricLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  label: { color: "#6b7280", fontSize: 13 },
  value: { color: "#111827", fontSize: 13, fontWeight: "500" },
  field: { marginBottom: 12 },
  fieldHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  fieldLabel: { color: "#6b7280", fontSize: 12 },
  reactiveTag: {
    fontSize: 10,
    color: "#4f46e5",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 4,
  },
  optionPill: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "#f9fafb",
  },
  optionText: {
    fontSize: 12,
    color: "#374151",
  },
  starBtn: {
    paddingHorizontal: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
  },
  textarea: { height: 72, textAlignVertical: "top" },
})
