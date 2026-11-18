# North Quay Leather (NQL) — демо-магазин

Демо для портфоліо: вигаданий бренд шкіряних сумок North Quay Leather з робочим шляхом каталог → товар → кошик →
оплата тестовою карткою (план: `docs/shopify-prototype-plan.md`). Замовлення не справжні, на кожній сторінці стоїть
смужка «Demo store». Мови сайту: EN (основна) і UA. Мова спілкування з користувачем — українська.

Репозиторій публічний: фінансів, акаунтів, ключів і особистих даних сюди не писати.

## Стек
- Nuxt 4 + Vue 3 + TypeScript, `@nuxtjs/i18n` (EN за замовчуванням, UA з префіксом `/ua`, код локалі `ua` ↔ Intl `uk-UA`)
- Без UI-бібліотеки: власна дизайн-система на CSS-змінних (`app/assets/css/main.css`) і scoped-стилях
- Скіли проєкту в `.claude/skills/` (див. README там): nuxt, nuxt-best-practices, vue-best-practices,
  verification-before-completion, systematic-debugging, webapp-testing, frontend-design, site-architecture,
  nuxt-seo, schema, seo-audit, copywriting, cro, brainstorming. Користуйся ними
- `brainstorming` — **лише для нових великих фіч** (кошик, сторінка товару, оформлення замовлення, каталог з
  фільтрами, інтеграція Shopify): спершу питання, варіанти й погоджений підхід, потім код. Для правок, дрібних
  змін вигляду чи тексту його не запускати, навіть якщо в описі скіла сказано «MUST use before any creative work»
- Перевірка: `npx nuxt typecheck`. Візуальна перевірка через Playwright (скіл webapp-testing): 390, 768 і 1440 px

## Цільова архітектура (ще не підключено)
- Дані: headless **Shopify** (Storefront API). Товари, колекції, варіанти кольору, ціни, наявність.
  Додатковий контент (матеріали, розміри, догляд) у metafields. Фото з Shopify CDN
- Кошик: Shopify Cart API, ID кошика в cookie
- Оплата закордон: Shopify Checkout. Україна: власна форма з Новою поштою + LiqPay, замовлення створюється в Shopify
  з серверного callback. **Жодних фейкових «успіхів»**: «Додано» чи «Замовлено» лише після реальної відповіді
- Продакшн потребує сервера Nitro (callback-и, вебхуки, кошик), наприклад Cloudflare Worker як у Protskov.
  GitHub Pages — лише статичне демо

## Дані
- Товари й категорії компоненти беруть лише через composables з `app/composables/useCatalog.ts`
  (`useAsyncData` з ключами `catalog:*`, за замовчуванням `[]`), а не імпортом `~/data/catalog`. Під Shopify
  міняється тільки тіло цих функцій. Якщо даних немає або запит упав, секція не показується
- Каталог з Shopify (кроки 3–4 плану): `useCatalog.ts` — `useHomeCategories` (статичні плитки з
  `data/catalog.ts`, лише для колекцій, що є в Shopify), `useBestsellers` (колекція `bestsellers`), `useProduct`,
  `useCollection`, `useAllProducts`. Без `NUXT_PUBLIC_SHOPIFY_STORE_DOMAIN` усі повертають тимчасові дані з
  `app/data/`. Сайт статичний: запити йдуть під час `nuxt generate`, зміни в адмінці видно після нової збірки.
  Фото з Shopify CDN — `<NuxtImg :provider="imageProvider(url)">` (провайдер `shopify`), локальні — ipx.
  Клієнт: `app/utils/shopify.ts` (`shopifyFetch`,
  кидає і на HTTP-помилку, і на `errors` у тілі), `app/utils/shopifyQueries.ts` (запити), `app/utils/shopifyMap.ts`
  (відповідь → `ProductSummary` / `ProductDetail`; таблиці кольорів і категорій там же), типи відповідей у
  `shared/types/shopify.ts`. Налаштування в `runtimeConfig.public` (`NUXT_PUBLIC_SHOPIFY_*` у `.env`).
  Колір — опція `Color`, фото кольору — фото варіанта + фото товару з alt, що починається з назви кольору,
  `subtitle` і `specs` (JSON: `details` + `dimensions`) — metafields `custom.*`
- `app/data/brand.ts` — статична конфігурація магазину (контакти, способи оплати), не з Shopify.
  Її можна імпортувати напряму
- `app/data/navigation.ts` — усі меню (`mainNav` для шапки й бокового меню, `footerShopNav`, `footerHelpNav`).
  Новий пункт меню додавати лише туди. Теж статична конфігурація, імпорт напряму

## Типи
- Не оголошувати типи прямо в компонентах і composables. Спільні для клієнта й сервера — у `shared/types/`
  (`catalog.ts`: `ProductSummary`, `Money`, `LeatherColor`…; `store.ts`: `StoreContacts`), імпорт
  `import type { … } from '#shared/types/…'`. Лише для інтерфейсу — у `app/types/` (`~/types/…`)
- Імена типів описують дані, а не компонент: `ProductSummary`, а не `ProductCard` (так зветься компонент)

## Що зараз MOCK
- `app/data/catalog.ts` і `product.ts` — запасні дані, коли Shopify не налаштований (немає `.env`); плитки
  категорій з `catalog.ts` використовуються й із Shopify (це оформлення, а не дані)
- `app/data/brand.ts` — контакти (поки `null`, футер показує заглушки) і способи оплати
- Відгуків і блоку «Про нас» на головній немає: відгуки були справжні й чужі, вигадувати нові заборонено, а
  фото засновників належали справжньому магазину. Не повертати. Сторінка «Про нас» буде на кроці 8 плану
- Витиску ініціалів (персоналізації) на сайті немає: прибрано на кроці 1 плану. Не повертати.
- Фото в `public/images/`: Pexels, автор Muneeb Malhotra (@dhanno), оброблені (папка `../photos-processed/` поза
  репозиторієм, опис у `docs/shopify-prototype-notes.md`). Товари: `products/<handle>/<колір>-<n>.jpg` (імена не
  міняти, на них посилається `docs/products.csv`), `hero-1..3.jpg`, `detail-*.jpg`. Плитки категорій беруть
  фото товарів (поле `image` у `homeCategories`). Логотип «R» чужого бренду на шкірі затертий на фото товарів і
  на hero-1..3 (`../photos-raw/` не чіпали); на нових фото перевіряти
- Тимчасові дані `app/data/catalog.ts` (4 бестселери з каталогу з 8 сумок) і `product.ts` (демо-сторінка
  товару) ті самі, що в `docs/products.csv`. Сторінка товару `pages/products/[handle].vue` — демо: будь-який
  handle показує Tidal Barrel Bag (`barrel-bag`, burgundy і tan). «Add to cart» без дії (кошика немає). Опис і
  рішення: `docs/superpowers/specs/2026-10-29-product-page-design.md`
- `ProductDimensions`: `handleDropCm`, `strapCm`, `laptopInches` можуть бути `null` (у сумки цього немає): рядок
  у «Size & fit» ховається, діаграма без ручок малює лише корпус, однакові кінці ременя показуються одним числом.
  `ProductDetail.dimensions` теж може бути `null` (у Shopify немає `specs`): тоді ховаються рядок розміру й
  увесь блок «Size & fit»; порожні `details` ховають блок «Details»
- Смужка «Demo store. Orders are not real.» — `layout/DemoBanner.vue` над шапкою (не закріплена), висота в токені
  `--banner-h`; hero віднімає її від висоти екрана
- Сторінки товарів у статичну збірку додає `ProductCard` через `prerenderRoutes`. Фото всіх кольорів
  `ProductGallery` готує під час збірки через `useImage().getSizes` (інакше фото іншого кольору дають 404),
  тому якість — у пресеті `photo`, а не глобально
- `?color=` на сторінці товару читається з `route.query` після монтування, а пишеться через
  `history.replaceState`: `router.replace` під час гідрації статичної сторінки губив query
- Сторінок каталогу, кошика, «Про нас», доставки ще немає: посилання на них поки ведуть у 404

## Дизайн-система
- Шрифти: Instrument Serif (заголовки, 400) + Manrope (текст). В Instrument немає кирилиці, тому в
  `--font-display` другим стоїть Noto Serif Display, стиснутий через `--display-stretch: 80%`
  (на Instrument не впливає). Кожне `font-family: var(--font-display)` супроводжувати
  `font-stretch: var(--display-stretch)`. Шрифти self-host через `@nuxt/fonts` (`fonts` у `nuxt.config.ts`), без
  запитів до Google. В Instrument Serif `fallbacks: []`: метричний фолбек перехоплював кирилицю раніше за Noto
- Фото через `<NuxtImg preset="photo" sizes="…">` (`@nuxt/image`, WebP під час збірки), не `<img>`. Правило `sizes`
  в коментарі до `image` у `nuxt.config.ts`: завжди починати з `xs:`, бо значення без префікса рахується від 1px
- Кольори й шрифти лише через токени з `main.css`, без літералів у компонентах. Кольори шкіри — `--leather-*`
- Брейкпойнт мобільної версії 760px, бокові поля `--gutter` (32px, на мобільному 20px). Інтерактив від 44px
  (кружечки кольорів на картці — 28px, мінімум WCAG 2.5.8)
- Логотип — монограма-печатка `LogoMark.vue` (коло, пунктирна прострочка, NQL контурами Instrument Serif, колір
  через currentColor). У шапці 38px (висота шапки та сама), у футері й мобільному меню теж вона. Favicon і PNG-іконки
  з тієї ж печатки
- Ціни на картках круглі, без перекреслених «старих» цін і бейджів (поля `compareAtPrice`/`badge` лишаються в типі, але `null`)
- Шапка закріплена (`position: sticky`), висота в токенах `--header-h` / `--header-shrink` (`main.css`), від них
  hero і `scroll-padding-top`. Міняєш висоту шапки — онови токени. На мобільному стискається через від'ємний `top`
  (без зміни висоти), вміст зсувається transform-ом. Чорної плашки зверху немає (прибрана на прохання клієнта)
- Hero: на десктопі три фото поруч, на мобільному слайдер (керує CSS-анімація смужки, палець на банері — пауза)

## Правила текстів і верстки (Hallmark)
- Без надзаголовків (eyebrow) і дрібних КАПСІВ з розрідженням; заголовок одним стилем, без виділення слів
- Без стрілок у посиланнях («View all →»), без рядків через «·» і без тире «—» у текстах сайту
- `:focus-visible` на всьому інтерактивному, є `:active` і `:disabled`
- Анімації лише `transform` і `opacity`, з фолбеком для `prefers-reduced-motion`
- Жодних вигаданих цифр і відгуків. Сторінка не закінчується підпискою на email

## Деплой демо (GitHub Pages)
- Репозиторій github.com/Max-Lutskov/north-quay-leather (до 2026-11-18 `OldTownLeather`), гілка `main`. Пуш запускає `.github/workflows/deploy.yml`:
  `nuxt generate` з `NUXT_APP_BASE_URL=/<назва репо>/` і `NUXT_PUBLIC_NOINDEX=true`
- Демо: https://max-lutskov.github.io/north-quay-leather/ (з `noindex,nofollow`)
- Сторінки для статичної збірки задані явно в `nitro.prerender.routes` (`nuxt.config.ts`). Нову сторінку додавати туди
- `NUXT_PUBLIC_SITE_URL` і `NUXT_PUBLIC_I18N_BASE_URL` (домен без підпапки) задає workflow: з них canonical,
  hreflang і og:image (`absolutePublicUrl`). Без них посилання відносні
- Шляхи до файлів з `public/` писати через `publicPath('/images/…')` (`app/utils/publicPath.ts`), інакше вони
  ламаються в підпапці

## Відомі пастки
- `shopifyFetch` читає `useRuntimeConfig()`, а контекст Nuxt губиться після першого `await` у функції: другий
  послідовний запит дає NUXT_E1001 і порожні дані без помилки на сторінці. Кілька запитів — через `Promise.all`
  (усі стартують одразу) або `nuxtApp.runWithContext`
- Shopify: metafield типу JSON (`custom.specs`) з CSV не імпортується, а колекції з CSV публікуються лише в
  Online Store. Після переімпорту товарів `specs` вписати в адмінці, колекції додати в канал Headless
- Git Bash на Windows перетворює `/north-quay-leather/` у змінних середовища на шлях на диску. Локальну збірку
  в підпапку запускати з `MSYS_NO_PATHCONV=1`
- `package-lock.json`, створений на Windows, губить `"optional": true` у платформних пакетів `@esbuild/*`,
  і `npm ci` у Linux падає з EBADPLATFORM. Після `npm install` перевіряти це перед пушем.
  Локально npm 11, а в Actions Node 22 з npm 10. npm 11 при `npm install` викидає з lock-файлу вкладені копії
  esbuild 0.28.2 (необов'язкові peer-залежності vite), а npm 10 їх вимагає: `npm ci` у CI падає з EUSAGE
  «Missing: esbuild@0.28.2». Після `npm install` перевіряти: `npx -y npm@10 ci --dry-run --os=linux --cpu=x64`.
  Якщо падає — повернути видалені записи з попереднього lock-файлу (версії ті самі)
- Множина в текстах: форми через «|» (EN дві, UA три, правило в `i18n/i18n.config.ts`), число третім аргументом:
  `t(key, { count: n(x) }, x)`
- Dev-сервер не завжди підхоплює зміни в `i18n/locales/*.json`: на сторінці видно ключі на кшталт `color.cognac`.
  Допомагає оновити файл ще раз або перезапустити сервер
- Перший клік до гідратації не спрацьовує (бургер, слайдер): у перевірках чекати завантаження
- `localePath` для сторінок, яких ще немає (каталог, «Про нас», доставка), повертає шлях без `/ua`, тож з UA
  такі посилання ведуть на EN. Коли сторінку створено, префікс підставляється сам. Перевіряти це на UA
- Скриншоти для порівняння «до/після»: Chromium зрідка рендерить окремі літери на піксель інакше. Порівнювати
  з прапорцями `--font-render-hinting=none --disable-lcd-text`, а для рефакторингу без зміни вигляду звіряти
  HTML з `nuxt generate` (відрізнятимуться лише хеші `data-v-…`, ID збірки й час пререндеру)

## Наступні кроки (рефакторинг перед Shopify)
1. ~~Шар даних~~ — зроблено (див. «Дані»)
2. ~~Типи~~ — зроблено (див. «Типи»)
3. ~~Навігація з одного джерела~~ — зроблено (`app/data/navigation.ts`)
4. ~~VueUse~~ — зроблено: `@vueuse/nuxt` (автоімпорт). Для медіазапитів, блокування прокрутки, клавіш тощо
   брати VueUse, а не ручні `matchMedia`/`addEventListener`. Те, що залежить від розміру екрана, вмикати після
   `useMounted()`, інакше розбіжність гідратації. Пастка фокуса в `MobileMenu` власна (useFocusTrap тягне focus-trap)
5. ~~Сторінка товару (демо)~~ — зроблено, з мобільною смугою «Add to cart» унизу (див. «Що зараз MOCK»)
6. **Далі працюємо за планом `docs/shopify-prototype-plan.md`** (робочий прототип на безкоштовному dev-магазині
   Shopify, демо для портфоліо). Один крок плану за сесію. Де план розходиться з цим файлом (статична збірка
   без сервера, вигаданий бренд, без витиску ініціалів), діє план; цей файл оновлюється наприкінці кожного кроку
7. **Підготовка до кроку 0** (сесії 2026-11-17/18): бренд North Quay Leather (NQL), фото оброблені
   (`../photos-processed/`), каталог з 8 сумок погоджено, `docs/products.csv` складено, план оновлено. Деталі й
   промти для кроків 1–2 у `docs/shopify-prototype-notes.md`. Dev-магазин `north-quay-leather.myshopify.com`
   налаштовано і перевірено (план, «Дані кроку 0»); домен і публічний токен у `.env` (не в git)
8. **Крок 1 плану зроблено** (витиск ініціалів прибрано).
9. **Крок 2 плану зроблено** (бренд North Quay Leather, фото, без Etsy і відгуків). Репозиторій перейменовано
   на `north-quay-leather`, адреси фото в `docs/products.csv` оновлено.
10. **Каталог у Shopify залито** (2026-11-18): 8 товарів, колекції й `bestsellers` у каналі Headless, `specs`
   заповнено вручну (JSON-metafield з CSV не імпортується). Деталі: план, крок 4.
11. **Крок 3 плану зроблено** (клієнт Storefront API, див. «Дані»); перевірено на справжніх товарах тимчасовою
   сторінкою, її прибрано. Сайт ще на тимчасових даних. Далі крок 4 (`useCatalog.ts` з Shopify)
