<script setup lang="ts">
import type { NuxtError } from '#app'

// Сторінка помилки в стилі сайту (той самий layout). 404 — «сторінки немає» з посиланням у каталог.
// Статична збірка кладе її в 404.html, і GitHub Pages віддає її на будь-яку невідому адресу.
const props = defineProps<{ error: NuxtError }>()

const { t } = useI18n()
const localePath = useLocalePath()
const notFound = computed(() => props.error.statusCode === 404)

useSeoMeta({
  title: () => `${notFound.value ? t('error.notFoundTitle') : t('error.title')} | North Quay Leather`,
  robots: 'noindex',
})
</script>

<template>
  <NuxtLayout>
    <div class="container error-page">
      <div class="inner">
        <p class="code">{{ error.statusCode }}</p>
        <h1 class="display title">{{ notFound ? t('error.notFoundTitle') : t('error.title') }}</h1>
        <p class="text">{{ notFound ? t('error.notFoundText') : t('error.text') }}</p>
        <div class="actions">
          <NuxtLink :to="localePath('/collections/all')" class="btn btn--primary" @click="clearError()">
            {{ t('home.viewAll') }}
          </NuxtLink>
          <NuxtLink :to="localePath('/')" class="btn btn--outline" @click="clearError()">
            {{ t('error.home') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.error-page {
  padding-top: 72px;
  padding-bottom: 120px;
}
.inner {
  max-width: 640px;
}
.code {
  margin: 0 0 8px;
  font-size: 15px;
  color: var(--muted);
}
.title {
  font-size: clamp(40px, 5vw, 64px);
  line-height: 1.02;
  margin-bottom: 20px;
}
.text {
  margin: 0 0 32px;
  font-size: 18px;
  line-height: 1.6;
  color: var(--ink-soft);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
@media (max-width: 760px) {
  .error-page {
    padding-top: 48px;
    padding-bottom: 88px;
  }
}
</style>
