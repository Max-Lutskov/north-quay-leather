// Дані магазину, що не приходять з Shopify: контакти.

// null — клієнтка ще не надала, на сайті показуємо заглушку.
export interface StoreContacts {
  email: string | null
  instagram: string | null
  phone: string | null
}
