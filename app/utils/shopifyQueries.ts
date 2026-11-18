// GraphQL-запити до Storefront API. Форма відповідей — у shared/types/shopify.ts.
// Колір беремо з опції варіанта Color, subtitle і specs — metafields custom.* (доступ для Storefront
// вмикається у визначенні metafield в адмінці, інакше приходить null).

const productSummaryFields = /* GraphQL */ `
  fragment ProductSummaryFields on Product {
    handle
    title
    featuredImage { url altText }
    priceRange { minVariantPrice { amount currencyCode } }
    variants(first: 20) { nodes { selectedOptions { name value } image { url altText } } }
    subtitle: metafield(namespace: "custom", key: "subtitle") { value }
  }
`

export const productDetailQuery = /* GraphQL */ `
  ${productSummaryFields}
  query ProductDetail($handle: String!) {
    product(handle: $handle) {
      ...ProductSummaryFields
      description
      images(first: 30) { nodes { url altText } }
      specs: metafield(namespace: "custom", key: "specs") { value }
      collections(first: 10) { nodes { handle } }
    }
  }
`

export const collectionHandlesQuery = /* GraphQL */ `
  query CollectionHandles {
    collections(first: 50) { nodes { handle } }
  }
`

// Усі товари в порядку, як у адмінці (сортування й фільтр — на сторінці, план, крок 5)
export const allProductsQuery = /* GraphQL */ `
  ${productSummaryFields}
  query AllProducts($first: Int!) {
    products(first: $first, sortKey: CREATED_AT) { nodes { ...ProductSummaryFields } }
  }
`

export const collectionProductsQuery = /* GraphQL */ `
  ${productSummaryFields}
  query CollectionProducts($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      products(first: $first) { nodes { ...ProductSummaryFields } }
    }
  }
`
