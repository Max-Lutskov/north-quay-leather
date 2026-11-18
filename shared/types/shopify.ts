// Типи відповідей Storefront API (лише поля, які ми запитуємо в app/utils/shopifyQueries.ts).
// Компоненти їх не бачать: app/utils/shopifyMap.ts перекладає їх у типи з catalog.ts.

// Обгортка відповіді GraphQL: на помилки запиту HTTP-статус 200, а помилки лежать в errors
export interface ShopifyResponse<T> {
  data?: T
  errors?: { message: string }[]
}

export interface ShopifyMoney {
  amount: string
  currencyCode: string
}

export interface ShopifyImage {
  url: string
  altText: string | null
}

export interface ShopifyMetafield {
  value: string
}

export interface ShopifySelectedOption {
  name: string
  value: string
}

export interface ShopifyVariant {
  selectedOptions: ShopifySelectedOption[]
  image: ShopifyImage | null
}

// Товар у списках (картка): fragment ProductSummaryFields
export interface ShopifyProductSummary {
  handle: string
  title: string
  featuredImage: ShopifyImage | null
  priceRange: { minVariantPrice: ShopifyMoney }
  variants: { nodes: ShopifyVariant[] }
  subtitle: ShopifyMetafield | null
}

// Сторінка товару: query ProductDetail
export interface ShopifyProductDetail extends ShopifyProductSummary {
  description: string
  images: { nodes: ShopifyImage[] }
  specs: ShopifyMetafield | null
  collections: { nodes: { handle: string }[] }
}
