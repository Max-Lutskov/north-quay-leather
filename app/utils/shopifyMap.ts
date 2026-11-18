// Чисті функції: відповідь Storefront API → типи каталогу (shared/types/catalog.ts).
// Чого немає в Shopify або що не розпізнано, стає null / порожнім, а не ламає сторінку.
import type {
  LeatherColor,
  Money,
  ProductDetail,
  ProductDimensions,
  ProductImage,
  ProductSummary,
} from '#shared/types/catalog'
import type { Cart } from '#shared/types/cart'
import type {
  ShopifyCart,
  ShopifyImage,
  ShopifyMoney,
  ShopifyProductDetail,
  ShopifyProductSummary,
  ShopifyVariant,
} from '#shared/types/shopify'

// Значення опції Color у Shopify (без урахування регістру) → колір шкіри на сайті.
// Нове значення в адмінці без рядка тут просто не показується.
const colorByOption: Record<string, LeatherColor> = {
  black: 'black',
  cognac: 'cognac',
  chocolate: 'chocolate',
  burgundy: 'burgundy',
  green: 'green',
  tan: 'tan',
  red: 'red',
  caramel: 'caramel',
}

// Колекції, які є категоріями (хлібні крихти). Інші колекції товару (bestsellers, frontpage) пропускаємо
const categoryLabelKeys: Record<string, string> = {
  'totes': 'category.totes',
  'shoulder-bags': 'category.shoulderBags',
  'laptop-work': 'category.laptopWork',
  'mini-crossbody': 'category.miniCrossbody',
}

// Ключ i18n заголовка сторінки колекції. null — такої сторінки на сайті немає (404)
export function collectionTitleKey(handle: string): string | null {
  if (handle === 'all') return 'collection.all'
  if (handle === 'bestsellers') return 'home.bestsellersTitle'
  return categoryLabelKeys[handle] ?? null
}

function toMoney(money: ShopifyMoney): Money {
  return { amount: Number(money.amount), currencyCode: money.currencyCode }
}

function toImage(image: ShopifyImage, fallbackAlt: string): ProductImage {
  return { url: image.url, alt: image.altText ?? fallbackAlt }
}

function variantColor(variant: ShopifyVariant): LeatherColor | null {
  const option = variant.selectedOptions.find((o) => o.name.toLowerCase() === 'color')
  return option ? colorByOption[option.value.toLowerCase()] ?? null : null
}

// Кольори в порядку варіантів, без повторів і невідомих значень
function productColors(variants: ShopifyVariant[]): LeatherColor[] {
  const colors = variants.map(variantColor).filter((c): c is LeatherColor => c !== null)
  return [...new Set(colors)]
}

// Колір фото за alt: у нас alt починається з назви кольору («Burgundy Tidal Barrel Bag, front view»)
function imageColor(image: ShopifyImage, colors: LeatherColor[]): LeatherColor | null {
  const alt = image.altText?.toLowerCase() ?? ''
  return colors.find((c) => alt.startsWith(c)) ?? null
}

// metafield custom.specs (JSON): { details: string[], dimensions: ProductDimensions }.
// Розміри без обов'язкових чисел вважаємо відсутніми; необов'язкові поля без значення — null.
function parseSpecs(value: string | undefined): { details: string[]; dimensions: ProductDimensions | null } {
  let raw: unknown
  try {
    raw = value ? JSON.parse(value) : null
  }
  catch {
    raw = null
  }
  const specs = (raw ?? {}) as { details?: unknown; dimensions?: Record<string, unknown> }

  const details = Array.isArray(specs.details)
    ? specs.details.filter((line): line is string => typeof line === 'string')
    : []

  const d = specs.dimensions
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
  const required = d && [d.heightCm, d.topWidthCm, d.bottomWidthCm, d.depthCm].map(num)
  let dimensions: ProductDimensions | null = null
  if (d && required && required.every((v) => v !== null)) {
    const [strapFrom, strapTo] = Array.isArray(d.strapCm) && d.strapCm.length === 2 ? d.strapCm.map(num) : []
    dimensions = {
      heightCm: required[0]!,
      topWidthCm: required[1]!,
      bottomWidthCm: required[2]!,
      depthCm: required[3]!,
      handleDropCm: num(d.handleDropCm),
      strapCm: typeof strapFrom === 'number' && typeof strapTo === 'number' ? [strapFrom, strapTo] : null,
      laptopInches: num(d.laptopInches),
    }
  }
  return { details, dimensions }
}

// Картка товару. null — товар без жодного розпізнаного кольору або без фото: картку не показуємо
export function mapProductSummary(product: ShopifyProductSummary): ProductSummary | null {
  const colors = productColors(product.variants.nodes)
  // Без головного фото — фото варіанта з розпізнаним кольором, а не будь-якого
  const image = product.featuredImage ?? product.variants.nodes.find((v) => v.image && variantColor(v))?.image ?? null
  if (!colors.length || !image) return null

  // Фото варіанта кожного кольору: вибір кольору на картці одразу міняє фото
  const colorImages: Partial<Record<LeatherColor, ProductImage>> = {}
  for (const color of colors) {
    const own = product.variants.nodes.find((v) => v.image && variantColor(v) === color)?.image
    if (own) colorImages[color] = toImage(own, product.title)
  }

  return {
    handle: product.handle,
    title: product.title,
    subtitle: product.subtitle?.value ?? '',
    image: toImage(image, product.title),
    price: toMoney(product.priceRange.minVariantPrice),
    // Перекреслених цін і плашок на сайті немає (CLAUDE.md, «Дизайн-система»)
    compareAtPrice: null,
    colors,
    imageColor: imageColor(image, colors) ?? colors[0]!,
    colorImages,
    badge: null,
  }
}

// Сторінка товару. null — товар без жодного розпізнаного кольору (сторінка віддає 404)
export function mapProductDetail(product: ShopifyProductDetail): ProductDetail | null {
  const colors = productColors(product.variants.nodes)
  if (!colors.length) return null

  // Фото кольору: спершу фото варіанта, потім фото товару, у яких alt починається з назви кольору
  const images: Partial<Record<LeatherColor, ProductImage[]>> = {}
  for (const color of colors) {
    const own: ShopifyImage[] = []
    const variantImage = product.variants.nodes.find((v) => variantColor(v) === color)?.image
    if (variantImage) own.push(variantImage)
    for (const image of product.images.nodes) {
      if (imageColor(image, colors) === color && !own.some((i) => i.url === image.url)) own.push(image)
    }
    if (own.length) images[color] = own.map((i) => toImage(i, product.title))
  }

  // По одному варіанту на колір (у нас опція лише Color)
  const variants = colors.map((color) => {
    const v = product.variants.nodes.find((n) => variantColor(n) === color)!
    return { id: v.id, color, availableForSale: v.availableForSale, price: toMoney(v.price) }
  })

  const { details, dimensions } = parseSpecs(product.specs?.value)
  const categoryHandle = product.collections.nodes.map((c) => c.handle).find((h) => h in categoryLabelKeys)

  return {
    handle: product.handle,
    title: product.title,
    description: product.description,
    price: toMoney(product.priceRange.minVariantPrice),
    colors,
    // Основний колір — той, що має фото (для інших сторінка показує фото основного з підписом)
    defaultColor: colors.find((c) => images[c]) ?? colors[0]!,
    images,
    details,
    dimensions,
    variants,
    // Товар поза категоріями: крихти ведуть на весь каталог
    category: categoryHandle
      ? { handle: categoryHandle, labelKey: categoryLabelKeys[categoryHandle]! }
      : { handle: 'all', labelKey: 'collection.all' },
  }
}

// Кошик Shopify → Cart. Суми й кількість беремо як є, без перерахунку в браузері
export function mapCart(cart: ShopifyCart): Cart {
  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    totalQuantity: cart.totalQuantity,
    subtotal: toMoney(cart.cost.subtotalAmount),
    lines: cart.lines.nodes.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      total: toMoney(line.cost.totalAmount),
      variantId: line.merchandise.id,
      handle: line.merchandise.product.handle,
      title: line.merchandise.product.title,
      color: variantColor(line.merchandise),
      image: line.merchandise.image ? toImage(line.merchandise.image, line.merchandise.product.title) : null,
    })),
  }
}
