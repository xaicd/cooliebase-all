import React, { useEffect, useState } from "react"
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native"
import { StatusBar } from "expo-status-bar"
import { MetaApi, MemberAuthApi, MemberUserApi } from "../api"
import { DEMO_CREDENTIALS } from "../shared/config"
import type { Appearance, MemberPublic, PageSchema } from "../shared/types"
import { setPresenter } from "../shared/request"
import { CLIENT_DOMAIN_MODULES } from "../modules"

setPresenter({
  showLoading: () => {},
  hideLoading: () => {},
  showSuccess: (message) => Alert.alert("提示", message),
  showError: (message) => Alert.alert("出错了", message),
})

export function AppShell() {
  const [appearance, setAppearance] = useState<Appearance | null>(null)
  const [member, setMember] = useState<MemberPublic | null>(null)
  const [schema, setSchema] = useState<PageSchema | null>(null)
  const [tab, setTab] = useState<string>(CLIENT_DOMAIN_MODULES[0]?.tabId ?? "user")

  const [account, setAccount] = useState(DEMO_CREDENTIALS.account)
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const brand = appearance?.primaryColor || "#4f46e5"

  useEffect(() => {
    MetaApi.appearance().then(setAppearance).catch(() => {})
    MetaApi.pageSchema("member_user").then(setSchema).catch(() => {})
  }, [])

  const doLogin = async () => {
    setLoading(true)
    setError("")
    try {
      const { member: m } = await MemberAuthApi.login({ account, password })
      const full = await MemberUserApi.profile().catch(() => m)
      setMember(full)
    } catch (e: any) {
      setError(e?.message || "登录失败")
    } finally {
      setLoading(false)
    }
  }

  const activeModule =
    CLIENT_DOMAIN_MODULES.find((m) => m.tabId === tab) ?? CLIENT_DOMAIN_MODULES[0]
  const ActivePageComponent = activeModule?.Component as any

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: brand }]}>{appearance?.siteName ?? "Cooliebase Portal"}</Text>

        {!member ? (
          <View style={styles.card}>
            <Text style={styles.h2}>登录</Text>
            <TextInput
              style={styles.input}
              value={account}
              onChangeText={setAccount}
              placeholder="账号"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="密码"
              placeholderTextColor="#9ca3af"
              secureTextEntry
            />
            {error ? <Text style={styles.err}>{error}</Text> : null}
            <TouchableOpacity style={[styles.btn, { backgroundColor: brand }]} onPress={doLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>登录</Text>}
            </TouchableOpacity>
            <Text style={styles.hint}>演示账号已预填（demo / demo123），点「登录」即可</Text>
          </View>
        ) : (
          <>
            {CLIENT_DOMAIN_MODULES.length > 1 && (
              <View style={styles.tabs}>
                {CLIENT_DOMAIN_MODULES.map((mod) => (
                  <TouchableOpacity
                    key={mod.domain}
                    style={[styles.tab, tab === mod.tabId && { borderBottomColor: brand, borderBottomWidth: 2 }]}
                    onPress={() => setTab(mod.tabId)}
                  >
                    <Text style={[styles.tabText, tab === mod.tabId && { color: brand, fontWeight: "600" }]}>
                      {mod.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {ActivePageComponent ? (
              <ActivePageComponent
                member={member}
                onMemberChange={setMember}
                schema={schema}
                brand={brand}
              />
            ) : null}

            <TouchableOpacity style={styles.logout} onPress={() => setMember(null)}>
              <Text style={{ color: "#6b7280", fontSize: 13 }}>退出登录</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  container: { padding: 20, maxWidth: 480, width: "100%", alignSelf: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  h2: { fontSize: 15, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    marginBottom: 10,
    color: "#111827",
  },
  btn: { borderRadius: 8, paddingVertical: 11, alignItems: "center", marginTop: 4 },
  btnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  err: { color: "#dc2626", fontSize: 12, marginBottom: 8 },
  hint: { color: "#9ca3af", fontSize: 11, marginTop: 8, textAlign: "center" },
  logout: { alignItems: "center", paddingVertical: 12 },
  tabs: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabText: { fontSize: 14, color: "#6b7280" },
})
