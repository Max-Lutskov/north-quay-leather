#!/usr/bin/env python
"""Запис оформлення замовлення для секції «See the checkout» на /about.

Проходить шлях: товар (Tidal Barrel Bag, Tan) -> кошик -> Shopify Checkout -> тестова оплата -> Thank you
і зберігає public/demo/checkout.mp4 та public/demo/checkout-poster.jpg.

Запуск з папки web:
    pip install playwright && python -m playwright install chromium     # один раз
    python scripts/record-checkout.py            # репетиція: зупиняється ПЕРЕД «Pay now», замовлення не створює,
                                                 # прев'ю лягає в .cache/record-checkout/preview.mp4
    python scripts/record-checkout.py --final    # фінальний запис: оплата, Thank you, файли в public/demo/

Кожен запуск з --final лишає тестове замовлення в адмінці Shopify.

Якщо Shopify показує капчу чи іншу перевірку «на бота», скрипт нічого не обходить: зупиняється з кодом 2,
лишає скриншот у .cache/record-checkout/ і радить записати відео руками.

Потрібні ffmpeg і ffprobe в PATH (Windows: winget install Gyan.FFmpeg).
Тимчасові файли: web/.cache/record-checkout/ (.cache уже в .gitignore).
"""
from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import FrameLocator, Locator, Page, sync_playwright
from playwright.sync_api import TimeoutError as PlaywrightTimeout

WEB = Path(__file__).resolve().parent.parent
BRAND_TS = WEB / "app" / "data" / "brand.ts"
OUT_DIR = WEB / "public" / "demo"
TMP_DIR = WEB / ".cache" / "record-checkout"

STORE = "https://north-quay-leather.myshopify.com"
DEMO = "https://max-lutskov.github.io/north-quay-leather"
PRODUCT = "barrel-bag"
COLOR = "tan"  # значення radio name="color" на сторінці товару

VIEWPORT = {"width": 1280, "height": 800}
MAX_BYTES = 8 * 1024 * 1024
MIN_SEC, MAX_SEC = 30, 60

# Тестові дані (Bogus Gateway: номер картки 1 = успішна оплата)
EMAIL = "test@example.com"
FIRST, LAST = "Test", "Buyer"
ADDRESS, CITY, STATE, ZIP = "1 Main St", "New York", "NY", "10001"
CARD_NUMBER, CARD_EXPIRY, CARD_CVV, CARD_NAME = "1", "1230", "123", "Test Buyer"

PAUSE = 0.8  # пауза між діями, с (вимога: 0.6-1)
TYPE_DELAY = 55  # мс між символами

# Ознаки захисту від ботів. Лише виявляємо, нічого не обходимо
BLOCK_FRAME_HOSTS = ("hcaptcha.com", "recaptcha", "challenges.cloudflare.com", "captcha-delivery", "arkoselabs")
BLOCK_URL_PARTS = ("/checkpoint", "/challenge", "/throttle")
BLOCK_TEXTS = (
    "verify you are human",
    "your connection needs to be verified",
    "confirm you're not a robot",
    "i'm not a robot",
    "unusual activity",
)

# Видимий курсор: у записі Playwright справжнього курсора немає. Лише у верхньому документі, без втручання
# в логіку сторінки; над iframe (поля картки) ховається
CURSOR_JS = """
(() => {
  if (window.top !== window) return;
  const make = () => {
    if (document.getElementById('__rec_cursor')) return;
    const c = document.createElement('div');
    c.id = '__rec_cursor';
    c.style.cssText = 'position:fixed;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;' +
      'background:rgba(30,30,30,.35);border:2px solid rgba(255,255,255,.9);box-shadow:0 0 0 1px rgba(0,0,0,.35);' +
      'z-index:2147483647;pointer-events:none;opacity:0;transition:opacity .15s,width .1s,height .1s,margin .1s';
    document.documentElement.appendChild(c);
    document.addEventListener('mousemove', (e) => {
      c.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      c.style.opacity = e.target && e.target.tagName === 'IFRAME' ? '0' : '1';
    }, true);
    const press = (on) => {
      const s = on ? 12 : 18;
      c.style.width = c.style.height = s + 'px';
      c.style.margin = `-${s / 2}px 0 0 -${s / 2}px`;
    };
    document.addEventListener('mousedown', () => press(true), true);
    document.addEventListener('mouseup', () => press(false), true);
  };
  if (document.documentElement) make();
  document.addEventListener('DOMContentLoaded', make);
})();
"""


class Blocked(Exception):
    """Shopify показав капчу або іншу перевірку на бота."""


class StepFailed(Exception):
    """Крок сценарію не вдався (не знайдено елемент, не та сторінка)."""


def log(msg: str) -> None:
    print(f"[record] {msg}", flush=True)


def read_password() -> str:
    m = re.search(r"demoStorePassword\s*=\s*['\"]([^'\"]+)['\"]", BRAND_TS.read_text(encoding="utf-8"))
    if not m:
        raise StepFailed(f"Не знайшов demoStorePassword у {BRAND_TS}")
    return m.group(1)


def need_tools() -> None:
    missing = [t for t in ("ffmpeg", "ffprobe") if not shutil.which(t)]
    if missing:
        raise StepFailed(f"Немає в PATH: {', '.join(missing)}. Windows: winget install Gyan.FFmpeg")


# ---------- захист від ботів ----------

def check_blocked(page: Page) -> None:
    url = page.url.lower()
    if any(part in url for part in BLOCK_URL_PARTS):
        raise Blocked(f"адреса сторінки: {page.url}")
    for frame in page.frames:
        if any(host in frame.url.lower() for host in BLOCK_FRAME_HOSTS):
            # Невидимі службові фрейми (напр. reCAPTCHA Enterprise у фоні) не рахуємо: лише видимий виклик
            try:
                el = frame.frame_element()
                box = el.bounding_box()
                if box and box["width"] > 60 and box["height"] > 40 and el.is_visible():
                    raise Blocked(f"видимий фрейм перевірки: {frame.url[:80]}")
            except PlaywrightError:
                continue
    try:
        text = page.locator("body").inner_text(timeout=2000).lower()
    except PlaywrightError:
        return
    for needle in BLOCK_TEXTS:
        if needle in text:
            raise Blocked(f"текст на сторінці: «{needle}»")


# ---------- «людські» дії ----------

def pause(page: Page, sec: float = PAUSE) -> None:
    page.wait_for_timeout(int(sec * 1000))


def smooth_scroll_to(page: Page, target: Locator) -> None:
    """Плавно прокручує коліщатком, поки елемент не опиниться в середній частині екрана."""
    for _ in range(60):
        box = target.bounding_box()
        if not box:
            break
        center = box["y"] + box["height"] / 2
        if 160 <= center <= VIEWPORT["height"] - 200:
            return
        delta = center - VIEWPORT["height"] / 2
        step = max(-90, min(90, delta))
        page.mouse.wheel(0, step)
        page.wait_for_timeout(28)
    target.scroll_into_view_if_needed(timeout=5000)


def move_to(page: Page, target: Locator) -> tuple[float, float]:
    target.wait_for(state="visible", timeout=20000)
    smooth_scroll_to(page, target)
    box = target.bounding_box()
    if not box:
        raise StepFailed("Елемент не має розмірів на екрані")
    x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    page.mouse.move(x, y, steps=28)
    page.wait_for_timeout(250)
    return x, y


def click(page: Page, target: Locator) -> None:
    x, y = move_to(page, target)
    page.mouse.click(x, y, delay=80)
    pause(page)


def type_into(page: Page, target: Locator, text: str) -> None:
    x, y = move_to(page, target)
    page.mouse.click(x, y, delay=80)
    try:
        if target.input_value(timeout=2000):
            target.fill("")
    except PlaywrightError:
        pass
    target.press_sequentially(text, delay=TYPE_DELAY)
    pause(page)


def first_visible(page: Page, selectors: list[str], what: str, timeout: int = 20000) -> Locator:
    """Перший видимий елемент зі списку запасних селекторів."""
    deadline = time.monotonic() + timeout / 1000
    while time.monotonic() < deadline:
        for sel in selectors:
            loc = page.locator(sel).first
            try:
                if loc.is_visible():
                    return loc
            except PlaywrightError:
                pass
        page.wait_for_timeout(250)
    check_blocked(page)
    raise StepFailed(f"Не знайшов на сторінці: {what} ({' | '.join(selectors)})")


def card_field(page: Page, kind: str, input_name: str) -> Locator:
    """Поле картки: кожне живе у своєму iframe Shopify (card-fields-<kind>-...)."""
    frame: FrameLocator = page.frame_locator(f'iframe[id^="card-fields-{kind}"]').first
    loc = frame.locator(f'input[name="{input_name}"]').first
    try:
        loc.wait_for(state="visible", timeout=20000)
    except PlaywrightTimeout:
        check_blocked(page)
        raise StepFailed(f"Не знайшов поле картки «{kind}». Можливо, Shopify змінив розмітку оплати")
    return loc


# ---------- кроки ----------

def unlock_store(browser, password: str) -> dict:
    """Крок 1, поза записом: пароль вітрини в окремому контексті без відео. Повертає cookies."""
    ctx = browser.new_context(viewport=VIEWPORT, locale="en-US")
    page = ctx.new_page()
    try:
        page.goto(f"{STORE}/password", wait_until="domcontentloaded")
        check_blocked(page)
        if "/password" in page.url:
            field = first_visible(page, ['input[type="password"]', "#password"], "поле пароля вітрини")
            field.fill(password)
            field.press("Enter")
            try:
                page.wait_for_url(lambda u: "/password" not in u, timeout=20000)
            except PlaywrightTimeout:
                check_blocked(page)
                raise StepFailed("Пароль вітрини не прийнято (перевір demoStorePassword у app/data/brand.ts)")
        check_blocked(page)
        log("Вітрину відкрито паролем (поза записом)")
        return ctx.storage_state()
    finally:
        ctx.close()


def add_to_cart(page: Page) -> float:
    """Крок 2: товар, колір Tan, Add to cart. Повертає момент, коли сторінка товару готова (початок відео)."""
    page.goto(f"{DEMO}/products/{PRODUCT}", wait_until="load")
    # Перший клік до гідрації не спрацьовує (CLAUDE.md, «Відомі пастки»): чекаємо, поки Vue змонтує застосунок
    page.wait_for_function("() => !!document.querySelector('#__nuxt')?.__vue_app__", timeout=30000)
    page.locator("h1.title").wait_for(state="visible", timeout=20000)
    try:
        page.wait_for_load_state("networkidle", timeout=10000)
    except PlaywrightTimeout:
        pass
    ready = time.monotonic()
    pause(page, 1.2)  # глядач бачить товар до першої дії

    radio = page.locator(f'input[name="color"][value="{COLOR}"]')
    if radio.count() == 0:
        raise StepFailed(f"У товару {PRODUCT} немає кольору «{COLOR}»")
    swatch = page.locator("label.swatch").filter(has=radio).locator(".dot")
    for _ in range(3):
        click(page, swatch)
        if radio.is_checked():
            break
    else:
        raise StepFailed("Колір Tan не вибирається (сторінка не гідрувалась?)")

    add_btn = page.locator("button.add")
    if add_btn.is_disabled():
        raise StepFailed("Кнопка Add to cart вимкнена: колір Tan розпродано або кошик зайнятий")
    click(page, add_btn)
    try:
        page.locator(".drawer.open").wait_for(state="visible", timeout=20000)
    except PlaywrightTimeout:
        raise StepFailed("Кошик не відкрився після Add to cart (помилка Shopify Cart API?)")
    pause(page, 1.0)
    return ready


def go_to_checkout(page: Page) -> None:
    """Крок 3: Checkout у панелі кошика."""
    link = page.locator(".drawer.open a.checkout:not(.busy)")
    click(page, link)
    try:
        page.wait_for_url(re.compile(r"/checkouts?/"), timeout=45000)
    except PlaywrightTimeout:
        check_blocked(page)
        if "/password" in page.url:
            raise StepFailed("Shopify знову просить пароль вітрини: cookies з кроку 1 не підійшли")
        raise StepFailed(f"Не потрапив на сторінку оформлення, зараз: {page.url}")
    page.wait_for_load_state("domcontentloaded")
    check_blocked(page)


def fill_checkout(page: Page) -> None:
    """Крок 4: контакт, адреса в США, картка Bogus Gateway."""
    email = first_visible(page, ['input[name="email"]', "#email"], "поле email", timeout=45000)
    pause(page, 1.0)
    check_blocked(page)
    type_into(page, email, EMAIL)

    country = page.locator('select[name="countryCode"]').first
    if country.count() and country.is_visible():
        if country.input_value() != "US":
            move_to(page, country)
            country.select_option("US")
            pause(page, 1.2)  # форма адреси перебудовується під країну

    first = page.locator('input[name="firstName"]').first
    if first.count() and first.is_visible():
        type_into(page, first, FIRST)
    type_into(page, first_visible(page, ['input[name="lastName"]'], "поле прізвища"), LAST)

    address = first_visible(page, ['input[name="address1"]'], "поле адреси")
    type_into(page, address, ADDRESS)
    # Підказки адрес з'являються приблизно за секунду після останньої літери й накривають поле міста:
    # клік по місту потрапляв у підказку (місто й індекс ставали чужими). Чекаємо список і закриваємо його
    try:
        page.wait_for_function("el => el.getAttribute('aria-expanded') === 'true'",
                               arg=address.element_handle(), timeout=3000)
    except PlaywrightTimeout:
        pass
    address.press("Escape")
    page.wait_for_function("el => el.getAttribute('aria-expanded') !== 'true'",
                           arg=address.element_handle(), timeout=5000)
    pause(page, 0.4)

    type_into(page, first_visible(page, ['input[name="city"]'], "поле міста"), CITY)
    zone = first_visible(page, ['select[name="zone"]'], "список штатів")
    move_to(page, zone)
    zone.select_option(STATE)
    pause(page)
    type_into(page, first_visible(page, ['input[name="postalCode"]'], "поле індексу"), ZIP)
    pause(page, 1.5)  # Shopify рахує доставку
    check_blocked(page)
    # До оплати: у полях адреси саме те, що вводили (підказка адрес могла щось підмінити)
    for field, want in (("address1", ADDRESS), ("city", CITY), ("postalCode", ZIP)):
        got = page.locator(f'input[name="{field}"]').first.input_value()
        if got != want:
            raise StepFailed(f"Поле {field}: «{got}» замість «{want}»")
    if zone.input_value() != STATE:
        raise StepFailed(f"Штат: «{zone.input_value()}» замість «{STATE}»")

    type_into(page, card_field(page, "number", "number"), CARD_NUMBER)
    type_into(page, card_field(page, "expiry", "expiry"), CARD_EXPIRY)
    type_into(page, card_field(page, "verification_value", "verification_value"), CARD_CVV)
    name = card_field(page, "name", "name")
    type_into(page, name, CARD_NAME)
    pause(page, 1.0)


def pay_button(page: Page) -> Locator:
    return first_visible(
        page,
        ["#checkout-pay-button", 'button[type="submit"]:has-text("Pay now")', 'button:has-text("Complete order")'],
        "кнопку Pay now",
    )


def pay(page: Page) -> None:
    """Крок 5: Pay now і сторінка Thank you."""
    btn = pay_button(page)
    click(page, btn)
    try:
        page.wait_for_url(re.compile(r"thank[-_]you", re.I), timeout=90000)
    except PlaywrightTimeout:
        check_blocked(page)
        raise StepFailed("Після Pay now сторінка Thank you не відкрилась (помилка у формі або оплаті, див. скриншот)")
    page.wait_for_load_state("domcontentloaded")
    try:
        page.get_by_text(re.compile(r"thank you", re.I)).first.wait_for(state="visible", timeout=30000)
    except PlaywrightTimeout:
        pass
    check_blocked(page)


# ---------- відео ----------

def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


def encode(src: Path, dst: Path, start: float, end: float) -> None:
    """webm -> mp4 (H.264, без звуку, faststart), обрізка [start, end], розмір до 8 МБ."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    total = probe_duration(src)
    start = max(0.0, min(start, total))
    length = max(1.0, min(end, total) - start)
    for crf in (24, 27, 30, 33, 36):
        subprocess.run(
            [
                "ffmpeg", "-y", "-v", "error", "-i", str(src), "-ss", f"{start:.2f}", "-t", f"{length:.2f}",
                "-an", "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-profile:v", "high",
                "-pix_fmt", "yuv420p", "-r", "25",
                "-vf", f"scale={VIEWPORT['width']}:{VIEWPORT['height']}:flags=lanczos",
                "-movflags", "+faststart", str(dst),
            ],
            check=True,
        )
        if dst.stat().st_size <= MAX_BYTES:
            break
    else:
        raise StepFailed(f"Відео більше 8 МБ навіть з CRF 36: {dst.stat().st_size / 1e6:.1f} МБ")
    # Перевірка: файл читається до кінця
    subprocess.run(["ffmpeg", "-v", "error", "-i", str(dst), "-f", "null", "-"], check=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Запис оформлення замовлення для /about")
    parser.add_argument("--final", action="store_true",
                        help="натиснути Pay now і зберегти файли в public/demo/ (створює тестове замовлення)")
    args = parser.parse_args()

    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")

    need_tools()
    password = read_password()
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    raw_dir = TMP_DIR / "raw"
    shutil.rmtree(raw_dir, ignore_errors=True)
    poster_tmp = TMP_DIR / "poster.jpg"

    with sync_playwright() as p:
        # Звичайний Chromium з вікном, без stealth-плагінів і підміни user agent
        browser = p.chromium.launch(headless=False)
        page = None
        ctx = None
        try:
            state = unlock_store(browser, password)
            ctx = browser.new_context(
                viewport=VIEWPORT, device_scale_factor=1, locale="en-US", storage_state=state,
                record_video_dir=str(raw_dir), record_video_size=VIEWPORT,
            )
            ctx.add_init_script(CURSOR_JS)
            page = ctx.new_page()
            t0 = time.monotonic()  # початок запису

            log("Товар, колір Tan, Add to cart")
            cut_start = add_to_cart(page) - t0  # сторінка товару вже на екрані: звідси починається відео
            log("Checkout")
            go_to_checkout(page)
            log("Дані покупця і картка")
            fill_checkout(page)

            if args.final:
                log("Pay now")
                pay(page)
                pause(page, 1.0)
                page.screenshot(path=str(poster_tmp), type="jpeg", quality=86)
                pause(page, 2.0)
            else:
                move_to(page, pay_button(page))
                pause(page, 2.0)
                log("Репетиція: зупинився перед Pay now, замовлення не створено")
            cut_end = time.monotonic() - t0
        except Blocked as e:
            if page:
                page.screenshot(path=str(TMP_DIR / "blocked.png"))
            log(f"ЗУПИНКА: Shopify показує перевірку на бота ({e}).")
            log("Нічого не обходив. Запиши відео руками. Скриншот: .cache/record-checkout/blocked.png")
            return 2
        except (StepFailed, PlaywrightError) as e:
            if page:
                try:
                    page.screenshot(path=str(TMP_DIR / "failed.png"))
                except PlaywrightError:
                    pass
            log(f"ПОМИЛКА: {e}")
            log("Скриншот: .cache/record-checkout/failed.png. Файли в public/demo/ не змінено.")
            return 1
        finally:
            video = page.video if page else None
            if ctx:
                ctx.close()  # відео дописується на диск під час закриття контексту
            # Шлях до відео треба взяти, поки Playwright ще працює: після виходу з with цикл подій закрито
            raw = Path(video.path()) if video else None
            browser.close()

    if args.final:
        target = OUT_DIR / "checkout.mp4"
        tmp_mp4 = TMP_DIR / "checkout.mp4"
        encode(raw, tmp_mp4, cut_start, cut_end)
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(tmp_mp4, target)
        shutil.copyfile(poster_tmp, OUT_DIR / "checkout-poster.jpg")
    else:
        target = TMP_DIR / "preview.mp4"
        encode(raw, target, cut_start, cut_end)

    seconds = probe_duration(target)
    size_mb = target.stat().st_size / 1e6
    log(f"Готово: {target.relative_to(WEB)} | {seconds:.1f} с | {size_mb:.2f} МБ")
    if args.final:
        log("Постер: public/demo/checkout-poster.jpg (сторінка Thank you, 1280x800)")
    if not MIN_SEC <= seconds <= MAX_SEC:
        if args.final:
            log(f"УВАГА: тривалість поза межами {MIN_SEC}-{MAX_SEC} с. Зміни PAUSE / TYPE_DELAY у скрипті й перезапиши.")
            return 3
        log(f"Репетиція коротша за фінал (без оплати й Thank you). Орієнтир для фіналу: {MIN_SEC}-{MAX_SEC} с.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
