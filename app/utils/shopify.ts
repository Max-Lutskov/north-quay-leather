// Запит до Shopify Storefront API. Працює і під час збірки (каталог), і в браузері (кошик):
// токен публічний, сервер не потрібен. Налаштування в runtimeConfig.public (nuxt.config.ts, .env).
// Пастка: useRuntimeConfig потребує контексту Nuxt, а він губиться після першого await у функції. Кілька
// запитів робити паралельно (Promise.all, усі виклики стартують одразу) або через nuxtApp.runWithContext,
// інакше NUXT_E1001 і порожні дані.
import type { ShopifyResponse } from '#shared/types/shopify'

// Провайдер @nuxt/image для фото: з Shopify CDN — shopify (CDN сам ріже ширину й віддає WebP),
// локальні з public/ — за замовчуванням (ipx під час збірки)
export function imageProvider(url: string): 'shopify' | undefined {
  return url.startsWith('https://cdn.shopify.com/') ? 'shopify' : undefined
}

export async function shopifyFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const config = useRuntimeConfig().public
  const shopifyStoreDomain = String(config.shopifyStoreDomain ?? '')
  const shopifyStorefrontToken = String(config.shopifyStorefrontToken ?? '')
  const shopifyApiVersion = String(config.shopifyApiVersion ?? '')
  if (!shopifyStoreDomain || !shopifyStorefrontToken) {
    throw new Error('Shopify is not configured: set NUXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NUXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN')
  }

  // На HTTP-помилку (401, 5xx…) $fetch кидає сам
  const res = await $fetch<ShopifyResponse<T>>(
    `https://${shopifyStoreDomain}/api/${shopifyApiVersion}/graphql.json`,
    {
      method: 'POST',
      headers: { 'X-Shopify-Storefront-Access-Token': shopifyStorefrontToken },
      body: { query, variables },
    },
  )
  // GraphQL віддає 200 і з помилками запиту
  if (res.errors?.length) {
    throw new Error(`Shopify: ${res.errors.map((e) => e.message).join('; ')}`)
  }
  if (!res.data) {
    throw new Error('Shopify: empty response')
  }
  return res.data
}
