import React from "react"
import { View, Text, StyleSheet } from "react-native"
import type { MemberPublic } from "../models"
import { MEMBER_PORTAL_BLOCKS } from "../models"
import { MobileBlockRenderer } from "../../../SchemaFieldRenderer"

export function MemberProfileCard({ member, brand = "#4f46e5" }: { member: MemberPublic; brand?: string }) {
  return (
    <View>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: `${brand}18` }]}>
            <Text style={[styles.avatarText, { color: brand }]}>
              {(member.nickname || member.account || "U").slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{member.nickname}</Text>
            <Text style={styles.sub}>
              账号：{member.account} · 等级：{member.memberLevel || "VIP"}
            </Text>
          </View>
        </View>
      </View>
      {MEMBER_PORTAL_BLOCKS.map((block) => (
        <MobileBlockRenderer key={block.id} block={block} brand={brand} />
      ))}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  sub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
})
