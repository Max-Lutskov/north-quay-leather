<script setup lang="ts">
// Текстова сторінка («Про нас», доставка): крихти, заголовок, вузька колонка тексту. Текст — у слоті.
defineProps<{ title: string }>()

const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <div class="container content-page">
    <nav class="crumbs" :aria-label="t('product.breadcrumb')">
      <ol>
        <li><NuxtLink :to="localePath('/')">{{ t('product.home') }}</NuxtLink></li>
        <li aria-current="page">{{ title }}</li>
      </ol>
    </nav>
    <article class="body">
      <h1 class="display title">{{ title }}</h1>
      <slot />
    </article>
  </div>
</template>

<style scoped>
.content-page {
  padding-top: 20px;
  padding-bottom: 96px;
}
.crumbs ol {
  list-style: none;
  margin: 0 0 24px;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}
.crumbs li + li::before {
  content: "/";
  margin-right: 6px;
}
.crumbs a {
  color: var(--muted);
}
.crumbs a:hover {
  color: var(--accent);
}
.crumbs [aria-current] {
  color: var(--ink);
}
.body {
  max-width: 680px;
}
.title {
  font-size: clamp(40px, 4vw, 52px);
  line-height: 1.02;
  margin-bottom: 28px;
}
/* Слот: абзаци й підзаголовки сторінки */
.body :deep(p) {
  margin: 0 0 18px;
  font-size: 17px;
  line-height: 1.65;
  color: var(--ink-soft);
}
.body :deep(.lead) {
  font-size: 20px;
  line-height: 1.55;
  color: var(--ink);
}
.body :deep(h2) {
  margin: 40px 0 14px;
  font-family: var(--font-display);
  font-stretch: var(--display-stretch);
  font-weight: 400;
  font-size: 30px;
  line-height: 1.1;
  color: var(--ink);
}
.body :deep(.actions) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

@media (max-width: 760px) {
  .title {
    font-size: 36px;
  }
  .body :deep(.lead) {
    font-size: 18px;
  }
}
</style>
