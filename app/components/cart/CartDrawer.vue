<script setup lang="ts">
import { demoStorePassword } from '~/data/brand'

// Бокова панель кошика: виїжджає справа (на мобільному на всю ширину), фон затемнюється.
// Доступність як у MobileMenu: пастка фокуса, Esc, блокування прокрутки, повернення фокуса.
// Суми лише з відповіді Shopify. Оплата — перехід на checkoutUrl (Shopify Checkout).
const { t } = useI18n()
const localePath = useLocalePath()
const money = useMoney()
const { cart, pending, error, isOpen, update, remove, closeCart } = useCart()

const lines = computed(() => cart.value?.lines ?? [])
// Сторінка магазину Shopify для пароля: той самий домен, що й у checkoutUrl
const storeUrl = computed(() => (cart.value ? new URL('/password', cart.value.checkoutUrl).href : null))

const panel = ref<HTMLElement | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)
let returnFocus: HTMLElement | null = null
const scrollLocked = useScrollLock(() => (import.meta.client ? document.documentElement : null))

watch(isOpen, async (open) => {
  if (!import.meta.client) return
  scrollLocked.value = open
  // Сторінка під панеллю недоступна ні для Tab, ні для читачів екрана (панель телепортована в body, поза .page)
  document.querySelector('.page')?.toggleAttribute('inert', open)
  if (open) {
    // Після «Add to cart» фокус уже на body (кнопка була вимкнена, поки йшов запит): повертаємо на кошик у шапці
    const active = document.activeElement as HTMLElement | null
    returnFocus = active && active !== document.body ? active : document.querySelector<HTMLElement>('.cart-btn')
    await nextTick()
    closeBtn.value?.focus({ preventScroll: true })
  } else {
    returnFocus?.focus({ preventScroll: true })
    returnFocus = null
  }
})
// Кнопки під час запиту не вимикаємо (disabled скидає фокус на body і ламає пастку фокуса), а ігноруємо натиск
function changeQuantity(lineId: string, quantity: number) {
  if (!pending.value) update(lineId, quantity)
}
function removeLine(lineId: string) {
  if (!pending.value) remove(lineId)
}
// Останній рядок прибрано: фокус з кнопки, якої вже немає, — на «Закрити»
watch(
  () => lines.value.length,
  async (n) => {
    if (n || !isOpen.value) return
    await nextTick()
    closeBtn.value?.focus({ preventScroll: true })
  },
)

// Перехід на іншу сторінку (посилання в панелі) закриває її
const route = useRoute()
watch(() => route.fullPath, closeCart)

onKeyStroke('Escape', () => {
  if (isOpen.value) closeCart()
})

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Tab' || !panel.value) return
  const focusable = panel.value.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (!first || !last) return
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="drawer" :class="{ open: isOpen }" :aria-hidden="!isOpen" :inert="!isOpen" @keydown="onKeydown">
      <div class="backdrop" @click="closeCart" />
      <div ref="panel" class="panel" role="dialog" aria-modal="true" aria-labelledby="cart-h">
        <div class="head">
          <h2 id="cart-h" class="display title">{{ t('cart.title') }}</h2>
          <button ref="closeBtn" type="button" class="close" :aria-label="t('cart.close')" @click="closeCart">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div v-if="!lines.length" class="empty">
          <p>{{ t('cart.empty') }}</p>
          <NuxtLink :to="localePath('/collections/all')" class="btn btn--outline" @click="closeCart">
            {{ t('cart.browse') }}
          </NuxtLink>
        </div>

        <template v-else>
          <ul class="lines" :aria-busy="pending">
            <li v-for="line in lines" :key="line.id" class="line">
              <NuxtLink
                :to="localePath({ path: `/products/${line.handle}`, query: line.color ? { color: line.color } : {} })"
                class="thumb photo"
                tabindex="-1"
                aria-hidden="true"
                @click="closeCart"
              >
                <NuxtImg
                  v-if="line.image"
                  :src="line.image.url"
                  :alt="line.image.alt"
                  :provider="imageProvider(line.image.url)"
                  preset="photo"
                  width="96"
                  height="96"
                  densities="x1 x2"
                />
              </NuxtLink>
              <div class="line-info">
                <NuxtLink
                  :to="localePath({ path: `/products/${line.handle}`, query: line.color ? { color: line.color } : {} })"
                  class="line-title"
                  @click="closeCart"
                >
                  {{ line.title }}
                </NuxtLink>
                <span v-if="line.color" class="line-color">{{ t(`color.${line.color}`) }}</span>
                <div class="line-row">
                  <div class="qty" role="group" :aria-label="t('cart.quantity', { title: line.title })">
                    <button
                      type="button"
                      :aria-disabled="pending"
                      :aria-label="t('cart.decrease', { title: line.title })"
                      @click="changeQuantity(line.id, line.quantity - 1)"
                    >
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14" /></svg>
                    </button>
                    <span class="qty-value">{{ line.quantity }}</span>
                    <button
                      type="button"
                      :aria-disabled="pending"
                      :aria-label="t('cart.increase', { title: line.title })"
                      @click="changeQuantity(line.id, line.quantity + 1)"
                    >
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                  </div>
                  <span class="line-total">{{ money(line.total) }}</span>
                </div>
                <button
                  type="button"
                  class="remove"
                  :aria-disabled="pending"
                  :aria-label="t('cart.removeLabel', { title: line.title })"
                  @click="removeLine(line.id)"
                >
                  {{ t('cart.remove') }}
                </button>
              </div>
            </li>
          </ul>

          <div class="foot">
            <p v-if="error" class="error" role="alert">{{ t('cart.updateError') }}</p>
            <div class="subtotal">
              <span>{{ t('cart.subtotal') }}</span>
              <b>{{ cart ? money(cart.subtotal) : '' }}</b>
            </div>
            <p class="note">{{ t('cart.taxNote') }}</p>
            <div class="demo">
              <p class="demo-title">{{ t('cart.demoTitle') }}</p>
              <p class="demo-text">{{ t('cart.demoText', { password: demoStorePassword }) }}</p>
              <a v-if="storeUrl" :href="storeUrl" target="_blank" rel="noopener" class="text-link">{{ t('cart.demoUnlock') }}</a>
            </div>
            <a
              v-if="cart"
              :href="cart.checkoutUrl"
              class="btn btn--primary checkout"
              :class="{ busy: pending }"
              :aria-disabled="pending"
              @click="pending && $event.preventDefault()"
            >
              {{ t('cart.checkout') }}
            </a>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.drawer {
  position: fixed;
  inset: 0;
  z-index: 100;
  visibility: hidden;
  pointer-events: none;
  transition: visibility 0s linear 0.5s;
}
.drawer.open {
  visibility: visible;
  pointer-events: auto;
  transition: none;
}
.backdrop {
  position: absolute;
  inset: 0;
  background: var(--scrim);
  opacity: 0;
  transition: opacity 0.4s ease;
}
.open .backdrop {
  opacity: 1;
}
.panel {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: min(100vw, 440px);
  display: flex;
  flex-direction: column;
  background: var(--paper);
  color: var(--ink);
  transform: translateX(100%);
  transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.open .panel {
  transform: none;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 12px var(--gutter);
  border-bottom: 1px solid var(--line);
}
.title {
  font-size: 32px;
}
.close {
  width: var(--tap);
  height: var(--tap);
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 0;
  color: var(--ink);
  cursor: pointer;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  padding: 32px var(--gutter);
}
.empty p {
  margin: 0;
  font-size: 17px;
  color: var(--ink-soft);
}

.lines {
  list-style: none;
  margin: 0;
  padding: 8px var(--gutter);
}
.lines[aria-busy="true"] {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}
.line {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
}
.thumb {
  flex: 0 0 96px;
  height: 96px;
}
.line-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.line-title {
  font-weight: 600;
}
.line-color {
  font-size: 14px;
  color: var(--muted);
}
.line-row {
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
}
.qty {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--line-strong);
}
.qty button {
  width: var(--tap);
  height: var(--tap);
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 0;
  color: var(--ink);
  cursor: pointer;
}
.qty button:hover:not([aria-disabled="true"]) {
  color: var(--accent);
}
.qty-value {
  min-width: 24px;
  text-align: center;
  font-weight: 600;
}
.line-total {
  font-weight: 700;
}
.remove {
  min-height: var(--tap);
  padding: 0;
  background: none;
  border: 0;
  color: var(--muted);
  font: inherit;
  font-size: 14px;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.qty button[aria-disabled="true"],
.remove[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
}
.remove:hover:not([aria-disabled="true"]) {
  color: var(--accent);
}

.foot {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px var(--gutter) 28px;
  border-top: 1px solid var(--line);
  background: var(--paper);
}
.error {
  margin: 0;
  font-size: 14px;
  color: var(--accent);
}
.subtotal {
  display: flex;
  justify-content: space-between;
  font-size: 17px;
}
.note {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}
.demo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 14px 16px;
  background: var(--paper-deep);
}
.demo p {
  margin: 0;
}
.demo-title {
  font-weight: 600;
  font-size: 14px;
}
.demo-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--ink-soft);
}
.checkout {
  width: 100%;
  min-height: 56px;
  box-sizing: border-box;
}
.checkout.busy {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .panel,
  .backdrop,
  .lines[aria-busy="true"] {
    transition: none !important;
  }
}
</style>
