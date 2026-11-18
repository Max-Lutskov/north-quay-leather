import type { StoreContacts } from '#shared/types/store'

// Поки клієнтка не надала контакти, тут null: футер показує заглушки.
export const contacts: StoreContacts = {
  email: null,
  instagram: null,
  phone: null,
}

export const paymentMethods = ['Visa', 'Mastercard', 'Apple Pay', 'Google Pay'] as const
