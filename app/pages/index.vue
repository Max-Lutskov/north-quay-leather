<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: () => t('meta.title'),
  description: () => t('meta.description'),
  ogTitle: () => t('meta.title'),
  ogDescription: () => t('meta.description'),
  ogImage: absolutePublicUrl('/images/hero-1.jpg'),
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div>
    <HomeHero />
    <HomeCategories />
    <HomeBestsellers />
    <HomeLeather />
  </div>
</template>
