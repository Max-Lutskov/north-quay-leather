// Тимчасові дані головної, поки немає підключення до Shopify Storefront API.
// Компоненти беруть їх лише через composables з useCatalog.ts. Типи — у shared/types/catalog.ts.
// Це 4 з 8 товарів каталогу (docs/shopify-prototype-notes.md, «Каталог»): назви, ціни й фото ті самі, що в
// docs/products.csv. Ціни круглі, без перекреслених «старих» цін і плашок.
import type { HomeCategory, ProductSummary } from '#shared/types/catalog'

// Плитки беруть фото товарів на персиковому тлі (окремих файлів немає)
export const homeCategories: HomeCategory[] = [
  { handle: 'totes', labelKey: 'category.totes', image: '/images/products/structured-tote/green-3.jpg' },
  { handle: 'shoulder-bags', labelKey: 'category.shoulderBags', image: '/images/products/barrel-bag/burgundy-3.jpg' },
  { handle: 'laptop-work', labelKey: 'category.laptopWork', image: '/images/products/quilted-work-tote/burgundy-3.jpg' },
  { handle: 'mini-crossbody', labelKey: 'category.miniCrossbody', image: '/images/products/camera-crossbody/black-2.jpg' },
]

export const bestsellers: ProductSummary[] = [
  {
    handle: 'structured-tote',
    title: 'Bollard Tote',
    subtitle: 'Structured, with a detachable strap',
    image: { url: '/images/products/structured-tote/green-1.jpg', alt: 'Green Bollard Tote, three-quarter view with the knotted front tab' },
    price: { amount: 185, currencyCode: 'USD' },
    compareAtPrice: null,
    colors: ['green'],
    imageColor: 'green',
    colorImages: {},
    badge: null,
  },
  {
    handle: 'barrel-bag',
    title: 'Tidal Barrel Bag',
    subtitle: 'Shaded leather, crossbody strap',
    image: { url: '/images/products/barrel-bag/burgundy-1.jpg', alt: 'Burgundy Tidal Barrel Bag, three-quarter view with the strap' },
    price: { amount: 160, currencyCode: 'USD' },
    compareAtPrice: null,
    colors: ['burgundy', 'tan'],
    imageColor: 'burgundy',
    colorImages: {
      tan: { url: '/images/products/barrel-bag/tan-1.jpg', alt: 'Tan Tidal Barrel Bag, three-quarter view with the strap' },
    },
    badge: null,
  },
  {
    handle: 'quilted-work-tote',
    title: 'Ledger Work Tote',
    subtitle: 'Quilted, fits a 14 inch laptop',
    image: { url: '/images/products/quilted-work-tote/burgundy-1.jpg', alt: 'Burgundy Ledger Work Tote, front view' },
    price: { amount: 195, currencyCode: 'USD' },
    compareAtPrice: null,
    colors: ['burgundy'],
    imageColor: 'burgundy',
    colorImages: {},
    badge: null,
  },
  {
    handle: 'dome-bag',
    title: 'Beacon Dome Bag',
    subtitle: 'Lizard-embossed, zip around',
    image: { url: '/images/products/dome-bag/burgundy-1.jpg', alt: 'Burgundy Beacon Dome Bag, front view' },
    price: { amount: 175, currencyCode: 'USD' },
    compareAtPrice: null,
    colors: ['burgundy', 'black'],
    imageColor: 'burgundy',
    colorImages: {
      black: { url: '/images/products/dome-bag/black-1.jpg', alt: 'Black Beacon Dome Bag, front view' },
    },
    badge: null,
  },
]
