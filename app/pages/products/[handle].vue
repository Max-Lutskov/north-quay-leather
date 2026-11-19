<script setup lang="ts">
import type { LeatherColor } from '#shared/types/catalog'

// Сторінка товару: дані з Shopify за handle (useProduct у useCatalog.ts), немає товару — 404.
// Опис і рішення: docs/superpowers/specs/2026-10-29-product-page-design.md
const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()
const money = useMoney()
const n = useNumber()

const { data: product } = await useProduct(String(route.params.handle))
const { data: bestsellers } = await useBestsellers()
if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found' })
}
const item = product.value
// Опис і «Деталі» мовою сторінки (переклад UA у app/data/productCopy.ts)
const copy = useProductCopy()
const description = computed(() => copy.description(item))
const details = computed(() => copy.details(item))

// Колір. Сторінки статичні, тож ?color= застосовуємо після монтування (гідрація збігається з HTML збірки)
// і стежимо за route.query: під час гідрації статичної сторінки адреса на мить буває без query.
// Вибір пишемо назад в адресу через history.replaceState: без нового запису в історії і без навігації
// роутера (router.replace у цей момент губив query).
const selected = ref<LeatherColor>(item.defaultColor)
function applyColorFromUrl() {
  const fromUrl = route.query.color
  if (typeof fromUrl === 'string' && item.colors.includes(fromUrl as LeatherColor)) {
    selected.value = fromUrl as LeatherColor
  }
}
onMounted(applyColorFromUrl)
watch(() => route.query.color, applyColorFromUrl)
watch(selected, (color) => {
  const url = new URL(window.location.href)
  url.searchParams.set('color', color)
  history.replaceState(history.state, '', url)
})

// Для кольорів без своїх фото показуємо фото основного кольору і чесно про це пишемо
const ownPhotos = computed(() => item.images[selected.value])
const photos = computed(() => ownPhotos.value ?? item.images[item.defaultColor] ?? [])

const dims = item.dimensions
const inch = (cm: number) => n(Math.round((cm / 2.54) * 10) / 10)
const withInches = (cm: number) => t('product.cm', { cm: n(cm), inch: inch(cm) })
// Ремінь: однакові кінці ([115, 115]) показуємо одним числом
function strapValue([from, to]: [number, number]) {
  if (from === to) return withInches(from)
  return t('product.cmRange', { from: n(from), to: n(to), inchFrom: inch(from), inchTo: inch(to) })
}
// Рядки, яких у сумки немає (null), не показуємо. Без розмірів узагалі (dims null) ховаються рядок розміру
// і блок «Size & fit»
const sizeRows = dims
  ? [
      { key: 'height', value: withInches(dims.heightCm) },
      { key: 'topWidth', value: withInches(dims.topWidthCm) },
      { key: 'bottomWidth', value: withInches(dims.bottomWidthCm) },
      { key: 'depth', value: withInches(dims.depthCm) },
      ...(dims.handleDropCm !== null ? [{ key: 'handleDrop', value: withInches(dims.handleDropCm) }] : []),
      ...(dims.strapCm ? [{ key: 'strap', value: strapValue(dims.strapCm) }] : []),
    ]
  : []

// Рядок розміру біля ціни відкриває блок «Size & fit» і прокручує до нього
const sizeEl = ref<HTMLDetailsElement | null>(null)
const motion = usePreferredReducedMotion()
async function openSize() {
  if (!sizeEl.value) return
  sizeEl.value.open = true
  // Спершу колонка стає на своє місце (якщо перестала влазити), потім прокрутка: інакше ціль зсувається
  measurePinned()
  await nextTick()
  sizeEl.value.scrollIntoView({ behavior: motion.value === 'reduce' ? 'auto' : 'smooth', block: 'start' })
}

// Колонка з інформацією липка, лише коли повністю влазить у вікно під шапкою. На низькому екрані або з
// відкритими блоками вона вища за вікно: тоді вона звичайна і гортається разом зі сторінкою (власної
// прокрутки в неї немає). Міряємо після монтування: з сервера колонка приходить звичайною.
const infoEl = ref<HTMLElement | null>(null)
const pinned = ref(false)
const PIN_GAP = 16
function measurePinned() {
  const el = infoEl.value
  if (!el) return
  const top = Number.parseFloat(getComputedStyle(el).top) || 0
  pinned.value = top + el.offsetHeight + PIN_GAP <= window.innerHeight
}
onMounted(measurePinned)
useResizeObserver(infoEl, measurePinned)
useEventListener('resize', measurePinned)
// Блок відкрили, і колонка перестала влазити: вона повертається на своє місце в сторінці, тож показуємо
// відкритий блок, якщо він опинився поза екраном
async function onToggle(e: Event) {
  const el = e.currentTarget as HTMLDetailsElement
  const wasPinned = pinned.value
  measurePinned()
  if (!el.open || !wasPinned || pinned.value) return
  await nextTick()
  el.scrollIntoView({ block: 'nearest' })
}

// Мобільна смуга знизу з ціною і кнопкою: з'являється, коли основна кнопка пішла за верхній край екрана
// і ховається, коли видно футер (щоб його не закривати)
const mainBtn = ref<HTMLButtonElement | null>(null)
const passed = ref(false)
useIntersectionObserver(mainBtn, ([entry]) => {
  if (entry) passed.value = !entry.isIntersecting && entry.boundingClientRect.top < 0
})
const footer = ref<HTMLElement | null>(null)
onMounted(() => {
  footer.value = document.querySelector('.site-footer')
})
const footerVisible = useElementVisibility(footer)
const showBar = computed(() => passed.value && !footerVisible.value)

const related = computed(() => bestsellers.value.filter((p) => p.handle !== item.handle))

// Кошик: додаємо варіант вибраного кольору. «Додано» лише після відповіді Shopify, помилка — текстом під кнопкою.
// Наявність з моменту збірки сайту; якщо товар уже розпродано, Shopify поверне попередження, і useCart
// вважатиме це невдачею. Поки йде будь-яка дія з кошиком (напр. у панелі), кнопка чекає
const { add, openCart, pending: cartPending } = useCart()
const variant = computed(() => item.variants.find((v) => v.color === selected.value))
const soldOut = computed(() => !variant.value?.availableForSale)
// Ціна вибраного кольору (якщо кольори колись матимуть різну ціну)
const price = computed(() => variant.value?.price ?? item.price)
const adding = ref(false)
const added = ref(false)
const addFailed = ref(false)
const { start: hideAdded } = useTimeoutFn(() => (added.value = false), 2500, { immediate: false })
async function addToCart() {
  if (!variant.value || soldOut.value || adding.value || cartPending.value) return
  adding.value = true
  added.value = false
  addFailed.value = false
  const ok = await add(variant.value.id)
  adding.value = false
  if (ok) {
    added.value = true
    hideAdded()
    openCart()
  } else {
    addFailed.value = true
  }
}
// Інший колір — інший варіант: старий стан кнопки не стосується нового
watch(selected, () => {
  added.value = false
  addFailed.value = false
})
const buyLabel = computed(() => {
  if (soldOut.value) return t('product.soldOut')
  if (adding.value) return t('product.adding')
  if (added.value) return t('product.added')
  return null
})

const firstPhoto = item.images[item.defaultColor]?.[0]
useSeoMeta({
  title: () => `${item.title} | North Quay Leather`,
  description: description,
  ogTitle: item.title,
  ogDescription: description,
  ogImage: firstPhoto ? absolutePublicUrl(firstPhoto.url) : undefined,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div>
    <div class="container product">
      <nav class="crumbs" :aria-label="t('product.breadcrumb')">
        <ol>
          <li><NuxtLink :to="localePath('/')">{{ t('product.home') }}</NuxtLink></li>
          <li>
            <NuxtLink :to="localePath(`/collections/${item.category.handle}`)">{{ t(item.category.labelKey) }}</NuxtLink>
          </li>
          <li aria-current="page">{{ item.title }}</li>
        </ol>
      </nav>

      <div class="layout">
        <ProductGallery
          class="gallery"
          :images="photos"
          :all-images="Object.values(item.images)"
          :label="t('product.photos', { title: item.title })"
        />

        <div ref="infoEl" class="info" :class="{ pinned }">
          <div class="intro">
            <h1 class="display title">{{ item.title }}</h1>
            <p class="lead">{{ description }}</p>
            <p class="price">{{ money(price) }}</p>
          </div>

          <fieldset class="colors">
            <legend class="colors-label">
              {{ t('product.colour') }}: <span>{{ t(`color.${selected}`) }}</span>
            </legend>
            <div class="swatches">
              <label v-for="c in item.colors" :key="c" class="swatch" :title="t(`color.${c}`)">
                <input v-model="selected" class="visually-hidden" type="radio" name="color" :value="c">
                <span class="dot" :style="{ background: `var(--leather-${c})` }" />
                <span class="visually-hidden">{{ t(`color.${c}`) }}</span>
              </label>
            </div>
            <p v-if="!ownPhotos" class="photo-note">
              {{ t('product.photosShow', { color: t(`color.${item.defaultColor}`).toLowerCase() }) }}
            </p>
          </fieldset>

          <button v-if="dims" type="button" class="size-line" @click="openSize">
            {{
              t(dims.laptopInches ? 'product.sizeLine' : 'product.sizeLineShort', {
                height: n(dims.heightCm),
                width: n(dims.topWidthCm),
                depth: n(dims.depthCm),
                laptop: dims.laptopInches,
              })
            }}
          </button>

          <div class="buy">
            <button
              ref="mainBtn"
              type="button"
              class="btn btn--primary add"
              :disabled="soldOut || adding || cartPending"
              :aria-busy="adding"
              @click="addToCart"
            >
              {{ buyLabel ?? t('product.addToCart', { price: money(price) }) }}
            </button>
            <p v-if="addFailed" class="buy-error" role="alert">{{ t('cart.addError') }}</p>
          </div>

          <div class="accordion">
            <details v-if="details.length" @toggle="onToggle">
              <summary>{{ t('product.details') }}<span class="plus" aria-hidden="true" /></summary>
              <ul class="details-list">
                <li v-for="line in details" :key="line">{{ line }}</li>
              </ul>
            </details>
            <details v-if="dims" ref="sizeEl" class="size" @toggle="onToggle">
              <summary>{{ t('product.size') }}<span class="plus" aria-hidden="true" /></summary>
              <div class="size-body">
                <ProductSizeDiagram :dimensions="dims" />
                <dl class="size-list">
                  <div v-for="row in sizeRows" :key="row.key">
                    <dt>{{ t(`product.dims.${row.key}`) }}</dt>
                    <dd>{{ row.value }}</dd>
                  </div>
                </dl>
                <p v-if="dims.laptopInches" class="laptop">{{ t('product.dims.laptop', { n: dims.laptopInches }) }}</p>
              </div>
            </details>
            <details @toggle="onToggle">
              <summary>{{ t('product.shipping') }}<span class="plus" aria-hidden="true" /></summary>
              <p class="text">{{ t('product.shippingText') }}</p>
              <p class="text">
                <NuxtLink :to="localePath('/shipping')" class="text-link">{{ t('product.shippingMore') }}</NuxtLink>
              </p>
            </details>
            <details @toggle="onToggle">
              <summary>{{ t('product.care') }}<span class="plus" aria-hidden="true" /></summary>
              <p class="text">{{ t('product.careText') }}</p>
            </details>
          </div>
        </div>
      </div>
    </div>

    <section v-if="related.length" aria-labelledby="related-h" class="related">
      <div class="container inner">
        <h2 id="related-h" v-reveal class="display heading">{{ t('product.alsoLike') }}</h2>
        <div class="grid">
          <ProductCard v-for="(p, i) in related" :key="p.handle" v-reveal="i" :product="p" />
        </div>
      </div>
    </section>

    <div class="buy-bar" :class="{ show: showBar }" :inert="!showBar">
      <span class="bar-text">
        <b>{{ money(price) }}</b>
        {{ t(`color.${selected}`) }}
      </span>
      <button type="button" class="btn btn--primary" :disabled="soldOut || adding || cartPending" :aria-busy="adding" @click="addToCart">
        {{ buyLabel ?? t('product.addToCartShort') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.product {
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

.layout {
  display: flex;
  gap: 56px;
  align-items: flex-start;
}
.gallery {
  flex: 1 1 0;
  min-width: 0;
}
/* Колонка з інформацією стоїть на місці, поки гортаються фото, але лише коли повністю влазить у вікно
   (клас .pinned ставить measurePinned). Вища за вікно колонка звичайна: гортається тільки сторінка, без
   власної прокрутки. top заданий завжди: скрипт читає з нього відступ від верху вікна. */
.info {
  flex: 0 1 400px;
  min-width: 320px;
  top: calc(var(--header-h) - var(--header-shrink) + 24px);
  display: flex;
  flex-direction: column;
  gap: 22px;
}
@media (min-width: 761px) {
  .info.pinned {
    position: sticky;
  }
}

.intro {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.title {
  font-size: clamp(40px, 4vw, 52px);
  line-height: 1.02;
}
.lead {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: var(--ink-soft);
}
.price {
  margin: 4px 0 0;
  font-size: 24px;
  font-weight: 700;
}

/* Кольори: кружечки 44px, вибраний обведений темним кільцем */
.colors {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}
.colors-label {
  padding: 0;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
}
.colors-label span {
  font-weight: 400;
  color: var(--ink-soft);
}
.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.swatch {
  width: var(--tap);
  height: var(--tap);
  padding: 5px;
  box-sizing: border-box;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px var(--line-strong);
  display: flex;
  cursor: pointer;
}
.swatch:hover {
  box-shadow: inset 0 0 0 1px var(--ink-soft);
}
.swatch:has(input:checked) {
  box-shadow: inset 0 0 0 2px var(--ink);
}
.swatch:has(input:focus-visible) {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
.dot {
  flex: 1;
  border-radius: 50%;
}
.photo-note {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--muted);
}

.size-line {
  align-self: flex-start;
  min-height: var(--tap);
  padding: 0;
  background: none;
  border: 0;
  font: 500 14px var(--font-body);
  color: var(--ink-soft);
  text-align: left;
  text-decoration: underline;
  text-decoration-color: var(--line-strong);
  text-underline-offset: 4px;
  cursor: pointer;
}
.size-line:hover {
  color: var(--accent);
}

.buy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.add {
  width: 100%;
  min-height: 56px;
  font-size: 16px;
}
.buy-error {
  margin: 0;
  font-size: 14px;
  color: var(--accent);
  text-align: center;
}

/* Розкривні блоки */
.accordion {
  border-top: 1px solid var(--line);
}
.accordion details {
  border-bottom: 1px solid var(--line);
}
.accordion summary {
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.accordion summary::-webkit-details-marker {
  display: none;
}
.plus {
  position: relative;
  width: 12px;
  height: 12px;
  transition: transform 0.3s var(--ease-out);
}
.plus::before,
.plus::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1.5px;
  margin-top: -0.75px;
  background: var(--ink);
}
.plus::after {
  transform: rotate(90deg);
}
details[open] .plus {
  transform: rotate(45deg);
}
.details-list {
  margin: 0 0 18px;
  padding-left: 18px;
  font-size: 15px;
  line-height: 1.8;
  color: var(--ink-soft);
}
.text {
  margin: 0 0 18px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--ink-soft);
}
.size-body {
  padding-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.size-list {
  margin: 0;
  display: grid;
  gap: 6px;
  font-size: 14px;
}
.size-list div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
.size-list dt {
  color: var(--ink-soft);
}
.size-list dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
}
.laptop {
  margin: 0;
  font-size: 14px;
  color: var(--ink-soft);
}
/* Прокрутка до блоку розмірів не ховає його під шапкою */
.size {
  scroll-margin-top: 16px;
}

.related {
  background: var(--paper-deep);
}
.related .inner {
  padding-top: 72px;
  padding-bottom: 72px;
}
.related .heading {
  font-size: 44px;
  margin-bottom: 32px;
}
.related .grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

/* Мобільна смуга з ціною і кнопкою */
.buy-bar {
  display: none;
}

@media (max-width: 760px) {
  .product {
    padding-top: 12px;
    padding-bottom: 56px;
  }
  .crumbs ol {
    margin-bottom: 12px;
  }
  .layout {
    flex-direction: column;
    gap: 28px;
  }
  .gallery {
    width: 100%;
  }
  .info {
    min-width: 0;
    width: 100%;
  }
  .title {
    font-size: 36px;
  }
  .related .inner {
    padding-top: 56px;
    padding-bottom: 56px;
  }
  .related .heading {
    font-size: 34px;
    margin-bottom: 24px;
  }
  .related .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px 12px;
  }

  .buy-bar {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 40;
    align-items: center;
    gap: 16px;
    padding: 12px var(--gutter) calc(12px + env(safe-area-inset-bottom));
    background: var(--paper);
    border-top: 1px solid var(--line);
    transform: translateY(100%);
    transition: transform 0.35s var(--ease-out);
  }
  .buy-bar.show {
    transform: none;
  }
  .bar-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    font-size: 13px;
    color: var(--ink-soft);
  }
  .bar-text b {
    font-size: 17px;
    color: var(--ink);
  }
}

@media (prefers-reduced-motion: reduce) {
  .plus,
  .buy-bar {
    transition: none;
  }
}
</style>
