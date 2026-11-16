<script setup lang="ts">
import { computed, ref } from "vue"
import { resolveApiBaseUrl } from "@/utils/request"

const appTitle = computed(() => import.meta.env.VITE_APP_TITLE || "企业数字化门户")
const apiBase = computed(() => resolveApiBaseUrl())

const quickCards = ref([
  { id: "notice", title: "通知公告", desc: "企业动态与制度播报", badge: "协同" },
  { id: "approval", title: "移动审批", desc: "待办单据一跳签批", badge: "流转" },
  { id: "order", title: "业务查询", desc: "订单与履约实时追踪", badge: "在线" },
  { id: "report", title: "经营速览", desc: "核心指标掌上洞察", badge: "数据" },
])
</script>

<template>
  <section class="page-section" data-testid="miniapp-page-home">
    <header class="hero-card">
      <p class="hero-tag">四端同源 · 小程序与 H5</p>
      <h1 class="hero-title">{{ appTitle }}</h1>
      <p class="hero-sub">接口端点：{{ apiBase }}</p>
    </header>

    <div class="card-grid">
      <article v-for="item in quickCards" :key="item.id" class="feature-card">
        <div class="card-head">
          <span class="card-title">{{ item.title }}</span>
          <span class="card-badge">{{ item.badge }}</span>
        </div>
        <p class="card-desc">{{ item.desc }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.page-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.hero-card {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f8fafc;
  border-radius: 16px;
  padding: 20px;
}
.hero-tag {
  font-size: 12px;
  color: #94a3b8;
  margin: 0 0 6px;
}
.hero-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 6px;
}
.hero-sub {
  font-size: 12px;
  color: #cbd5e1;
  margin: 0;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.feature-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}
.card-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #334155;
}
.card-desc {
  margin: 0;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}
</style>
