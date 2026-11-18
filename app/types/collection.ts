// Сортування на сторінці колекції (pages/collections/[handle].vue): значення йде в ?sort= і в ключ i18n
export const collectionSorts = ['featured', 'price-asc', 'price-desc', 'name'] as const
export type CollectionSort = (typeof collectionSorts)[number]
