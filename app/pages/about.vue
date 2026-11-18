<script setup lang="ts">
// «Про нас» для демо: прямо кажемо, що бренд вигаданий, без імен і цифр (CLAUDE.md, «Правила текстів»)
const { t } = useI18n()
const localePath = useLocalePath()
// Запис оформлення замовлення (public/demo/). Прапорці ставить nuxt.config.ts під час збірки
const { checkoutVideo, checkoutPoster } = useRuntimeConfig().public

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
    <section v-if="checkoutVideo" aria-labelledby="video-h">
      <h2 id="video-h">{{ t('about.videoTitle') }}</h2>
      <p>{{ t('about.videoText') }}</p>
      <video
        class="video"
        :src="publicPath('/demo/checkout.mp4')"
        :poster="checkoutPoster ? publicPath('/demo/checkout-poster.jpg') : undefined"
        :aria-label="t('about.videoLabel')"
        controls
        muted
        playsinline
        preload="metadata"
      />
    </section>
    <p>{{ t('about.photos') }}</p>
    <div class="actions">
      <NuxtLink :to="localePath('/collections/all')" class="btn btn--primary">{{ t('home.viewAll') }}</NuxtLink>
    </div>
  </ContentPage>
</template>

<style scoped>
.video {
  display: block;
  width: 100%;
  height: auto;
  margin-bottom: 18px;
  background: var(--paper-deep);
}
</style>
