// Тексти товару мовою сторінки: в UA — з app/data/productCopy.ts, інакше (і якщо перекладу немає) —
// англійські з Shopify. Дані каталогу однакові для обох мов, тож мову підставляємо під час показу
import { productCopyUa } from '~/data/productCopy'

export function useProductCopy() {
  const { locale } = useI18n()
  const copy = (handle: string) => (locale.value === 'ua' ? productCopyUa[handle] : undefined)

  return {
    subtitle: (p: { handle: string; subtitle: string }) => copy(p.handle)?.subtitle ?? p.subtitle,
    description: (p: { handle: string; description: string }) => copy(p.handle)?.description ?? p.description,
    details: (p: { handle: string; details: string[] }) => copy(p.handle)?.details ?? p.details,
  }
}
