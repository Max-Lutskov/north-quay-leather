// Тимчасова демо-сторінка товару, поки немає Shopify: будь-який handle показує цю сумку (useProduct у
// useCatalog.ts). Дані ті самі, що в docs/products.csv (Tidal Barrel Bag, два кольори).
// Тип ProductDetail — у shared/types/catalog.ts.
import type { ProductDetail, ProductImage } from '#shared/types/catalog'

const dir = '/images/products/barrel-bag'
const photo = (file: string, alt: string): ProductImage => ({ url: `${dir}/${file}.jpg`, alt })

export const demoProduct: ProductDetail = {
  handle: 'barrel-bag',
  title: 'Tidal Barrel Bag',
  description:
    'A barrel bag in shaded leather with smooth piped edges and handle straps that run under the base. Carry it by the rolled handles or clip on the strap to wear it crossbody. The shading varies a little from bag to bag.',
  price: { amount: 160, currencyCode: 'USD' },
  colors: ['burgundy', 'tan'],
  defaultColor: 'burgundy',
  images: {
    burgundy: [
      photo('burgundy-1', 'Burgundy Tidal Barrel Bag, three-quarter view with the strap'),
      photo('burgundy-2', 'Burgundy Tidal Barrel Bag, front view'),
      photo('burgundy-3', 'Burgundy Tidal Barrel Bag, on a stand'),
    ],
    tan: [
      photo('tan-1', 'Tan Tidal Barrel Bag, three-quarter view with the strap'),
      photo('tan-2', 'Tan Tidal Barrel Bag, front view with the strap'),
      photo('tan-3', 'Tan Tidal Barrel Bag, side view'),
    ],
  },
  details: [
    'Shaded leather with smooth piping',
    'Zip top closure',
    'Detachable, adjustable crossbody strap',
    'Gold-tone hardware',
  ],
  dimensions: {
    heightCm: 20,
    topWidthCm: 30,
    bottomWidthCm: 30,
    depthCm: 18,
    handleDropCm: 14,
    strapCm: [105, 125],
    laptopInches: null,
  },
  category: { handle: 'shoulder-bags', labelKey: 'category.shoulderBags' },
}
