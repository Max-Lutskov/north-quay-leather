// Типи каталогу. Спільні для клієнта й сервера: коли з'явиться проксі до Shopify (server/api),
// він віддаватиме дані саме в цій формі. Форма близька до відповіді Storefront API.

export type LeatherColor =
  | 'black'
  | 'cognac'
  | 'chocolate'
  | 'burgundy'
  | 'green'
  | 'tan'
  | 'red'
  | 'caramel'

// Як MoneyV2 у Storefront API. currencyCode — код ISO 4217 (USD, EUR, UAH…)
export interface Money {
  amount: number
  currencyCode: string
}

export interface ProductImage {
  url: string
  alt: string
}

// Товар у списках: бестселери, каталог, «вам також сподобається». Не повна сторінка товару.
export interface ProductSummary {
  handle: string
  title: string
  subtitle: string
  image: ProductImage
  price: Money
  compareAtPrice: Money | null
  colors: LeatherColor[]
  // Колір сумки на фото картки: його показуємо вибраним за замовчуванням.
  imageColor: LeatherColor
  // Фото картки для кожного кольору (фото варіанта). Кольору без свого фото тут немає: картка лишає image
  colorImages: Partial<Record<LeatherColor, ProductImage>>
  badge: 'new' | 'bestseller' | null
}

// Плитка категорії на головній. labelKey — ключ i18n для підпису.
export interface HomeCategory {
  handle: string
  labelKey: string
  image: string
}

// Розміри сумки в сантиметрах (дюйми рахуються на сторінці). strapCm — ремінь, від і до (однакові числа, якщо
// не регулюється). null — у сумки цього немає: рядок розміру на сторінці ховається.
export interface ProductDimensions {
  heightCm: number
  topWidthCm: number
  bottomWidthCm: number
  depthCm: number
  handleDropCm: number | null
  strapCm: [number, number] | null
  laptopInches: number | null
}

// Варіант товару (один колір) для кошика: id — merchandiseId у Storefront API
export interface ProductVariantRef {
  id: string
  color: LeatherColor
  availableForSale: boolean
  price: Money
}

// Повна сторінка товару. images — фото за кольором; для кольорів без фото показуємо фото defaultColor.
// category — для хлібних крихт: handle колекції і ключ i18n її назви.
// dimensions null — розмірів у Shopify немає (metafield custom.specs): блок «Size & fit» ховається.
export interface ProductDetail {
  handle: string
  title: string
  description: string
  price: Money
  colors: LeatherColor[]
  defaultColor: LeatherColor
  images: Partial<Record<LeatherColor, ProductImage[]>>
  details: string[]
  dimensions: ProductDimensions | null
  // Варіанти за кольором (по одному на колір), кнопка «Add to cart» додає варіант вибраного кольору
  variants: ProductVariantRef[]
  category: { handle: string; labelKey: string }
}
