import type { StoreContacts } from '#shared/types/store'

// Поки клієнтка не надала контакти, тут null: футер показує заглушки.
export const contacts: StoreContacts = {
  email: null,
  instagram: null,
  phone: null,
}

export const paymentMethods = ['Visa', 'Mastercard', 'Apple Pay', 'Google Pay'] as const

// Пароль вітрини dev-магазину Shopify (Online Store → Preferences). Не секрет: його показуємо відвідувачам
// демо в кошику, бо без нього оформлення замовлення не відкривається (план, «Дані кроку 0»)
export const demoStorePassword = 'degesi'
