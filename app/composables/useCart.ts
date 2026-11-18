// Кошик Shopify (Cart API) прямо з браузера: сайт статичний, сервера немає, публічного токена досить.
// Стан спільний для всіх компонентів (useState). ID кошика зберігається в localStorage і читається лише
// в браузері після монтування (load викликає шапка), тож розмітка збірки й гідрації однакова.
// Жодних фейкових «успіхів»: add/update/remove повертають true лише після відповіді Shopify без помилок і без
// попереджень (MERCHANDISE_OUT_OF_STOCK приходить як warning, а не як userError).
// Запити до кошика йдуть строго по черзі й лише після завантаження збереженого кошика: інакше дві відповіді
// перезаписували б одна одну (новий кошик замість збереженого тощо).
import type { Cart } from '#shared/types/cart'
import type { ShopifyCart, ShopifyCartMutationResult } from '#shared/types/shopify'

const STORAGE_KEY = 'nql-cart-id'

// Черга запитів і завантаження збереженого кошика. Лише в браузері (на сервері кошик не викликається),
// тому звичайні змінні модуля, а не useState: проміси не серіалізуються
let queue: Promise<unknown> = Promise.resolve()
let loading: Promise<void> | null = null

// localStorage може бути недоступний (приватний режим, заблоковані дані сайту): тоді кошик живе до перезавантаження
function readCartId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  }
  catch {
    return null
  }
}
function writeCartId(id: string | null) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  }
  catch {
    // див. readCartId
  }
}

// ID кошика, якого Shopify уже не знає (оплачений, застарілий): помилка в полі cartId
function isStaleCartError(res: ShopifyCartMutationResult) {
  return !res.cart && (!res.userErrors.length || res.userErrors.some((e) => e.field?.includes('cartId')))
}

export function useCart() {
  // Обробники кліків працюють поза контекстом Nuxt, а shopifyFetch читає useRuntimeConfig (див. utils/shopify.ts)
  const nuxtApp = useNuxtApp()
  const request = <T>(query: string, variables: Record<string, unknown>) =>
    nuxtApp.runWithContext(() => shopifyFetch<T>(query, variables))

  const cart = useState<Cart | null>('cart', () => null)
  const pending = useState('cart:pending', () => false)
  const error = useState<string | null>('cart:error', () => null)
  const isOpen = useState('cart:open', () => false)
  const count = computed(() => cart.value?.totalQuantity ?? 0)

  function setCart(next: ShopifyCart | null) {
    cart.value = next ? mapCart(next) : null
    writeCartId(next?.id ?? null)
  }

  // Кошик з відповіді показуємо завжди (він відповідає дійсності), але успіх — лише без помилок і попереджень
  function applyResult(res: ShopifyCartMutationResult) {
    if (res.cart) setCart(res.cart)
    const problems = [...res.userErrors, ...res.warnings].map((e) => e.message)
    if (problems.length) throw new Error(`Shopify: ${problems.join('; ')}`)
    if (!res.cart) throw new Error('Shopify: no cart in response')
  }

  // Збережений кошик. Shopify повернув null (кошик оплачено або він застарів) — забуваємо ID.
  // Невдале завантаження (мережа) можна повторити: наступний виклик спробує знову
  function load(): Promise<void> {
    if (!loading) {
      const id = readCartId()
      loading = !id
        ? Promise.resolve()
        : request<{ cart: ShopifyCart | null }>(cartQuery, { id })
            .then((res) => setCart(res.cart))
            .catch((e) => {
              loading = null
              console.error('[cart]', e)
            })
    }
    return loading
  }

  // Одна операція з кошиком: чекає збережений кошик і попередні операції, керує pending і error
  function run(task: () => Promise<void>): Promise<boolean> {
    const job = queue.then(async () => {
      pending.value = true
      error.value = null
      try {
        await load()
        await task()
        return true
      }
      catch (e) {
        error.value = e instanceof Error ? e.message : String(e)
        console.error('[cart]', e)
        return false
      }
      finally {
        pending.value = false
      }
    })
    queue = job
    return job
  }

  async function create(lines: { merchandiseId: string; quantity: number }[]) {
    const res = await request<{ cartCreate: ShopifyCartMutationResult }>(cartCreateMutation, { lines })
    applyResult(res.cartCreate)
  }

  function add(variantId: string, quantity = 1) {
    const lines = [{ merchandiseId: variantId, quantity }]
    return run(async () => {
      if (!cart.value) return create(lines)
      const res = await request<{ cartLinesAdd: ShopifyCartMutationResult }>(cartLinesAddMutation, {
        cartId: cart.value.id,
        lines,
      })
      // Кошик зник між завантаженням і кліком: новий кошик з цим рядком
      if (isStaleCartError(res.cartLinesAdd)) {
        setCart(null)
        return create(lines)
      }
      applyResult(res.cartLinesAdd)
    })
  }

  function update(lineId: string, quantity: number) {
    if (quantity <= 0) return remove(lineId)
    return run(async () => {
      if (!cart.value) throw new Error('No cart')
      const res = await request<{ cartLinesUpdate: ShopifyCartMutationResult }>(cartLinesUpdateMutation, {
        cartId: cart.value.id,
        lines: [{ id: lineId, quantity }],
      })
      applyResult(res.cartLinesUpdate)
    })
  }

  function remove(lineId: string) {
    return run(async () => {
      if (!cart.value) throw new Error('No cart')
      const res = await request<{ cartLinesRemove: ShopifyCartMutationResult }>(cartLinesRemoveMutation, {
        cartId: cart.value.id,
        lineIds: [lineId],
      })
      applyResult(res.cartLinesRemove)
    })
  }

  return {
    cart: readonly(cart),
    count,
    pending: readonly(pending),
    error: readonly(error),
    isOpen,
    load,
    add,
    update,
    remove,
    // Помилка попередньої дії (напр. невдалого Add на сторінці товару) до відкритої панелі не стосується
    openCart: () => {
      error.value = null
      isOpen.value = true
    },
    closeCart: () => {
      isOpen.value = false
    },
  }
}
