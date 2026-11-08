import React, { useState } from "react"
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native"
import { MemberUserApi } from "../api"
import { DEFAULT_MEMBER_SCHEMA, type MemberPublic, type PageSchema } from "../models"
import { MemberProfileCard } from "../components/MemberProfileCard"
import { SchemaDetailView, SchemaForm } from "../../../SchemaFieldRenderer"

export function MemberCenterPage({
  member,
  onMemberChange,
  schema,
  brand = "#4f46e5",
}: {
  member: MemberPublic
  onMemberChange: (m: MemberPublic) => void
  schema: PageSchema | null
  brand?: string
}) {
  const effectiveSchema =
    schema && (schema.fields?.length ?? 0) > 0 ? schema : DEFAULT_MEMBER_SCHEMA
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, unknown>>({
    memberType: "PERSONAL",
    satisfaction: 5,
    ...(member.extraFields ?? {}),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const save = async () => {
    setLoading(true)
    setError("")
    try {
      const updated = await MemberUserApi.updateProfile({ extraFields: draft })
      onMemberChange(updated)
      setDraft({ ...(updated.extraFields ?? draft) })
      setEditing(false)
    } catch (e: any) {
      setError(e?.message || "保存失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View>
      <MemberProfileCard member={member} brand={brand} />
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.h2}>{effectiveSchema.title || "扩展信息"}</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={{ color: brand, fontSize: 13 }}>{editing ? "取消" : "编辑"}</Text>
          </TouchableOpacity>
        </View>
        {editing ? (
          <>
            <SchemaForm
              fields={effectiveSchema.fields}
              values={draft}
              onChange={(k, v) => setDraft((d) => ({ ...d, [k]: v }))}
              brand={brand}
            />
            {error ? <Text style={styles.err}>{error}</Text> : null}
            <TouchableOpacity style={[styles.btn, { backgroundColor: brand }]} onPress={save} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>保存</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <SchemaDetailView fields={effectiveSchema.fields} values={draft} brand={brand} />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  h2: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  btn: {
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 4,
  },
  btnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  err: {
    color: "#dc2626",
    fontSize: 12,
    marginBottom: 8,
  },
})
