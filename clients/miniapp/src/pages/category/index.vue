<script setup lang="ts">
import { computed, ref } from "vue"

const activeGroup = ref("enterprise")
const groups = [
  { id: "enterprise", label: "政企协同" },
  { id: "commerce", label: "交易服务" },
  { id: "supply", label: "供应链" },
]

const itemsByGroup: Record<string, Array<{ code: string; name: string; summary: string }>> = {
  enterprise: [
    { code: "oa", name: "协同办公", summary: "通知公告、考勤打卡、请假用印" },
    { code: "hrm", name: "人力资源", summary: "员工档案、岗位编制、薪资核算" },
    { code: "fms", name: "财务管理", summary: "资金账户、收支凭证、对账结算" },
    { code: "pms", name: "项目管理", summary: "项目台账、里程碑、任务工时" },
  ],
  commerce: [
    { code: "mall", name: "数字商城", summary: "商品目录、订单履约、售后闭环" },
    { code: "member", name: "会员中心", summary: "会员等级、积分权益、身份认证" },
    { code: "pay", name: "聚合支付", summary: "收银结算、渠道对账、原路退款" },
  ],
  supply: [
    { code: "erp", name: "进销存", summary: "采购入库、销售出库、往来结算" },
    { code: "wms", name: "智能仓储", summary: "库位管理、出入移盘、批次追溯" },
    { code: "mes", name: "生产执行", summary: "生产工单、工序报工、质检追溯" },
  ],
}

const currentItems = computed(() => itemsByGroup[activeGroup.value] || [])
</script>

<template>
  <section class="category-layout" data-testid="miniapp-page-category">
    <aside class="group-nav">
      <button
        v-for="g in groups"
        :key="g.id"
        type="button"
        class="group-btn"
        :class="{ active: activeGroup === g.id }"
        @click="activeGroup = g.id"
      >
        {{ g.label }}
      </button>
    </aside>

    <div class="group-list">
      <article v-for="item in currentItems" :key="item.code" class="domain-row">
        <div class="domain-title">{{ item.name }}</div>
        <p class="domain-summary">{{ item.summary }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.category-layout {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 12px;
}
.group-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.group-btn {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  border-radius: 10px;
  padding: 10px 8px;
  font-size: 13px;
  cursor: pointer;
}
.group-btn.active {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
  font-weight: 600;
}
.group-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.domain-row {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
}
.domain-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 4px;
}
.domain-summary {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}
</style>
