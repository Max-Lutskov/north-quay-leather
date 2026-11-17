# Прототип на Shopify: нотатки підготовки (сесія 2026-11-17)

Доповнення до `docs/shopify-prototype-plan.md`. Тут те, що знайдено до кроку 0: назви бренду, фото, формат CSV.
Бренд і фото Макс погодив 2026-11-18, каталог ще ні. Після рішень перенести підсумок у план («Дані кроку 0») і цей файл скоротити.

## Стан пунктів сесії

1. Бренд: **North Quay Leather (печатка NQL)**, вибрав Макс 2026-11-18. Вписано в план, «Дані кроку 0».
2. Фото: вирішено брати Muneeb Malhotra (@dhanno, Pexels), 73 предметні кадри, розкладка на товари нижче.
   Завантажено 2026-11-18: 31 фото, 2400 px завширшки, у `C:\Users\maksl\Desktop\otl-demo\photos-raw\`
   (поза репозиторієм; імена `<товар>-<колір>-<модель>-<n>-<white|peach>.jpg`, `hero-1..3`, `leather-closeup`).
3. Каталог: **погоджено Максом 2026-11-18**, розділ «Каталог» нижче.
   `docs/products.csv`: **складено 2026-11-18** (8 товарів, 10 варіантів, 24 фото, 24 рядки). Фото через
   raw.githubusercontent.com (вибір Макса), розміри без ременя/ручок/ноутбука = `null` (погоджено). Шаблон CSV
   звірено 2026-11-18 (розділ 3). Генератор поза репозиторієм (scratchpad сесії); правки робити прямо в CSV
4. Оновлення плану (1–2 кольори, крок 4 посилається на готовий CSV, крок 2 фото й HomeLeather, назва бренду):
   **зроблено 2026-11-18**
5. Пакетна обробка фото: **зроблено 2026-11-18**, результат у `otl-demo\photos-processed\` (розділ «Оброблені фото»).
6. Перевірка `cartCreate` → `checkoutUrl`: **зроблено 2026-11-18**, результат «між Б і В» (після пароля головна,
   повторний перехід відкриває оформлення). Dev-магазин, Headless, Bogus Gateway, metafields теж налаштовано.
   Усе в плані, «Дані кроку 0».
7. Промти для Sonnet на кроки 1 і 2: **написано 2026-11-18**, розділ «Промти для Sonnet» у кінці файла.

## 1. Назви бренду (кандидати)

Вебпошук **не ловить дрібні магазини** (Etsy, Instagram): Harrow & Vale він «не знайшов», а Макс знайшов, що такий
бренд є. 2026-11-18 решту чотири перевірено пошуком точної назви в лапках: брендів не видно, але це не гарантія.
Перед вибором Макс перевіряє вручну: пошук на Etsy, Instagram, домен `.com`.

| Назва | Печатка | Примітка |
|---|---|---|
| North Quay Leather | NQL | Три літери, як OTL: `LogoMark.vue` міняється мінімально. «North Quay» поширена назва місць (Лондон, Брісбен), бренду сумок не видно |
| Ostler & Reed | O&R | |
| Tolliver Gray | TG | Дві літери, печатку доведеться перекомпонувати |
| Halden Thorne | HT | Те саме |

Відкинуто: Harrow & Vale (бренд існує, знайшов Макс), Marlow Hide (є бруклінський бренд шкіряних сумок Marlow Goods), Bray & Lowell (брати Bray це Billykirk),
Wren & Tallow (є Wren & Ivy і багато моделей «Wren» в інших брендів).

## 2. Фото: Muneeb Malhotra (@dhanno), Pexels (вибір Макса 2026-11-18)

Профіль: https://www.pexels.com/@dhanno/ (на сторінці профілю видно лише модні фото; сумки знаходяться пошуком
і за номерами). Ліцензія Pexels: безкоштовно, підпис автора не обов'язковий. Посилання: `https://www.pexels.com/photo/<номер>/`.

Перевірено 2026-11-18: зібрано всі кадри автора в діапазонах номерів зйомок (сусідні номери перебрано, автор
звірений на сторінці кожного фото). Дві предметні зйомки тих самих сумок + одна з моделлю:

- **Білий фон** (каталог, сторінка товару): 22432979–22432995, 22434756–22434783 (31 кадр)
- **Персиковий фон, подіуми, сухоцвіти** (hero, плитки категорій): 23223828–23223862 (30 кадрів)
- Модель на персиковому фоні: 21897124–21897320 (тут не використовуємо)

Однакові сумки є в обох зйомках, тому в галереї товару: 1–2 кадри на білому + 1 на персиковому.
Розкладка за мініатюрами; **звірити на повному розмірі при завантаженні** (модель, фурнітура, чи немає логотипів):

| Товар | Колір | Білий фон | Персиковий | Колекція |
|---|---|---|---|---|
| A. Структурований тоут з золотою фурнітурою | green | 22432980, 22432995 | 23223830, 23223836 | totes |
| B. Високий тоут | burgundy | 22432982, 22432994 | 23223835 (звірити: схоже на тиснення) | totes |
| C. Сумка-«купол» з ручками | burgundy | 22434764, 22434768 | 23223847, 23223848 | shoulder-bags |
| C. той самий, другий колір **справжнім фото** | black | 22434770 | 23223860 | |
| D. Сумка-бочонок | burgundy | 22434763, 22434772 | 23223858 | shoulder-bags |
| D. другий колір справжнім фото | tan | 22434757, 22434773 | 23223853 | |
| E. Камера-бег через плече | black | 22432986 | 23223839, 23223841 | mini-crossbody |
| G. Сумка-коробка на ремені | cognac | 22434767, 22434761 | 23223854 | mini-crossbody або shoulder-bags |
| H. Тоут з довгими ручками | tan | 22434765 | 23223842, 23223859 | laptop-work |
| I. Зібрана м'яка сумка (хобо) | burgundy | 22432985 (разом із сірою) | 23223831 | shoulder-bags |

Ще одиночні кадри без пари: 22432979 (бордова м'яка з ременем), 22432989 (коричнева маленька кросбоді),
22434756 (сіра кросбоді), 22434758 (сірий тоут), 22434760 (молочна з ручкою), 22434766 (темно-коричнева сумка),
22434774 (чорний тоут), 22434782 (бежева з клапаном), 22432983 і 22432987 (рожевий тоут), гаманці 22434780,
22434781, 22434783; на персиковому 23223861 (коньячний тоут), 23223838 (оливкова), 23223840 (сіро-коричнева кросбоді),
гаманці 23223845, 23223855, 23223856, 23223857.

Кольорів сірий, рожевий, бежевий, молочний у `LeatherColor` немає: такі кадри або не брати, або перефарбувати.

**Пропозиція для сайту** (персиковий фон):
- Hero (3): 23223834, 23223837, 23223849 (кілька сумок на подіумах)
- Плитки категорій: totes 23223836, shoulder-bags 23223847, laptop-work 23223842, mini-crossbody 23223839
- Шкіра крупним планом: 22432984 (крупний план рожевої сумки, звірити) або 10340652 (інший автор,
  https://www.pexels.com/photo/close-up-photo-of-a-brown-leather-bag-10340652/)

Тоді 8 товарів (A, B, C, D, E, G, H, I), з них два (C, D) з двома кольорами на справжніх фото. Перефарбування
потрібне лише якщо захочемо другий колір ще комусь.

Інші знайдені серії (запасні, не потрібні, якщо беремо @dhanno): сірі й блакитні тоути 36365228, 36364966,
36364964, 36367488; руда сумка в інтер'єрі 29359846, 29359860, 29359841. Unsplash не підходить (серій немає,
@laticoleathers це справжній бренд).

## Оброблені фото (пункт 5, 2026-11-18)

Папка `C:\Users\maksl\Desktop\otl-demo\photos-processed\` (поза репозиторієм, 28 файлів, 6,9 МБ).
Структура як у теперішньому `public/images/products/<handle>/<колір>-<n>.jpg`; на кроці 2 скопіювати в `public/images/`.

- Товари: квадрат 1600×1600 (як теперішні `products/…` і галерея 1:1; картка обрізає до 4:5 через object-fit).
  Обрізка по сумці, сумка займає ~74% кадру
- Тон: фон білої зйомки зведено до #F0ECE7 (теплий світлий, бузковий відтінок прибрано), персикової до #D69C8D.
  Корекція балансу білого множником на канал, кольори сумок зсунуті так само
- `hero-1..3.jpg`: вертикальні 1600×2263, лише тон (hero кадрує через object-position)
- `leather-closeup.jpg`: 1200×1200, крокодилова фактура з сумки croc-box-bag (запасний; на сайті не обов'язковий)
- Деталі для блоку про шкіру (`HomeLeather`), окремі кадри з Pexels (не @dhanno), обрізані до 4:5:
  - `detail-hardware.jpg` 1400×1750: латунна пряжка на коньячному ремені в руках, https://www.pexels.com/photo/6654751/
  - `detail-pockets.jpg` 1200×1500: вигляд у світлу шкіряну сумку зверху, відділення й кишеня на блискавці,
    https://www.pexels.com/photo/29359834/ (сумка бренду ABLE; бирки в цьому кадрі не видно, сусідній 29359842
    з биркою не брати)
  - `detail-patina.jpg` 1200×1500: коньячна шкіра з ручкою, блиск і заломи, https://www.pexels.com/photo/10340652/
  Тексти `leather.*` в `en.json`/`ua.json` (Crazy Horse, «rivets», «slip pockets») на кроці 2 переписати під ці фото
  і під новий бренд: на фото пряжка, а не заклепки; кишеня на блискавці, а не накладні
- **Логотип чужого бренду «R»** (вибитий на шкірі) затерто на: structured-tote/green-1..3, camera-crossbody/black-2,
  ruched-hobo/burgundy-2. Крупний план від @dhanno (22432984) не взято: там логотип великий.
  **Перевірка 2026-11-18 (усі 23 кадри товарів переглянуто): логотип «R» видно ще на `ruched-hobo/burgundy-1`
  (по центру, під зборками, з дрібним написом над ним) і `camera-crossbody/black-1` (над передньою кишенею).**
  Ледь помітна пляма, схожа на тиснення, по центру зверху на `barrel-bag/burgundy-2` і `barrel-bag/tan-3`.
  **Усі чотири затерто 2026-11-18** (латка з сусідньої шкіри, зсунута вздовж складок, тон з місця латки, м'який
  край), звірено на збільшенні: тиснення не видно. Сирі кадри в `photos-raw\` не чіпали
- Візерунок quilted-work-tote схожий на «cannage» Dior; логотипа немає, але назву/опис не робити «Dior-подібними»

Підсумковий каталог (handle → кольори → фото):

| handle | колекція | кольори | фото |
|---|---|---|---|
| structured-tote | totes | green | 3 |
| croc-shopper | totes | tan | 1 (другого кадру цієї сумки немає) |
| quilted-work-tote | laptop-work | burgundy | 3 |
| dome-bag | shoulder-bags | burgundy, black | 2 + 2 |
| barrel-bag | shoulder-bags | burgundy, tan | 3 + 3 |
| ruched-hobo | shoulder-bags | burgundy | 2 |
| camera-crossbody | mini-crossbody | black | 2 |
| croc-box-bag | mini-crossbody | cognac | 3 |

Виправлення до розкладки вище: `C-burgundy-dome-3-peach` це бочонок (→ barrel-bag/burgundy-3); `H-tan-tote-2/3-peach`
інші сумки (не взято); `E-black-camera-3-peach` має в кадрі чужу коричневу сумку (не взято).

Плитки категорій (взяти з товарів, персиковий фон): totes `structured-tote/green-3`, shoulder-bags
`barrel-bag/burgundy-3`, laptop-work `quilted-work-tote/burgundy-3`, mini-crossbody `camera-crossbody/black-2`.

## Каталог (пункт 3, погоджено Максом 2026-11-18)

Vendor для всіх: `North Quay Leather`. Ціни в USD, круглі, без `Compare-at price`. Назви товарів: прості
портові слова (bollard, wharf, cleat…), без натяків на чужі бренди і моделі. Тексти англійською (EN основна),
за правилами Hallmark з `CLAUDE.md`: без «—», без «·», без цифр продажів і відгуків. Матеріал описано за фото
(тиснення під крокодила, під ящірку, стьобання), без «ручної роботи в Україні».

| handle | Title | колекція | USD | кольори | subtitle |
|---|---|---|---|---|---|
| structured-tote | Bollard Tote | totes | 185 | green | Structured, with a detachable strap |
| croc-shopper | Wharf Shopper | totes | 165 | tan | Croc-embossed, long handles |
| quilted-work-tote | Ledger Work Tote | laptop-work | 195 | burgundy | Quilted, fits a 14 inch laptop |
| dome-bag | Beacon Dome Bag | shoulder-bags | 175 | burgundy, black | Lizard-embossed, zip around |
| barrel-bag | Tidal Barrel Bag | shoulder-bags | 160 | burgundy, tan | Shaded leather, crossbody strap |
| ruched-hobo | Swell Hobo | shoulder-bags | 145 | burgundy | Soft gathered leather |
| camera-crossbody | Signal Camera Bag | mini-crossbody | 125 | black | Pebbled leather, two zips |
| croc-box-bag | Cleat Box Bag | mini-crossbody | 150 | cognac | Croc-embossed, magnetic flap |

Описи (`Description`):

- **Bollard Tote.** A compact structured tote in smooth leather, framed by stitched edges, with a knotted front tab
  finished in two gold-tone clips. Carry it by the double handles, or clip on the strap and wear it crossbody.
  The top zips shut.
- **Wharf Shopper.** A roomy shopper in croc-embossed leather, with long handles riveted to the front panel that sit
  comfortably on the shoulder. A zip runs along the top. Room for a 13 inch laptop, a sweater and the day's errands.
- **Ledger Work Tote.** A work tote in soft quilted leather, padded in a stitched grid that keeps its shape when full.
  A 14 inch laptop slides in beside notebooks and a charger, and the top zips closed. Long handles go over a coat sleeve.
- **Beacon Dome Bag.** A rounded top-handle bag in lizard-embossed leather. The zip runs over the dome so the bag
  opens wide, and four metal feet keep the base off the table. Rolled handles sit in the hand or on the shoulder.
- **Tidal Barrel Bag.** A barrel bag in shaded leather with smooth piped edges and handle straps that run under the
  base. Carry it by the rolled handles or clip on the strap to wear it crossbody. The shading varies a little from
  bag to bag.
- **Swell Hobo.** A soft hobo in supple leather, gathered into pleats along a curved top. It sits close under the
  arm on a slim strap that clips off and adjusts in length.
- **Signal Camera Bag.** A small boxy crossbody in pebbled leather. The main compartment zips along the top, and a
  front zip pocket keeps a phone or keys within reach. The strap adjusts for crossbody or shoulder wear.
- **Cleat Box Bag.** A structured box bag in croc-embossed leather with a flap that closes on a magnetic snap.
  Inside there is a zip pocket and room for a phone, wallet and keys. A rolled strap clips on at the sides.

Розміри (`ProductDimensions`, см; `—` = у сумки цього немає):

| handle | heightCm | topWidthCm | bottomWidthCm | depthCm | handleDropCm | strapCm | laptopInches |
|---|---|---|---|---|---|---|---|
| structured-tote | 22 | 25 | 28 | 12 | 13 | 100–120 | — |
| croc-shopper | 28 | 38 | 38 | 13 | 25 | — | 13 |
| quilted-work-tote | 30 | 40 | 38 | 12 | 27 | — | 14 |
| dome-bag | 24 | 22 | 32 | 14 | 14 | — | — |
| barrel-bag | 20 | 30 | 30 | 18 | 14 | 105–125 | — |
| ruched-hobo | 20 | 30 | 24 | 8 | — | 100–120 | — |
| camera-crossbody | 17 | 22 | 22 | 8 | — | 105–130 | — |
| croc-box-bag | 20 | 20 | 23 | 11 | — | 115 (не регулюється) | — |

**Розбіжність з типом** (вирішено 2026-11-18): у `ProductDimensions` усі поля обов'язкові, а жодна сумка не має
повного набору. На кроці 2 `handleDropCm`, `strapCm`, `laptopInches` стають `| null`, рядок на сторінці
ховається; у `specs` там `null`. Ремінь без регулювання: `[115, 115]`, сторінка показує одне число.

У CSV також (не обговорювалось окремо, правити в CSV): вага 400–750 г, залишок 10 на варіант, SKU
`NQL-<код>-<колір>`, Type (Tote / Shoulder bag / Work tote / Crossbody bag), категорія Shopify
`Apparel & Accessories > Handbags, Wallets & Cases > Handbags`, SEO title «<назва> | North Quay Leather».

Деталі (`details` у `specs`, список на сторінці товару):

- structured-tote: Smooth leather with stitched edge framing / Zip top closure / Detachable, adjustable crossbody strap / Gold-tone hardware
- croc-shopper: Croc-embossed leather / Zip top closure / Long riveted shoulder handles / Fits a 13 inch laptop
- quilted-work-tote: Quilted leather with padded panels / Zip top closure / Long shoulder handles / Fits a 14 inch laptop
- dome-bag: Lizard-embossed leather / Zip around the top / Rolled handles on gold-tone rings / Metal feet on the base
- barrel-bag: Shaded leather with smooth piping / Zip top closure / Detachable, adjustable crossbody strap / Gold-tone hardware
- ruched-hobo: Supple leather gathered into pleats / Detachable, adjustable strap / Gold-tone clasps
- camera-crossbody: Pebbled leather / Top zip and front zip pocket / Adjustable crossbody strap / Gold-tone hardware
- croc-box-bag: Croc-embossed leather / Flap with a magnetic snap / Inner zip pocket / Detachable rolled strap

## 3. Формат CSV Shopify (звірено 2026-11-18)

Джерело: https://help.shopify.com/en/manual/products/import-export/using-csv
Шаблон: https://help.shopify.com/cdn/shopifycloud/product-knowledge/production/csv/product_template.csv
(curl отримує Cloudflare 403, відкривається через браузер/WebFetch).

- Заголовки шаблону (порядок як у файлі): `Title`, `URL handle`, `Description`, `Vendor`, `Product category`,
  `Type`, `Tags`, `Published on online store`, `Status`, `SKU`, `Variant Barcodes`, `Option1 name`,
  `Option1 value`, `Option1 Linked To`, `Option2 …`, `Option3 …`, `Price`, `Compare-at price`, `Cost per item`,
  `Charge tax`, `Tax code`, `Unit price …` (4), `Inventory tracker`, `Inventory quantity`,
  `Continue selling when out of stock`, `Weight value (grams)`, `Weight unit for display`, `Requires shipping`,
  `Fulfillment service`, `Product image URL`, `Image position`, `Image alt text`, `Variant image URL`, `Gift card`,
  `SEO title`, `SEO description`, `Color (product.metafields.shopify.color-pattern)`, `Google Shopping / …` (12),
  `Packed product length/width/height/dimension unit`.
  Старі (`Handle`, `Body (HTML)`, `Variant Price`, `Image Src`) не використовувати
- У шаблоні: `Status` = `Active`/`active` (довідка: `active`, `draft`, `archived`), `Published on online store` =
  `TRUE`/`FALSE`, `Inventory tracker` = `shopify` або порожньо, `Continue selling when out of stock` = `DENY`,
  `Fulfillment service` = `manual`. Рядки варіантів: заповнені `URL handle` і поля варіанта, поля товару порожні
- Обов'язковий лише `Title`; `URL handle` обов'язковий, коли є варіанти. Якщо є колонка варіанта (наприклад `SKU`),
  мають бути `Option1 name` і `Option1 value`
- Фото: `Product image URL` лише публічна адреса, Shopify сам завантажує файл. Одне фото = один рядок; у додаткових
  рядках лише `URL handle` + адреса фото, `Image position`, `Image alt text`
- `Collection`: колонки немає в шаблоні, додається вручну будь-де. Лише імпорт, одна колекція на товар (за назвою),
  може бути порожньою. Колекцію `bestsellers` тому Макс створює вручну (як і сказано в кроці 4 плану)
- Metafields товару: заголовок `product.metafields.<namespace>.<key>` (для нас `product.metafields.custom.subtitle`
  і `product.metafields.custom.specs`). Metafields варіантів через CSV не імпортуються.
  Довідка не каже прямо, чи потрібне визначення до імпорту, і не згадує тип JSON. Тому **визначення Макс створює
  в адмінці ДО імпорту** (Settings → Custom data → Products): `custom.subtitle` (Single line text) і
  `custom.specs` (JSON), в обох увімкнено доступ для Storefront API. Після імпорту перевірити на одному товарі,
  що `specs` заповнився; якщо ні, вставити JSON вручну або через адмінку масового редагування

## Наявні дані проєкту, потрібні для каталогу

- `LeatherColor` (`shared/types/catalog.ts`): black, cognac, chocolate, burgundy, green, tan, red, caramel.
  Сірого й блакитного немає: для серії А або перефарбувати фото в наявний колір, або додавати колір у тип
  (це зміна поза «типи не міняються», вирішує Макс)
- Колекції: totes, shoulder-bags, laptop-work, mini-crossbody
- `ProductDimensions`: heightCm, topWidthCm, bottomWidthCm, depthCm, handleDropCm, strapCm [від, до], laptopInches
- Теперішні фото в `public/images/` (пропорцію кадру для пункту 5 ще не виміряно)

## Наступна сесія починається з

1. Підготовку завершено. Кроки 1 і 2 плану робить Sonnet за промтами нижче. Імпорт CSV лише після пушу кроку 2
   (фото з репозиторію).

## Промти для Sonnet

Крок 1:

```
Прочитай docs/shopify-prototype-plan.md (розділи «Рішення» і «Крок 1») і CLAUDE.md. Зроби крок 1: прибрати витиск ініціалів.
Спершу окремим комітом зафіксуй підготовку, яку робив не ти: docs/shopify-prototype-notes.md, docs/shopify-prototype-plan.md,
docs/products.csv і поточні зміни CLAUDE.md («Docs: Shopify prototype plan, catalog CSV and prep notes»).
Не чіпай нічого поза кроком 1: бренд OTL, фото, Etsy, відгуки, Shopify належать до наступних кроків. brainstorming не запускай.
Перевірка: `npx nuxt typecheck` без помилок; `grep -ri "personal\|deboss\|initials" app/ shared/ i18n/` нічого не знаходить;
Playwright на 390/768/1440: головна без дірки на місці блоку (відступи між сусідніми секціями як між іншими), відкрите
мобільне меню на 390 без порожнього місця на місці витиску. Якщо на сторінці видно ключі i18n, перезапусти dev-сервер.
Потім: CLAUDE.md (прибрати абзац про фішку сайту, атрибут `Initials`, сторінку `/personalization`; оновити «Що зараз MOCK»
і «Наступні кроки»), у плані позначити крок 1 зробленим, коміт. Не пушити.
```

Крок 2:

```
Прочитай docs/shopify-prototype-plan.md (розділи «Рішення» і «Крок 2»), docs/shopify-prototype-notes.md (розділи
«Оброблені фото» і «Каталог») і CLAUDE.md. Зроби крок 2: бренд North Quay Leather (печатка NQL) замість OTL.
Фото бери з C:\Users\maksl\Desktop\otl-demo\photos-processed\ і розклади, як сказано в кроці 2 (імена фото товарів не міняй:
на них посилається docs/products.csv). Пункт про `| null` у ProductDimensions погоджено, роби його.
Тексти EN і UA за правилами з CLAUDE.md («Правила текстів»): без вигаданих цифр, без «—». Для `leather.*` і «Про нас»
скористайся скілом copywriting. Назву репозиторію на GitHub міняє Макс: спитай нову назву, без неї посилання на демо
в CLAUDE.md не міняй.
Не чіпай: Shopify, кошик, сторінки колекцій, `useCatalog.ts` (лише дані в `app/data/`), дизайн-токени, верстку секцій.
Перевірка: `npx nuxt typecheck`; `grep -riI "otl\|old town\|etsy" app/ i18n/ public/ README.md` нічого не знаходить
(збіги всередині слів на кшталт «spotlight» переглянь очима); у `public/images/` немає жодного старого файла;
Playwright на 390/768/1440: hero (кадрування трьох фото і слайдер), плитки категорій, блок про шкіру, картки, сторінка
товару з перемиканням двох кольорів, смужка «Demo store», футер, favicon. Також `/ua`.
Потім: CLAUDE.md (назва бренду, «Що зараз MOCK», «Дані», «Дизайн-система» про печатку, «Наступні кроки», абзаци про Etsy,
відгуки й засновників прибрати), у плані позначити крок 2 зробленим, коміт. Не пушити.
```
