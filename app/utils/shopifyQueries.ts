// GraphQL-запити до Storefront API. Форма відповідей — у shared/types/shopify.ts.
// Колір беремо з опції варіанта Color, subtitle і specs — metafields custom.* (доступ для Storefront
// вмикається у визначенні metafield в адмінці, інакше приходить null).

const productSummaryFields = /* GraphQL */ `
  fragment ProductSummaryFields on Product {
    handle
    title
    featuredImage { url altText }
    priceRange { minVariantPrice { amount currencyCode } }
    variants(first: 20) { nodes { id availableForSale price { amount currencyCode } selectedOptions { name value } image { url altText } } }
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

// Кошик (Cart API). Кожна мутація повертає кошик цілком і userErrors
const cartFields = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost { subtotalAmount { amount currencyCode } }
    lines(first: 50) {
      nodes {
        id
        quantity
        cost { totalAmount { amount currencyCode } }
        merchandise {
          ... on ProductVariant {
            id
            availableForSale
            price { amount currencyCode }
            selectedOptions { name value }
            image { url altText }
            product { handle title }
          }
        }
      }
    }
  }
`

export const cartQuery = /* GraphQL */ `
  ${cartFields}
  query Cart($id: ID!) { cart(id: $id) { ...CartFields } }
`

export const cartCreateMutation = /* GraphQL */ `
  ${cartFields}
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) { cart { ...CartFields } userErrors { field message } warnings { code message } }
  }
`

export const cartLinesAddMutation = /* GraphQL */ `
  ${cartFields}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartFields } userErrors { field message } warnings { code message } }
  }
`

export const cartLinesUpdateMutation = /* GraphQL */ `
  ${cartFields}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...CartFields } userErrors { field message } warnings { code message } }
  }
`

export const cartLinesRemoveMutation = /* GraphQL */ `
  ${cartFields}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ...CartFields } userErrors { field message } warnings { code message } }
  }
`
