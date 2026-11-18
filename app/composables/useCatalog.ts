// Шар даних каталогу. Компоненти беруть товари й категорії лише звідси, а не з ~/data напряму.
// Джерело — Shopify Storefront API (utils/shopify*.ts). Якщо домен магазину не задано (немає .env),
// повертаються тимчасові дані з app/data/, щоб проєкт запускався без ключів.
// Сайт статичний: усі запити виконуються під час збірки, у браузер іде готовий результат.
// Пастка: кілька запитів в одному обробнику — лише через Promise.all (див. utils/shopify.ts).
import type { HomeCategory, ProductSummary } from '#shared/types/catalog'
import type { ShopifyProductDetail, ShopifyProductSummary } from '#shared/types/shopify'
import { bestsellers, homeCategories } from '~/data/catalog'
import { demoProduct } from '~/data/product'

// Скільки товарів беремо в списки: магазин маленький (до 20 сумок, план, крок 5), пагінація не потрібна
const LIST_LIMIT = 50

function hasShopify() {
  return Boolean(useRuntimeConfig().public.shopifyStoreDomain)
}

function toSummaries(nodes: ShopifyProductSummary[]): ProductSummary[] {
  return nodes.map(mapProductSummary).filter((p): p is ProductSummary => p !== null)
}

// Товари колекції. null — колекції немає в Shopify (або вона не опублікована в каналі Headless)
async function fetchCollection(handle: string): Promise<ProductSummary[] | null> {
  const res = await shopifyFetch<{ collection: { products: { nodes: ShopifyProductSummary[] } } | null }>(
    collectionProductsQuery,
    { handle, first: LIST_LIMIT },
  )
  return res.collection ? toSummaries(res.collection.products.nodes) : null
}

// Плитки категорій — оформлення сайту (фото, підписи) з app/data/catalog.ts. Показуємо лише ті, чия колекція
// є в Shopify, щоб плитка не вела на порожню сторінку
export function useHomeCategories() {
  const shopify = hasShopify()
  return useAsyncData(
    'catalog:home-categories',
    async (): Promise<HomeCategory[]> => {
      if (!shopify) return homeCategories
      const res = await shopifyFetch<{ collections: { nodes: { handle: string }[] } }>(collectionHandlesQuery)
      const existing = new Set(res.collections.nodes.map((c) => c.handle))
      return homeCategories.filter((c) => existing.has(c.handle))
    },
    { default: () => [] },
  )
}

// Колекція bestsellers (товари в ній Макс вибирає в адмінці)
export function useBestsellers() {
  const shopify = hasShopify()
  return useAsyncData(
    'catalog:bestsellers',
    async () => (shopify ? (await fetchCollection('bestsellers')) ?? [] : bestsellers),
    { default: () => [] },
  )
}

// Сторінка товару за handle. null — товару немає (сторінка віддає 404)
export function useProduct(handle: string) {
  const shopify = hasShopify()
  return useAsyncData(`catalog:product:${handle}`, async () => {
    if (!shopify) return demoProduct
    const res = await shopifyFetch<{ product: ShopifyProductDetail | null }>(productDetailQuery, { handle })
    return res.product ? mapProductDetail(res.product) : null
  })
}

// Товари колекції за handle. null — колекції немає (сторінка віддає 404)
export function useCollection(handle: string) {
  const shopify = hasShopify()
  return useAsyncData(`catalog:collection:${handle}`, async () => {
    if (!shopify) return bestsellers
    return fetchCollection(handle)
  })
}

// Усі товари магазину (сторінка /collections/all)
export function useAllProducts() {
  const shopify = hasShopify()
  return useAsyncData(
    'catalog:all-products',
    async () => {
      if (!shopify) return bestsellers
      const res = await shopifyFetch<{ products: { nodes: ShopifyProductSummary[] } }>(allProductsQuery, {
        first: LIST_LIMIT,
      })
      return toSummaries(res.products.nodes)
    },
    { default: () => [] },
  )
}
