import React, { useEffect, useState } from "react"
import { SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from "react-native"
import { StatusBar } from "expo-status-bar"
import {
  MetaApi,
  MemberAuthApi,
  MemberUserApi,
  MallProductApi,
  type MallProductSpu,
  MallTradeOrderApi,
} from "./api"
import { DEMO_CREDENTIALS } from "./shared/config"
import type { Appearance, MemberPublic, PageSchema } from "./shared/types"
import { SchemaDetailView, SchemaForm } from "./SchemaFieldRenderer"
import { setPresenter } from "./shared/request"

setPresenter({
  showLoading: () => {},
  hideLoading: () => {},
  showSuccess: (message) => Alert.alert("提示", message),
  showError: (message) => Alert.alert("出错了", message),
})

export default function App() {
  const [appearance, setAppearance] = useState<Appearance | null>(null)
  const [member, setMember] = useState<MemberPublic | null>(null)
  const [schema, setSchema] = useState<PageSchema | null>(null)
  const [tab, setTab] = useState<"user" | "mall">("user")
  const [products, setProducts] = useState<MallProductSpu[]>([])
  const [orderLoading, setOrderLoading] = useState(false)

  const [account, setAccount] = useState(DEMO_CREDENTIALS.account)
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, unknown>>({})
  const [error, setError] = useState("")

  const brand = appearance?.primaryColor || "#4f46e5"

  useEffect(() => {
    MetaApi.appearance().then(setAppearance).catch(() => {})
    MetaApi.pageSchema("member_user").then(setSchema).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === "mall") {
      MallProductApi.list({ page: 1, pageSize: 10 })
        .then((res) => setProducts(res?.items ?? []))
        .catch(() => {})
    }
  }, [tab])

  const doLogin = async () => {
    setLoading(true)
    setError("")
    try {
      const { member: m } = await MemberAuthApi.login({ account, password })
      const full = await MemberUserApi.profile().catch(() => m)
      setMember(full)
      setDraft({ ...(full.extraFields ?? {}) })
    } catch (e: any) {
      setError(e?.message || "登录失败")
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    setLoading(true)
    setError("")
    try {
      const updated = await MemberUserApi.updateProfile({ extraFields: draft })
      setMember(updated)
      setDraft({ ...(updated.extraFields ?? {}) })
      setEditing(false)
    } catch (e: any) {
      setError(e?.message || "保存失败")
    } finally {
      setLoading(false)
    }
  }

  const placeOrder = async (spu: MallProductSpu) => {
    setOrderLoading(true)
    try {
      const order = await MallTradeOrderApi.create({
        no: `ORD-${Date.now()}`,
        total_price: spu.price ?? 99,
        pay_price: spu.price ?? 99,
        product_count: 1,
        remark: `购买 ${spu.name}`,
      })
      Alert.alert("下单成功", `订单编号: ${order.no || order.id}，金额: ￥${(order.pay_price ?? 0) / 100}`)
    } catch (e: any) {
      Alert.alert("下单失败", e?.message || "请稍后重试")
    } finally {
      setOrderLoading(false)
    }
  }

  const hasDynamic = (schema?.fields?.length ?? 0) > 0

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: brand }]}>{appearance?.siteName ?? "Cooliebase Portal"}</Text>

        {!member ? (
          <View style={styles.card}>
            <Text style={styles.h2}>登录</Text>
            <TextInput style={styles.input} value={account} onChangeText={setAccount} placeholder="账号" placeholderTextColor="#9ca3af" autoCapitalize="none" />
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="密码" placeholderTextColor="#9ca3af" secureTextEntry />
            {error ? <Text style={styles.err}>{error}</Text> : null}
            <TouchableOpacity style={[styles.btn, { backgroundColor: brand }]} onPress={doLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>登录</Text>}
            </TouchableOpacity>
            <Text style={styles.hint}>演示账号已预填（demo / demo123），点「登录」即可</Text>
          </View>
        ) : (
          <>
            {/* 顶栏 Tab 导航 */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, tab === "user" && { borderBottomColor: brand, borderBottomWidth: 2 }]}
                onPress={() => setTab("user")}
              >
                <Text style={[styles.tabText, tab === "user" && { color: brand, fontWeight: "600" }]}>用户中心</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tab === "mall" && { borderBottomColor: brand, borderBottomWidth: 2 }]}
                onPress={() => setTab("mall")}
              >
                <Text style={[styles.tabText, tab === "mall" && { color: brand, fontWeight: "600" }]}>商城专区</Text>
              </TouchableOpacity>
            </View>

            {tab === "user" ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.h2}>个人信息</Text>
                  <Text style={styles.name}>{member.nickname}</Text>
                  <Text style={styles.sub}>账号：{member.account} · 等级：{member.memberLevel}</Text>
                </View>

                {hasDynamic && (
                  <View style={styles.card}>
                    <View style={styles.cardHead}>
                      <Text style={styles.h2}>{schema?.title || "扩展信息"}</Text>
                      {!editing ? (
                        <TouchableOpacity onPress={() => setEditing(true)}><Text style={[styles.link, { color: brand }]}>编辑</Text></TouchableOpacity>
                      ) : (
                        <View style={{ flexDirection: "row", gap: 12 }}>
                          <TouchableOpacity onPress={() => { setEditing(false); setDraft({ ...(member.extraFields ?? {}) }) }}><Text style={styles.link}>取消</Text></TouchableOpacity>
                          <TouchableOpacity onPress={save}><Text style={[styles.link, { color: brand }]}>{loading ? "保存中…" : "保存"}</Text></TouchableOpacity>
                        </View>
                      )}
                    </View>
                    {error && editing ? <Text style={styles.err}>{error}</Text> : null}
                    {editing ? (
                      <SchemaForm fields={schema!.fields} values={draft} brand={brand} onChange={(c, v) => setDraft((d) => ({ ...d, [c]: v }))} />
                    ) : (
                      <SchemaDetailView fields={schema!.fields} values={member.extraFields ?? {}} brand={brand} />
                    )}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.card}>
                <Text style={styles.h2}>精选商品推荐</Text>
                {products.length === 0 ? (
                  <Text style={styles.sub}>暂未上架商品或商城正在同步中...</Text>
                ) : (
                  products.map((p) => (
                    <View key={p.id} style={styles.productItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.productName}>{p.name}</Text>
                        <Text style={styles.productPrice}>￥{((p.price ?? 0) / 100).toFixed(2)}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.buyBtn, { backgroundColor: brand }]}
                        onPress={() => placeOrder(p)}
                        disabled={orderLoading}
                      >
                        <Text style={styles.buyBtnText}>立即购买</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  container: { padding: 20, gap: 16 },
  title: { fontSize: 24, fontWeight: "700", marginTop: 12 },
  tabs: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb", marginBottom: 4 },
  tab: { paddingVertical: 10, paddingHorizontal: 16 },
  tabText: { fontSize: 15, color: "#6b7280" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: "#e5e7eb" },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  h2: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 8 },
  name: { fontSize: 18, fontWeight: "600", color: "#111827" },
  sub: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 10, color: "#111827" },
  btn: { borderRadius: 8, paddingVertical: 12, alignItems: "center", marginTop: 4 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  hint: { fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 10 },
  err: { color: "#ef4444", fontSize: 12, marginBottom: 8 },
  link: { fontSize: 14, color: "#6b7280" },
  productItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#f1f5f9" },
  productName: { fontSize: 15, fontWeight: "500", color: "#0f172a" },
  productPrice: { fontSize: 14, color: "#ef4444", fontWeight: "600", marginTop: 2 },
  buyBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  buyBtnText: { color: "#fff", fontSize: 13, fontWeight: "500" },
})
