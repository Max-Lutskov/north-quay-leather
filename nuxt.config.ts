export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/i18n', '@vueuse/nuxt', '@nuxt/image', '@nuxt/fonts'],
  css: ['~/assets/css/main.css'],

  app: {
    head: {
      meta: [{ name: 'theme-color', content: '#F4EFE8' }],
    },
  },

  // Шрифти скачуються під час збірки й віддаються з нашого сайту, без запитів до Google
  // (швидше і без передачі IP відвідувачів з ЄС). Сімейства задані явно, бо в CSS вони стоять
  // у змінних (--font-display, --font-body), які модуль сам не знаходить.
  fonts: {
    defaults: {
      subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
      styles: ['normal'],
    },
    families: [
      // Без метричного фолбека: він покриває всі символи і перехоплював би кирилицю раніше за Noto Serif Display
      { name: 'Instrument Serif', provider: 'google', weights: [400], global: true, preload: true, fallbacks: [] },
      { name: 'Manrope', provider: 'google', weights: [400, 500, 600, 700], global: true, preload: true },
      // Кирилиця для заголовків. Вісь ширини потрібна для --display-stretch
      {
        name: 'Noto Serif Display',
        provider: 'google',
        weights: [400],
        subsets: ['cyrillic', 'cyrillic-ext'],
        variableAxis: { wdth: [{ min: 62.5, max: 100 }] },
        global: true,
      },
    ],
  },

  // Фото стискаються в WebP потрібних ширин під час збірки (ipx). Коли фото підуть з Shopify CDN,
  // тут міняється провайдер, а компоненти лишаються.
  // sizes у <NuxtImg>: кожен запис «екран:ширина» діє від цього екрана (xs 320, sm 640, md 768, lg 1024,
  // xl 1280, 2xl 1536), і ширина файлу рахується від нього. Значення без префікса рахується від 1px,
  // тому завжди починати з xs:, а на xl (контейнер 1280) ставити ширину в px.
  image: {
    // Фото товарів з Shopify CDN (utils/shopify.ts, imageProvider): ширину й WebP робить сам CDN
    // baseURL порожній: адреси з Shopify уже повні
    shopify: { baseURL: '' },
    presets: {
      // Якість у пресеті, а не глобально: так її бачить і useImage().getSizes (ProductGallery)
      photo: { modifiers: { format: 'webp', quality: 72 } },
    },
  },

  // Статична збірка (демо на GitHub Pages): сторінки задаємо явно, обхід посилань вимкнено, щоб випадкове
  // посилання не тягнуло в збірку зайве. Нову сторінку додавати сюди (EN і /ua).
  nitro: {
    prerender: {
      crawlLinks: false,
      // Помилка на будь-якій сторінці (Shopify недоступний, товар зник) зупиняє збірку: деплой не відбудеться,
      // і на GitHub Pages лишиться попередня робоча версія, а не сайт з дірками
      failOnError: true,
      // Сторінки товарів додає ProductCard через prerenderRoutes (кожна картка — свою сторінку), а картки є
      // на сторінках колекцій, тож збираються всі товари. Колекції — ті, на які ведуть меню, плитки й футер
      routes: [
        '/',
        '/ua',
        '/about',
        '/ua/about',
        '/shipping',
        '/ua/shipping',
        ...['all', 'totes', 'shoulder-bags', 'laptop-work', 'mini-crossbody'].flatMap((c) => [
          `/collections/${c}`,
          `/ua/collections/${c}`,
        ]),
      ],
    },
  },

  i18n: {
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'ua', language: 'uk-UA', name: 'Українська', file: 'ua.json' },
    ],
    detectBrowserLanguage: false,
    // Домен для canonical і hreflang задається змінною NUXT_PUBLIC_I18N_BASE_URL (як і NUXT_PUBLIC_SITE_URL,
    // без підпапки: app.baseURL i18n додає сам)
  },

  // Значення з .env (NUXT_PUBLIC_*). Секретів у прототипі немає: сервера Nitro немає, а публічний токен
  // Storefront API для того й призначений, щоб бути в браузері (docs/shopify-prototype-plan.md, «Рішення»).
  runtimeConfig: {
    public: {
      // Storefront API: домен *.myshopify.com, публічний токен каналу Headless, версія API.
      // Порожній домен: каталог береться з тимчасових даних у app/data/
      shopifyStoreDomain: '',
      shopifyStorefrontToken: '',
      shopifyApiVersion: '2026-10',
      // Домен сайту без підпапки й без слеша в кінці, напр. https://max-lutskov.github.io.
      // Потрібен для абсолютних посилань: canonical, hreflang, og:image.
      siteUrl: '',
      // true на демо (GitHub Pages): сторінки не індексуються. На бойовому сайті лишити false.
      noindex: false,
    },
  },
})
