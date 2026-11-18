// Кошик Shopify (Cart API) у формі для інтерфейсу. Суми лише з відповіді Shopify, у браузері не рахуємо.
import type { LeatherColor, Money, ProductImage } from './catalog'

export interface CartLine {
  id: string
  quantity: number
  // Сума рядка (ціна × кількість) від Shopify
  total: Money
  variantId: string
  handle: string
  title: string
  color: LeatherColor | null
  image: ProductImage | null
}

export interface Cart {
  id: string
  // Перехід до оплати (Shopify Checkout)
  checkoutUrl: string
  totalQuantity: number
  subtotal: Money
  lines: CartLine[]
}
