<script setup lang="ts">
import { computed, ref } from "vue"
import { clearTokens, getAccessToken, wxSilentLogin } from "@/utils/request"

const tokenState = ref(getAccessToken())
const authHint = ref("")
const loggedIn = computed(() => Boolean(tokenState.value))

async function handleSilentAuth() {
  authHint.value = "正在请求静默授权..."
  try {
    const bundle = await wxSilentLogin()
    tokenState.value = bundle?.accessToken || getAccessToken()
    authHint.value = bundle?.accessToken ? "微信静默授权成功" : "当前为 H5 预览环境，已就绪"
  } catch (err) {
    authHint.value = err instanceof Error ? err.message : "授权检测完成"
  }
}

function handleLogout() {
  clearTokens()
  tokenState.value = ""
  authHint.value = "已清除本地会话凭证"
}
</script>

<template>
  <section class="profile-wrap" data-testid="miniapp-page-profile">
    <div class="profile-card">
      <div class="avatar">企</div>
      <div class="profile-meta">
        <div class="profile-name">{{ loggedIn ? "已认证成员" : "访客模式" }}</div>
        <div class="profile-sub">渠道标识：X-Client-Channel = miniapp</div>
      </div>
    </div>

    <div class="action-card">
      <button type="button" class="primary-btn" @click="handleSilentAuth">微信静默登录</button>
      <button v-if="loggedIn" type="button" class="secondary-btn" @click="handleLogout">退出登录</button>
      <p v-if="authHint" class="auth-hint">{{ authHint }}</p>
    </div>
  </section>
</template>

<style scoped>
.profile-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.profile-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
}
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #0f172a;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
}
.profile-name {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}
.profile-sub {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}
.action-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.primary-btn {
  border: none;
  border-radius: 10px;
  background: #0f172a;
  color: #ffffff;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.secondary-btn {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #ffffff;
  color: #334155;
  padding: 10px;
  font-size: 13px;
  cursor: pointer;
}
.auth-hint {
  margin: 0;
  font-size: 12px;
  color: #475569;
  text-align: center;
}
</style>
