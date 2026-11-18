// Кошик Shopify (Cart API) прямо з браузера: сайт статичний, сервера немає, публічного токена досить.
// Стан спільний для всіх компонентів (useState). ID кошика зберігається в localStorage і читається лише
// в браузері після монтування (load викликає шапка), тож розмітка збірки й гідрації однакова.
// Жодних фейкових «успіхів»: add/update/remove повертають true лише після відповіді Shopify без помилок.
import type { Cart } from '#shared/types/cart'
import type { ShopifyCart, ShopifyUserError } from '#shared/types/shopify'

const STORAGE_KEY = 'nql-cart-id'

interface CartMutationResult {
  cart: ShopifyCart | null
  userErrors: ShopifyUserError[]
}

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

export function useCart() {
  // Обробники кліків працюють поза контекстом Nuxt, а shopifyFetch читає useRuntimeConfig (див. utils/shopify.ts)
  const nuxtApp = useNuxtApp()
  const request = <T>(query: string, variables: Record<string, unknown>) =>
    nuxtApp.runWithContext(() => shopifyFetch<T>(query, variables))

  const cart = useState<Cart | null>('cart', () => null)
  const pending = useState('cart:pending', () => false)
  const error = useState<string | null>('cart:error', () => null)
  const loaded = useState('cart:loaded', () => false)
  const isOpen = useState('cart:open', () => false)
  const count = computed(() => cart.value?.totalQuantity ?? 0)

  function setCart(next: ShopifyCart | null) {
    cart.value = next ? mapCart(next) : null
    writeCartId(next?.id ?? null)
  }

  function applyResult(res: CartMutationResult) {
    if (res.userErrors.length) throw new Error(`Shopify: ${res.userErrors.map((e) => e.message).join('; ')}`)
    if (!res.cart) throw new Error('Shopify: no cart in response')
    setCart(res.cart)
  }

  async function run(task: () => Promise<void>): Promise<boolean> {
    pending.value = true
    error.value = null
    try {
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
  }

  // Збережений кошик. Якщо Shopify повернув null (кошик оплачено або він застарів), починаємо новий
  async function load() {
    if (loaded.value) return
    loaded.value = true
    const id = readCartId()
    if (!id) return
    await run(async () => {
      const res = await request<{ cart: ShopifyCart | null }>(cartQuery, { id })
      setCart(res.cart)
    })
  }

  async function create(lines: { merchandiseId: string; quantity: number }[]) {
    const res = await request<{ cartCreate: CartMutationResult }>(cartCreateMutation, { lines })
    applyResult(res.cartCreate)
  }

  function add(variantId: string, quantity = 1) {
    const lines = [{ merchandiseId: variantId, quantity }]
    return run(async () => {
      if (!cart.value) return create(lines)
      const res = await request<{ cartLinesAdd: CartMutationResult }>(cartLinesAddMutation, {
        cartId: cart.value.id,
        lines,
      })
      // Кошик зник між завантаженням і кліком: новий кошик з цим рядком
      if (!res.cartLinesAdd.cart && !res.cartLinesAdd.userErrors.length) return create(lines)
      applyResult(res.cartLinesAdd)
    })
  }

  function update(lineId: string, quantity: number) {
    if (quantity <= 0) return remove(lineId)
    return run(async () => {
      if (!cart.value) throw new Error('No cart')
      const res = await request<{ cartLinesUpdate: CartMutationResult }>(cartLinesUpdateMutation, {
        cartId: cart.value.id,
        lines: [{ id: lineId, quantity }],
      })
      applyResult(res.cartLinesUpdate)
    })
  }

  function remove(lineId: string) {
    return run(async () => {
      if (!cart.value) throw new Error('No cart')
      const res = await request<{ cartLinesRemove: CartMutationResult }>(cartLinesRemoveMutation, {
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
    openCart: () => {
      isOpen.value = true
    },
    closeCart: () => {
      isOpen.value = false
    },
  }
}
