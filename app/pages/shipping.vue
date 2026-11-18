<script setup lang="ts">
import { contacts, demoStorePassword } from '~/data/brand'

// Доставка й повернення: зразкові умови, як у справжнього магазину (з позначкою, що магазин демо),
// і окремим блоком нижче — як перевірити оформлення замовлення
const { t } = useI18n()
const localePath = useLocalePath()
// Сторінка пароля магазину Shopify (той самий домен, що й оформлення). Без домену (немає .env) посилання немає
const domain = String(useRuntimeConfig().public.shopifyStoreDomain ?? '')
const storeUrl = domain ? `https://${domain}/password` : null

const regions = ['ukraine', 'europe', 'us'] as const

useSeoMeta({
  title: () => `${t('shipping.title')} | North Quay Leather`,
  description: () => t('shipping.processing'),
})
</script>

<template>
  <ContentPage :title="t('shipping.title')">
    <p class="lead">{{ t('shipping.lead') }}</p>

    <h2>{{ t('shipping.processingTitle') }}</h2>
    <p>{{ t('shipping.processing') }}</p>

    <h2>{{ t('shipping.deliveryTitle') }}</h2>
    <p v-for="r in regions" :key="r">{{ t(`shipping.delivery.${r}`) }}</p>
    <p>{{ t('shipping.deliveryCost') }}</p>

    <h2>{{ t('shipping.dutiesTitle') }}</h2>
    <p>{{ t('shipping.duties') }}</p>

    <h2>{{ t('shipping.returnsTitle') }}</h2>
    <p>{{ t('shipping.returns') }}</p>

    <h2>{{ t('shipping.exchangeTitle') }}</h2>
    <p>{{ t('shipping.exchange') }}</p>

    <h2>{{ t('shipping.contactTitle') }}</h2>
    <p>{{ t('shipping.contact') }}</p>
    <p v-if="contacts.email">
      <a :href="`mailto:${contacts.email}`" class="text-link">{{ contacts.email }}</a>
    </p>

    <section class="demo" aria-labelledby="demo-h">
      <h2 id="demo-h" class="demo-title">{{ t('cart.demoTitle') }}</h2>
      <p>{{ t('cart.demoText', { password: demoStorePassword }) }}</p>
      <p v-if="storeUrl">
        <a :href="storeUrl" target="_blank" rel="noopener" class="text-link">{{ t('cart.demoUnlock') }}</a>
      </p>
    </section>

    <div class="actions">
      <NuxtLink :to="localePath('/collections/all')" class="btn btn--primary">{{ t('home.viewAll') }}</NuxtLink>
    </div>
  </ContentPage>
</template>

<style scoped>
/* Інструкція для тесту оформлення відділена від умов магазину: інше тло, як у блоку «Вам також сподобається» */
.demo {
  margin-top: 48px;
  padding: 8px 28px 10px;
  background: var(--paper-deep);
}
.demo .demo-title {
  margin-top: 24px;
}
@media (max-width: 760px) {
  .demo {
    padding: 4px 20px 6px;
  }
}
</style>
