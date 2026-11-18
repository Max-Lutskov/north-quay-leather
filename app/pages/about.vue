<script setup lang="ts">
// «Про нас» для демо: прямо кажемо, що бренд вигаданий, без імен і цифр (CLAUDE.md, «Правила текстів»)
const { t } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  title: () => `${t('about.title')} | North Quay Leather`,
  description: () => t('about.lead'),
})
</script>

<template>
  <ContentPage :title="t('about.title')">
    <p class="lead">{{ t('about.lead') }}</p>
    <p>{{ t('about.bags') }}</p>
    <h2>{{ t('about.howTitle') }}</h2>
    <p>{{ t('about.how') }}</p>
    <p>{{ t('about.photos') }}</p>
    <div class="actions">
      <NuxtLink :to="localePath('/collections/all')" class="btn btn--primary">{{ t('home.viewAll') }}</NuxtLink>
    </div>
  </ContentPage>
</template>
