<script setup lang="ts">
import type { LeatherColor, ProductSummary } from '#shared/types/catalog'
import { collectionSorts as SORTS, type CollectionSort as SortKey } from '~/types/collection'

// Сторінка колекції: all — усі товари, інакше колекція Shopify з таким handle (немає — 404).
// Сортування й фільтр за кольором — у браузері по вже завантаженому списку (товарів мало, запитів на клік немає).
// Стан у ?sort=&color=: читаємо після монтування і пишемо через history.replaceState, як ?color= на сторінці
// товару (router.replace під час гідрації статичної сторінки губив query, CLAUDE.md).
const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()
const n = useNumber()

const handle = String(route.params.handle)
const titleKey = collectionTitleKey(handle)
if (!titleKey) {
  throw createError({ statusCode: 404, statusMessage: 'Collection not found' })
}
const { data, error } = handle === 'all' ? await useAllProducts() : await useCollection(handle)
// Запит до Shopify упав: помилка, а не порожня сторінка «тут поки немає сумок» (збірка зупиниться, failOnError)
if (error.value) {
  throw createError({ statusCode: 500, statusMessage: 'Catalog unavailable' })
}
if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Collection not found' })
}
const products: ProductSummary[] = data.value

const sort = ref<SortKey>('featured')
const color = ref<LeatherColor | null>(null)

// Кольори, які є в цій колекції, у порядку першої появи
const colors = [...new Set(products.flatMap((p) => p.colors))]

function applyFromUrl() {
  const s = route.query.sort
  const c = route.query.color
  sort.value = typeof s === 'string' && (SORTS as readonly string[]).includes(s) ? (s as SortKey) : 'featured'
  color.value = typeof c === 'string' && colors.includes(c as LeatherColor) ? (c as LeatherColor) : null
}
onMounted(applyFromUrl)
watch(() => [route.query.sort, route.query.color], applyFromUrl)
watch([sort, color], ([s, c]) => {
  const url = new URL(window.location.href)
  if (s === 'featured') url.searchParams.delete('sort')
  else url.searchParams.set('sort', s)
  if (c) url.searchParams.set('color', c)
  else url.searchParams.delete('color')
  history.replaceState(history.state, '', url)
})

const visible = computed(() => {
  const list = color.value ? products.filter((p) => p.colors.includes(color.value!)) : [...products]
  if (sort.value === 'price-asc') list.sort((a, b) => a.price.amount - b.price.amount)
  if (sort.value === 'price-desc') list.sort((a, b) => b.price.amount - a.price.amount)
  if (sort.value === 'name') list.sort((a, b) => a.title.localeCompare(b.title))
  return list
})

useSeoMeta({
  title: () => `${t(titleKey)} | North Quay Leather`,
  description: () => t('meta.description'),
  ogTitle: () => t(titleKey),
})
</script>

<template>
  <div class="container collection">
    <nav class="crumbs" :aria-label="t('product.breadcrumb')">
      <ol>
        <li><NuxtLink :to="localePath('/')">{{ t('product.home') }}</NuxtLink></li>
        <li aria-current="page">{{ t(titleKey) }}</li>
      </ol>
    </nav>

    <div class="head">
      <h1 class="display title">{{ t(titleKey) }}</h1>
      <p class="count" aria-live="polite">{{ t('collection.count', { count: n(visible.length) }, visible.length) }}</p>
    </div>

    <div v-if="products.length" class="toolbar">
      <fieldset v-if="colors.length > 1" class="filter">
        <legend class="visually-hidden">{{ t('collection.colour') }}</legend>
        <label class="chip">
          <input v-model="color" class="visually-hidden" type="radio" name="color" :value="null">
          {{ t('collection.allColours') }}
        </label>
        <label v-for="c in colors" :key="c" class="chip">
          <input v-model="color" class="visually-hidden" type="radio" name="color" :value="c">
          <span class="dot" :style="{ background: `var(--leather-${c})` }" aria-hidden="true" />
          {{ t(`color.${c}`) }}
        </label>
      </fieldset>
      <label class="sort">
        <span>{{ t('collection.sort') }}</span>
        <select v-model="sort">
          <option v-for="s in SORTS" :key="s" :value="s">{{ t(`collection.sorts.${s}`) }}</option>
        </select>
      </label>
    </div>

    <div v-if="visible.length" class="grid">
      <ProductCard v-for="p in visible" :key="p.handle" :product="p" />
    </div>
    <div v-else class="empty">
      <p>{{ products.length ? t('collection.emptyFilter') : t('collection.empty') }}</p>
      <button v-if="color" type="button" class="btn btn--outline" @click="color = null">
        {{ t('collection.reset') }}
      </button>
      <NuxtLink v-else-if="handle !== 'all'" :to="localePath('/collections/all')" class="btn btn--outline">
        {{ t('home.viewAll') }}
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.collection {
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

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 24px;
  margin-bottom: 28px;
}
.title {
  font-size: clamp(40px, 4vw, 52px);
  line-height: 1.02;
}
.count {
  margin: 0;
  font-size: 15px;
  color: var(--muted);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px 24px;
  padding: 16px 0;
  margin-bottom: 32px;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}
/* Кнопки фільтра: зона натиску 44px, вибрана — темна рамка */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s ease;
}
.chip:hover {
  border-color: var(--ink);
}
.chip:has(input:checked) {
  border-color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink);
}
.chip:has(input:focus-visible) {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
.chip:active {
  transform: scale(0.98);
}
.dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid var(--line-strong);
  box-sizing: border-box;
}
.sort {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--ink-soft);
}
.sort select {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--line-strong);
  border-radius: 0;
  background: var(--paper);
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.sort select:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 40px 24px;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  padding: 48px 0;
}
.empty p {
  margin: 0;
  font-size: 17px;
  color: var(--ink-soft);
}

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 760px) {
  .title {
    font-size: 36px;
  }
  .toolbar {
    margin-bottom: 24px;
  }
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 28px 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .chip {
    transition: none;
  }
  .chip:active {
    transform: none;
  }
}
</style>
