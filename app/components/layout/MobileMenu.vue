<script setup lang="ts">
import type { NavItem } from '~/types/navigation'

// Бокове меню для мобільної версії: виїжджає зліва, фон затемнюється.
// Анімації лише transform і opacity, з фолбеком для prefers-reduced-motion.
const props = defineProps<{
  open: boolean
  items: NavItem[]
}>()
const emit = defineEmits<{ close: [] }>()

const { t, locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const otherLocale = computed(() => (locale.value === 'en' ? 'ua' : 'en'))

const panel = ref<HTMLElement | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)
let returnFocus: HTMLElement | null = null

// Поки меню відкрите, сторінка під ним не прокручується (знімається й при розмонтуванні)
const scrollLocked = useScrollLock(() => (import.meta.client ? document.documentElement : null))

watch(
  () => props.open,
  async (isOpen) => {
    if (!import.meta.client) return
    scrollLocked.value = isOpen
    if (isOpen) {
      returnFocus = document.activeElement as HTMLElement | null
      await nextTick()
      closeBtn.value?.focus({ preventScroll: true })
    } else {
      returnFocus?.focus({ preventScroll: true })
      returnFocus = null
    }
  },
)

onKeyStroke('Escape', () => {
  if (props.open) emit('close')
})

// Tab не виходить за межі панелі. Власна пастка фокуса: useFocusTrap з VueUse
// потребує ще й бібліотеки focus-trap, а тут достатньо цих кількох рядків.
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
    <div class="drawer" :class="{ open }" :aria-hidden="!open" @keydown="onKeydown">
      <div class="backdrop" @click="emit('close')" />
      <div
        id="mobile-menu"
        ref="panel"
        class="panel"
        role="dialog"
        aria-modal="true"
        :aria-label="t('header.menu')"
      >
        <div class="head">
          <NuxtLink :to="localePath('/')" class="mark" :aria-label="t('header.home')" @click="emit('close')"><LogoMark class="mark-svg" /></NuxtLink>
          <button ref="closeBtn" type="button" class="close" :aria-label="t('header.close')" @click="emit('close')">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <nav :aria-label="t('nav.label')" class="links">
          <NuxtLink
            v-for="(item, i) in items"
            :key="item.key"
            :to="localePath(item.to)"
            class="link"
            :style="{ '--i': i }"
            @click="emit('close')"
          >
            {{ t(item.key) }}
          </NuxtLink>
        </nav>

        <div class="secondary" :style="{ '--i': items.length }">
          <NuxtLink
            :to="switchLocalePath(otherLocale)"
            class="lang"
            :lang="otherLocale === 'ua' ? 'uk' : 'en'"
            @click="emit('close')"
          >
            {{ t('header.switchLanguage') }}
          </NuxtLink>
        </div>

        <div class="foot" :style="{ '--i': items.length + 1 }">
          <span>{{ t('demo.notice') }}</span>
        </div>
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
  /* ховаємо з таб-порядку лише після того, як панель поїхала */
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
  left: 0;
  width: min(86vw, 400px);
  display: flex;
  flex-direction: column;
  background: var(--paper);
  color: var(--ink);
  transform: translateX(-100%);
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
.mark {
  display: flex;
  align-items: center;
  min-height: var(--tap);
}
.mark-svg {
  width: 36px;
  height: 36px;
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

.links {
  display: flex;
  flex-direction: column;
  padding: 24px var(--gutter) 8px;
}
.link {
  font-family: var(--font-display);
  font-stretch: var(--display-stretch);
  font-size: 40px;
  line-height: 1.1;
  padding: 8px 0;
}

.secondary {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 16px var(--gutter) 0;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  font-size: 16px;
  font-weight: 500;
}
.secondary a {
  display: flex;
  align-items: center;
  min-height: var(--tap);
}

.foot {
  margin-top: auto;
  padding: 24px var(--gutter) 32px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
  color: var(--muted);
}
/* Пункти виїжджають по черзі слідом за панеллю; при закритті зникають разом. */
.link,
.secondary,
.foot {
  opacity: 0;
  transform: translateX(-16px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.open .link,
.open .secondary,
.open .foot {
  opacity: 1;
  transform: none;
  transition: opacity 0.45s ease, transform 0.55s cubic-bezier(0.32, 0.72, 0, 1);
  transition-delay: calc(140ms + var(--i) * 50ms);
}

@media (prefers-reduced-motion: reduce) {
  .panel,
  .backdrop,
  .link,
  .secondary,
  .foot {
    transition: none !important;
  }
  .link,
  .secondary,
  .foot {
    transform: none;
  }
}

@media (min-width: 761px) {
  .drawer {
    display: none;
  }
}
</style>
