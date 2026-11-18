<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="demo-banner">{{ t('demo.notice') }}</div>
</template>

<style scoped>
.demo-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--banner-h);
  padding: 0 var(--gutter);
  background: var(--paper-deep);
  border-bottom: 1px solid var(--line);
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 500;
  text-align: center;
}
</style>
