// Усі меню сайту в одному місці. Шляхи без префікса мови (додає localePath), key — ключ i18n підпису.
// Статична конфігурація, як brand.ts: компоненти імпортують напряму.
import type { NavItem } from '~/types/navigation'

// Шапка на десктопі й бокове меню на мобільному
export const mainNav: NavItem[] = [
  { to: '/collections/all', key: 'nav.shop' },
  { to: '/collections/totes', key: 'nav.totes' },
  { to: '/about', key: 'nav.story' },
]

// Футер, колонка «Shop»
export const footerShopNav: NavItem[] = [
  { to: '/collections/totes', key: 'nav.totes' },
  { to: '/collections/shoulder-bags', key: 'nav.shoulderBags' },
  { to: '/collections/laptop-work', key: 'category.laptopWork' },
  { to: '/collections/mini-crossbody', key: 'category.miniCrossbody' },
]

// Футер, колонка «Help»
// У прототипі лише дві службові сторінки (план, крок 8); догляд за шкірою — на сторінці товару
export const footerHelpNav: NavItem[] = [
  { to: '/shipping', key: 'footer.shippingReturns' },
  { to: '/about', key: 'nav.story' },
]
