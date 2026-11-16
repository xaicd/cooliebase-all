<script setup lang="ts">
const props = defineProps<{ id?: string }>()
</script>

<template>
  <section class="subpackage-detail">
    <h2>分包详情视图</h2>
    <p>单据标识：{{ props.id || "默认预览" }}</p>
  </section>
</template>

<style scoped>
.subpackage-detail {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
}
</style>
