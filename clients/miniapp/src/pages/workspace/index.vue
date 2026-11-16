<script setup lang="ts">
import { ref } from "vue"

const tasks = ref([
  { id: "T-01", title: "考勤签到", status: "今日正常", time: "08:56" },
  { id: "T-02", title: "用印申请审批", status: "待处理", time: "10:15" },
  { id: "T-03", title: "项目里程碑核验", status: "进行中", time: "14:00" },
  { id: "T-04", title: "月度对账单复核", status: "已就绪", time: "16:30" },
])
</script>

<template>
  <section class="workspace-wrap" data-testid="miniapp-page-workspace">
    <div class="summary-bar">
      <div class="metric">
        <span class="metric-val">4</span>
        <span class="metric-label">今日待办</span>
      </div>
      <div class="metric">
        <span class="metric-val">19</span>
        <span class="metric-label">原生业务域</span>
      </div>
      <div class="metric">
        <span class="metric-val">100%</span>
        <span class="metric-label">契约同源</span>
      </div>
    </div>

    <div class="task-list">
      <article v-for="task in tasks" :key="task.id" class="task-item">
        <div>
          <div class="task-title">{{ task.title }}</div>
          <div class="task-time">{{ task.id }} · {{ task.time }}</div>
        </div>
        <span class="task-status">{{ task.status }}</span>
      </article>
    </div>
  </section>
</template>

<style scoped>
.workspace-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.summary-bar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px;
  text-align: center;
}
.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.metric-val {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}
.metric-label {
  font-size: 12px;
  color: #64748b;
}
.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
}
.task-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}
.task-time {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}
.task-status {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #334155;
}
</style>
