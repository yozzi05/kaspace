/**
 * Записывает мини-демо функций крупных работ: реальные сценарии на сайтах.
 *
 *   npm run demos                      все клипы, оба размера
 *   npm run demos -- padel61           клипы одной работы
 *   npm run demos -- padel61/booking   один клип
 *   npm run demos -- --desk | --mob    только один размер
 *
 * Результат:
 *   public/works/demos/<работа>/<функция>-{desk,mob}.{mp4,webm,webp}
 *   data/demos.ts: названия функций, длительность и подписи шагов со временем
 *
 * ВАЖНО: ни один сценарий не отправляет заявку, бронь или форму.
 * Сценарий доходит до заполненной формы или итога и останавливается.
 */
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import ffmpegPath from 'ffmpeg-static';
import { chromium } from 'playwright';
import type { Browser, Locator, Page } from 'playwright';
import sharp from 'sharp';

const run = promisify(execFile);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

type SizeKey = 'desk' | 'mob';
const SIZES: Record<SizeKey, { width: number; height: number; scale: number }> = {
  desk: { width: 1280, height: 800, scale: 1 },
  // плотность 1: при большей запись Playwright не увеличивает кадр, а кладёт его в угол холста
  mob: { width: 390, height: 844, scale: 1 },
};

const OUT_DIR = path.join(process.cwd(), 'public', 'works', 'demos');
const DATA_FILE = path.join(process.cwd(), 'data', 'demos.ts');
const DATA_HEADER = `/* Файл пишет scripts/demos.ts (npm run demos). Вручную не править. */

export type DemoStep = { at: number; text: string };
export type DemoRecord = {
  id: string;
  label: string;
  /** Длина клипа в секундах. */
  duration: { desk?: number; mob?: number };
  /** Подписи шагов и время их появления. */
  steps: { desk?: DemoStep[]; mob?: DemoStep[] };
};

export const DEMOS: Record<string, DemoRecord[]> = `;
const CHECK_DIR = process.env.DEMOS_CHECK_DIR; // если задана, туда кладутся раскадровки для проверки
const MAX_BYTES = 1.5 * 1024 * 1024;
const MIN_SEC = 8;
const MAX_SEC = 14;

/* Видимый курсор (синяя полоса, как на сайте kaspace) и кольцо-вспышка в месте клика */
const CURSOR_SCRIPT = `(() => {
  if (window.__kc) return; window.__kc = true;
  const mount = () => {
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;left:0;top:0;width:6px;height:26px;margin:-13px 0 0 -3px;background:#3DB8FF;box-shadow:0 0 0 1.5px rgba(6,11,23,.5);z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px)';
    document.documentElement.appendChild(bar);
    // «пульс»: точка в углу перерисовывается каждый кадр. Без неё запись пропускает
    // неподвижные отрезки, и время в видео расходится со временем сценария
    const beat = document.createElement('div');
    beat.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;z-index:2147483647;pointer-events:none;background:#000';
    document.documentElement.appendChild(beat);
    let n = 0;
    const pulse = () => { n = (n + 1) % 2; beat.style.background = n ? '#010101' : '#000'; requestAnimationFrame(pulse); };
    requestAnimationFrame(pulse);
    window.addEventListener('mousemove', (e) => { bar.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; }, true);
    window.addEventListener('mousedown', (e) => {
      const ring = document.createElement('div');
      ring.style.cssText = 'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;border:3px solid #3DB8FF;z-index:2147483646;pointer-events:none;opacity:.95;transform:scale(.25);transition:transform .45s ease-out,opacity .45s ease-out';
      document.documentElement.appendChild(ring);
      requestAnimationFrame(() => requestAnimationFrame(() => { ring.style.transform = 'scale(1)'; ring.style.opacity = '0'; }));
      setTimeout(() => ring.remove(), 650);
    }, true);
  };
  if (document.documentElement) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();`;

type Step = { at: number; text: string };

/** Ведёт мышь и клавиатуру так, как это делал бы человек. */
class Actor {
  x: number;
  y: number;
  steps: Step[] = [];
  page: Page;
  size: { width: number; height: number };
  private t0 = 0;

  constructor(page: Page, size: { width: number; height: number }) {
    this.page = page;
    this.size = size;
    this.x = size.width * 0.5;
    this.y = size.height * 0.62;
  }

  start() {
    this.t0 = Date.now();
  }
  elapsed() {
    return (Date.now() - this.t0) / 1000;
  }
  /** Подпись шага: время берётся из хода записи. */
  step(text: string) {
    this.steps.push({ at: Math.round(this.elapsed() * 10) / 10, text });
  }
  pause(ms: number) {
    return sleep(ms);
  }

  async move(tx: number, ty: number, ms = 620) {
    const n = Math.max(8, Math.round(ms / 16));
    const sx = this.x;
    const sy = this.y;
    for (let i = 1; i <= n; i++) {
      const p = i / n;
      const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
      await this.page.mouse.move(sx + (tx - sx) * e, sy + (ty - sy) * e);
      await sleep(16);
    }
    this.x = tx;
    this.y = ty;
  }

  /** Плавная прокрутка страницы на dy пикселей. */
  async scrollBy(dy: number, ms = 800) {
    await this.page.evaluate(
      ({ dy, ms }) =>
        new Promise<void>((done) => {
          const from = window.scrollY;
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - t0) / ms);
            const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
            window.scrollTo(0, from + dy * e);
            if (p < 1) requestAnimationFrame(tick);
            else done();
          };
          requestAnimationFrame(tick);
        }),
      { dy, ms },
    );
    // мышь стоит на месте, но под ней теперь другое: событие обновляет курсор и наведение
    await this.page.mouse.move(this.x, this.y);
  }

  /** Прокручивает так, чтобы элемент оказался в спокойной зоне экрана. */
  async reveal(loc: Locator) {
    await loc.waitFor({ state: 'visible', timeout: 10_000 });
    const box = await loc.boundingBox();
    if (!box) throw new Error('элемент не найден на экране');
    const mid = box.y + box.height / 2;
    const top = this.size.height * 0.2;
    const bottom = this.size.height * 0.78;
    if (mid < top || mid > bottom) {
      // scrollIntoView, а не window.scrollTo: у части сайтов прокручивается не окно, а свой блок
      await loc.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'smooth' }));
      await sleep(950);
      await this.page.mouse.move(this.x, this.y);
    }
    const now = await loc.boundingBox();
    if (!now) throw new Error('элемент пропал после прокрутки');
    return now;
  }

  async hover(loc: Locator, hold = 600) {
    const b = await this.reveal(loc);
    await this.move(b.x + b.width * rand(0.4, 0.6), b.y + b.height * rand(0.4, 0.6));
    await sleep(hold);
  }

  async click(loc: Locator) {
    const b = await this.reveal(loc);
    await this.move(b.x + b.width * rand(0.42, 0.58), b.y + b.height * rand(0.42, 0.58));
    await sleep(rand(400, 700));
    await this.page.mouse.down();
    await sleep(70);
    await this.page.mouse.up();
    await sleep(380);
  }

  /** Клик в поле, очистка и ввод по символам. */
  async type(loc: Locator, text: string) {
    await this.click(loc);
    await this.page.keyboard.press('Control+A');
    await sleep(120);
    await this.page.keyboard.type(text, { delay: 105 });
    await sleep(350);
  }
}

type Scenario = {
  work: string;
  id: string;
  label: string;
  url: string;
  /** Подготовка до начала клипа: закрыть диалоги, встать на нужный блок. В клип не попадает. */
  prepare?: (page: Page, size: SizeKey) => Promise<void>;
  play: (a: Actor, page: Page, size: SizeKey) => Promise<void>;
};

const enabled = (page: Page, pattern: RegExp, scope = 'body') =>
  page.locator(`${scope} button:not([disabled])`).filter({ hasText: pattern }).filter({ visible: true });

/* ---------- Dental Market: общий вход ---------- */
const DENTAL = 'https://yusifchatgpt-web.github.io/osstem-catalog/'; // без параметра ?m=
async function dentalEnter(page: Page) {
  // сайт сначала спрашивает регион, затем показывает уведомление о данных
  await page.locator('.rgp button[data-rg="rostov"]').click({ timeout: 10_000 });
  await page
    .getByRole('button', { name: 'Понятно', exact: true })
    .click({ timeout: 5000 })
    .catch(() => {});
  await sleep(500);
}

const SCENARIOS: Scenario[] = [
  /* ================= G17 ================= */
  {
    work: 'g17',
    id: 'calc',
    label: 'Калькулятор доставки',
    url: 'https://yozzi05.github.io/gasanov-china/',
    prepare: async (page) => {
      await page.locator('#calc .calc__form').scrollIntoViewIfNeeded();
      await page.evaluate(() => {
        const el = document.querySelector('#calc .calc__form')!;
        window.scrollBy(0, el.getBoundingClientRect().top - window.innerHeight * 0.28);
      });
    },
    play: async (a, page) => {
      const fields = page.locator('#calc .calc__form input:not([type=radio])');
      a.step('Вес груза');
      await a.type(fields.nth(0), '250');
      a.step('Объём');
      await a.type(fields.nth(1), '1,2');
      a.step('Категория');
      await a.click(page.locator('#calc label.calc__plan', { hasText: 'Быстрый' }));
      a.step('Цена и срок');
      await a.hover(page.locator('#calc .calc__result'), 1900);
      // кнопка «Получить точный расчёт» не нажимается
    },
  },
  {
    work: 'g17',
    id: 'route',
    label: 'Маршрут груза',
    url: 'https://yozzi05.github.io/gasanov-china/',
    prepare: async (page) => {
      await page.evaluate(() => {
        const el = document.querySelector('#route')!;
        window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
      });
    },
    play: async (a, page, size) => {
      // блок ведётся прокруткой: проходим его целиком, шесть этапов пути
      const total = await page.evaluate(() => (document.querySelector('#route') as HTMLElement).offsetHeight - window.innerHeight);
      const titles = await page.locator('#route h3').allInnerTexts();
      const name = (i: number, fallback: string) => (titles[i] ?? fallback).replace(/\s+/g, ' ').trim();
      await a.move(a.size.width * (size === 'desk' ? 0.82 : 0.7), a.size.height * 0.7, 500);
      const parts = 6;
      for (let i = 0; i < parts; i++) {
        if (i % 2 === 0) a.step(sentence(name(i, `Этап ${i + 1}`)));
        await a.scrollBy(total / parts, 1250);
        await a.pause(430);
      }
      a.step(sentence(name(5, 'Дверь клиента')));
      await a.pause(900);
    },
  },

  /* ================= Padel 61 ================= */
  {
    work: 'padel61',
    id: 'booking',
    label: 'Бронь корта',
    url: 'https://yozzi05.github.io/padel61-demo/#/booking',
    play: async (a, page) => {
      a.step('Дата');
      await a.click(enabled(page, /^\s*Завтра/i, 'main').first());
      a.step('Корт');
      await a.click(enabled(page, /Шатер/, 'main').first());
      a.step('Время');
      await a.click(enabled(page, /^\s*\d{2}:\d{2}\s*$/, 'main').nth(5));
      a.step('Длительность');
      await a.click(enabled(page, /^\s*(1,5|1\.5|90|2|120)\s*(ч|час|мин)/i, 'main').first());
      a.step('Итог брони');
      // на телефоне итог стоит в другом блоке: берётся тот, что виден
      const total = page.getByText(/итого|перейти к оплате/i).filter({ visible: true }).first();
      if (await total.count()) await a.hover(total, 500); // только наведение, без нажатия
      else await a.pause(1500);
      // «Перейти к оплате» не нажимается
    },
  },
  {
    work: 'padel61',
    id: 'rating',
    label: 'Рейтинг игроков',
    url: 'https://yozzi05.github.io/padel61-demo/#/players',
    prepare: async (page) => {
      await page.evaluate(() => {
        const el = document.querySelector('input[type=search]')!;
        window.scrollBy(0, el.getBoundingClientRect().top - window.innerHeight * 0.3);
      });
    },
    play: async (a, page) => {
      a.step('Таблица рейтинга');
      await a.pause(900);
      a.step('Фильтр по уровню');
      await a.click(page.getByRole('button', { name: 'B+', exact: true }).first());
      await a.pause(500);
      a.step('Только женщины');
      await a.click(page.getByRole('button', { name: 'Женщины', exact: true }).first());
      await a.pause(500);
      a.step('Поиск игрока');
      await a.type(page.locator('input[type=search]').first(), 'Мария');
      await a.pause(1300);
    },
  },
  {
    work: 'padel61',
    id: 'find-game',
    label: 'Поиск игры',
    url: 'https://yozzi05.github.io/padel61-demo/#/find-game',
    prepare: async (page) => {
      await page.evaluate(() => {
        const el = [...document.querySelectorAll('main button')].find((b) => b.textContent?.trim() === 'Все дни')!;
        window.scrollBy(0, el.getBoundingClientRect().top - window.innerHeight * 0.26);
      });
    },
    play: async (a, page) => {
      a.step('День: завтра');
      await a.click(page.getByRole('button', { name: 'Завтра', exact: true }).first());
      a.step('Время: вечер');
      await a.click(page.getByRole('button', { name: 'Вечер', exact: true }).first());
      a.step('Формат: американо');
      await a.click(page.getByRole('button', { name: 'Американо', exact: true }).first());
      a.step('Подходящая заявка');
      await a.hover(page.getByText('ищет', { exact: false }).first(), 1900);
      // «Присоединиться» не нажимается
    },
  },

  /* ================= Padel63 ================= */
  {
    work: 'padel63',
    id: 'booking',
    label: 'Бронь корта',
    url: 'https://yozzi05.github.io/padel63/#/booking',
    play: async (a, page) => {
      a.step('Площадка');
      await a.click(page.getByRole('button', { name: 'Шоссейная', exact: true }).first());
      a.step('День');
      await a.click(enabled(page, /^\s*завтра/i, 'main').first());
      a.step('Длительность');
      await a.click(enabled(page, /^\s*2 часа/, 'main').first());
      a.step('Свободный слот');
      // на телефоне слоты свёрстаны иначе, поэтому время ищется в любом месте кнопки
      await a.click(enabled(page, /\d{2}:\d{2}/, 'main').nth(3));
      await a.pause(1700);
      // дальше слота сценарий не идёт
    },
  },
  {
    work: 'padel63',
    id: 'rating',
    label: 'Рейтинг лиги',
    url: 'https://yozzi05.github.io/padel63/#/rating',
    play: async (a, page) => {
      a.step('Таблица лиги');
      await a.move(a.size.width * 0.55, a.size.height * 0.6, 600);
      await a.scrollBy(320, 1300);
      await a.pause(700);
      await a.scrollBy(-320, 900);
      a.step('Поиск по фамилии');
      await a.type(page.getByPlaceholder('Поиск по фамилии').first(), 'Курушов');
      a.step('Место в лиге');
      await a.pause(1900);
    },
  },

  /* ================= Dental Market ================= */
  {
    work: 'dental-market',
    id: 'search',
    label: 'Поиск по артикулу',
    url: DENTAL,
    prepare: dentalEnter,
    play: async (a, page) => {
      a.step('Строка поиска');
      await a.click(page.locator('button.slaunch').first());
      a.step('Размер или артикул');
      await a.type(page.locator('#gq'), '4.0');
      a.step('Найденные позиции');
      await a.pause(900);
      await a.hover(page.locator('button.qa').filter({ visible: true }).first(), 1500);
    },
  },
  {
    work: 'dental-market',
    id: 'order',
    label: 'Сбор заявки',
    url: DENTAL,
    prepare: async (page) => {
      await dentalEnter(page);
      await page.locator('button.slaunch').first().click();
      await page.locator('#gq').fill('4.0');
      await sleep(1200);
    },
    play: async (a, page) => {
      const add = page.locator('button.qa').filter({ visible: true });
      a.step('Позиции каталога');
      await a.pause(500);
      a.step('Добавление в заявку');
      await a.click(add.nth(0));
      await a.click(add.nth(1));
      a.step('Корзина');
      // после первой позиции внизу появляется плашка «Корзина» с суммой
      await a.click(page.locator('button[data-cart]').filter({ hasText: 'Корзина' }).filter({ visible: true }).first());
      a.step('Заявка собрана');
      await a.pause(2100);
      // кнопка отправки заявки не нажимается
    },
  },
];

function sentence(s: string) {
  const low = s.toLowerCase();
  return low.charAt(0).toUpperCase() + low.slice(1);
}

/* ---------- Кодирование ---------- */
async function ffmpeg(args: string[]) {
  if (!ffmpegPath) throw new Error('ffmpeg-static не нашёл бинарник');
  await run(ffmpegPath, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { maxBuffer: 1 << 26 });
}

async function encode(src: string, from: number, to: number, base: string, w: number, h: number) {
  const cut = ['-i', src, '-ss', from.toFixed(2), '-to', to.toFixed(2), '-an', '-r', '30', '-vf', `scale=${w}:${h}:flags=lanczos`];
  const sizes: Record<string, number> = {};

  for (let crf = 26; crf <= 34; crf += 4) {
    await ffmpeg([...cut, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${base}.mp4`]);
    sizes.mp4 = (await stat(`${base}.mp4`)).size;
    if (sizes.mp4 <= MAX_BYTES) break;
  }
  for (let crf = 36; crf <= 46; crf += 5) {
    await ffmpeg([...cut, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(crf), '-deadline', 'good', '-cpu-used', '3', '-row-mt', '1', '-pix_fmt', 'yuv420p', `${base}.webm`]);
    sizes.webm = (await stat(`${base}.webm`)).size;
    if (sizes.webm <= MAX_BYTES) break;
  }

  // первый кадр клипа как заставка
  const png = `${base}.poster.png`;
  await ffmpeg(['-i', `${base}.mp4`, '-frames:v', '1', png]);
  await sharp(png).webp({ quality: 80 }).toFile(`${base}.webp`);
  await rm(png);

  return sizes;
}

async function contactSheet(base: string, name: string, duration: number) {
  if (!CHECK_DIR) return;
  await mkdir(CHECK_DIR, { recursive: true });
  const every = duration / 8;
  await ffmpeg(['-i', `${base}.mp4`, '-vf', `fps=1/${every.toFixed(3)},scale=-2:400,tile=8x1`, '-frames:v', '1', path.join(CHECK_DIR, `${name}.jpg`)]);
}

/* ---------- Запись одного клипа ---------- */
async function record(browser: Browser, sc: Scenario, key: SizeKey, tmp: string) {
  const size = SIZES[key];
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: size.scale,
    locale: 'ru-RU',
    recordVideo: { dir: tmp, size: { width: size.width * size.scale, height: size.height * size.scale } },
  });
  await context.addInitScript(CURSOR_SCRIPT);
  const page = await context.newPage();
  const born = Date.now(); // запись видео начинается вместе со страницей
  const actor = new Actor(page, size);
  let from = 0;
  let to = 0;

  try {
    await page.goto(sc.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('load', { timeout: 25_000 }).catch(() => {});
    await sleep(1800);
    await sc.prepare?.(page, key);
    await sleep(1600); // блоки с появлением по прокрутке успевают показаться до первого кадра
    await page.mouse.move(actor.x, actor.y);
    await sleep(350);

    from = (Date.now() - born) / 1000;
    actor.start();
    await sc.play(actor, page, key);
    await sleep(500);
    // хвост клипа — неподвижная пауза на итоге: если вышло длиннее 14 с, она подрезается
    to = Math.min((Date.now() - born) / 1000, from + MAX_SEC);
  } finally {
    await context.close(); // файл видео дописывается при закрытии
  }

  const src = await page.video()!.path();
  const dir = path.join(OUT_DIR, sc.work);
  await mkdir(dir, { recursive: true });
  const base = path.join(dir, `${sc.id}-${key}`);
  const sizes = await encode(src, from, to, base, size.width * size.scale, size.height * size.scale);
  const duration = Math.round((to - from) * 10) / 10;
  await contactSheet(base, `${sc.work}-${sc.id}-${key}`, duration);

  const warn = [
    duration < MIN_SEC || duration > MAX_SEC ? `длина ${duration} с вне ${MIN_SEC}–${MAX_SEC}` : '',
    sizes.mp4 > MAX_BYTES ? 'mp4 больше 1.5 МБ' : '',
    sizes.webm > MAX_BYTES ? 'webm больше 1.5 МБ' : '',
  ].filter(Boolean);
  console.log(
    `${sc.work}/${sc.id}-${key}: ${duration} с, mp4 ${Math.round(sizes.mp4 / 1024)} КБ, webm ${Math.round(sizes.webm / 1024)} КБ` +
      (warn.length ? `  ⚠ ${warn.join('; ')}` : ''),
  );
  return { duration, steps: actor.steps };
}

/* ---------- Данные для сайта ---------- */
type DemoData = { id: string; label: string; duration: Partial<Record<SizeKey, number>>; steps: Partial<Record<SizeKey, Step[]>> };
type DataFile = Record<string, DemoData[]>;

async function main() {
  const args = process.argv.slice(2);
  const keys = (['desk', 'mob'] as const).filter((k) => !args.some((a) => a.startsWith('--')) || args.includes(`--${k}`));
  const only = args.filter((a) => !a.startsWith('--'));
  const list = SCENARIOS.filter((s) => !only.length || only.includes(s.work) || only.includes(`${s.work}/${s.id}`));
  if (!list.length) throw new Error(`Нет сценариев: ${only.join(', ')}`);

  const data: DataFile = structuredClone((await import('../data/demos.ts').catch(() => ({ DEMOS: {} }))).DEMOS);
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'kaspace-demos-'));
  const browser = await chromium.launch();
  let failed = 0;

  for (const sc of list) {
    for (const key of keys) {
      try {
        const res = await record(browser, sc, key, tmp);
        const group = (data[sc.work] ??= []);
        let entry = group.find((d) => d.id === sc.id);
        if (!entry) group.push((entry = { id: sc.id, label: sc.label, duration: {}, steps: {} }));
        entry.label = sc.label;
        entry.duration[key] = res.duration;
        entry.steps[key] = res.steps;
      } catch (err) {
        failed += 1;
        const why = err instanceof Error ? err.message.split('\n').slice(0, 3).join(' | ') : String(err);
        console.error(`${sc.work}/${sc.id}-${key}: не записано. ${why}`);
      }
    }
  }

  await browser.close();
  await rm(tmp, { recursive: true, force: true });

  // порядок функций в данных такой же, как в списке сценариев
  for (const work of Object.keys(data)) {
    const order = SCENARIOS.filter((s) => s.work === work).map((s) => s.id);
    data[work].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }
  await writeFile(DATA_FILE, DATA_HEADER + JSON.stringify(data, null, 2) + ';\n');
  if (failed) process.exitCode = 1;
}

main();
