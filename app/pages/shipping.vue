<script setup lang="ts">
import { demoStorePassword } from '~/data/brand'

// Доставка й повернення в демо: нічого не відправляється, замість політики — як перевірити оформлення
const { t } = useI18n()
const localePath = useLocalePath()
// Сторінка пароля магазину Shopify (той самий домен, що й оформлення). Без домену (немає .env) посилання немає
const domain = String(useRuntimeConfig().public.shopifyStoreDomain ?? '')
const storeUrl = domain ? `https://${domain}/password` : null

useSeoMeta({
  title: () => `${t('shipping.title')} | North Quay Leather`,
  description: () => t('shipping.lead'),
})
</script>

<template>
  <ContentPage :title="t('shipping.title')">
    <p class="lead">{{ t('shipping.lead') }}</p>
    <p>{{ t('shipping.live') }}</p>
    <h2>{{ t('cart.demoTitle') }}</h2>
    <p>{{ t('cart.demoText', { password: demoStorePassword }) }}</p>
    <p v-if="storeUrl">
      <a :href="storeUrl" target="_blank" rel="noopener" class="text-link">{{ t('cart.demoUnlock') }}</a>
    </p>
    <div class="actions">
      <NuxtLink :to="localePath('/collections/all')" class="btn btn--primary">{{ t('home.viewAll') }}</NuxtLink>
    </div>
  </ContentPage>
</template>
