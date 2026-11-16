<script setup lang="ts">
import { computed, ref } from "vue"
import HomePage from "./pages/index/index.vue"
import CategoryPage from "./pages/category/index.vue"
import WorkspacePage from "./pages/workspace/index.vue"
import ProfilePage from "./pages/profile/index.vue"

type TabKey = "index" | "category" | "workspace" | "profile"

const activeTab = ref<TabKey>("index")

const tabs: Array<{ key: TabKey; text: string; pagePath: string }> = [
  { key: "index", text: "首页", pagePath: "pages/index/index" },
  { key: "category", text: "分类", pagePath: "pages/category/index" },
  { key: "workspace", text: "工作台", pagePath: "pages/workspace/index" },
  { key: "profile", text: "我的", pagePath: "pages/profile/index" },
]

const currentTitle = computed(() => tabs.find((t) => t.key === activeTab.value)?.text || "首页")

function switchTab(tab: { key: TabKey; pagePath: string }) {
  activeTab.value = tab.key
  if (typeof uni !== "undefined" && typeof uni.switchTab === "function") {
    uni.switchTab({ url: `/${tab.pagePath}` })
  }
}
</script>

<template>
  <div class="miniapp-shell">
    <header class="nav-bar">
      <span class="nav-title">{{ currentTitle }}</span>
    </header>

    <main class="page-body">
      <HomePage v-if="activeTab === 'index'" />
      <CategoryPage v-else-if="activeTab === 'category'" />
      <WorkspacePage v-else-if="activeTab === 'workspace'" />
      <ProfilePage v-else />
    </main>

    <nav class="tab-bar" role="tablist" aria-label="底部导航">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        role="tab"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        :aria-selected="activeTab === tab.key"
        @click="switchTab(tab)"
      >
        <span class="tab-label">{{ tab.text }}</span>
      </button>
    </nav>
  </div>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
}
html,
body {
  margin: 0;
  padding: 0;
  background: #f8fafc;
  color: #0f172a;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
}
.miniapp-shell {
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));
}
.nav-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  height: 46px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}
.page-body {
  flex: 1;
  padding: 14px;
}
.tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  max-width: 480px;
  margin: 0 auto;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  z-index: 20;
}
.tab-item {
  height: 52px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tab-item.active {
  color: #0f172a;
  font-weight: 700;
}
</style>
