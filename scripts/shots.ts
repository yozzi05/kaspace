/**
 * Снимает картинки всех работ в public/works/:
 *   <id>-long.webp     длинный скриншот всей страницы, ширина 1440
 *   <id>-cover.webp    заставка карточки: верх страницы 1440×2400, уменьшенный до 960×1600
 *                      (в покое виден первый экран, при наведении заставка едет вверх)
 *   <id>-cover-m.webp  первый экран на телефоне 390×844 (плотность 2)
 *
 *   npm run shots            все работы
 *   npm run shots -- g17     только указанные id
 *
 * Перед первым запуском: npx playwright install chromium
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import sharp from 'sharp';
import { WORKS } from '../data/works.ts';
import type { Work } from '../data/works.ts';

const WIDTH = 1440;
const HEIGHT = 900;
const MAX_HEIGHT = 12000; // выше webp и память браузера начинают мешать
const COVER_CROP = 2400;
const COVER_WIDTH = 960;
const MOBILE = { width: 390, height: 844 };
const OUT_DIR = path.join(process.cwd(), 'public', 'works');

const out = (id: string, suffix: string) => path.join(OUT_DIR, `${id}-${suffix}.webp`);
const kb = (bytes: number) => `${Math.round(bytes / 1024)} КБ`;

/** Старые сайты для шторки «было / стало»: первый экран в public/works/before/<id>.webp */
const BEFORE: Record<string, string> = {
  g17: 'https://gasanov-china.ru/',
};

/** Что убрать с экрана перед съёмкой: диалоги и баннеры, которые закрывают страницу. */
const CLEAR: Record<string, (page: Page) => Promise<void>> = {
  'dental-market': async (page) => {
    await page.locator('.rgp button[data-rg="rostov"]').click({ timeout: 8000 }).catch(() => {});
    await page.getByRole('button', { name: 'Понятно', exact: true }).click({ timeout: 5000 }).catch(() => {});
  },
  enzoo: async (page) => {
    await page.getByRole('button', { name: 'Отклонить', exact: true }).click({ timeout: 5000 }).catch(() => {});
  },
};

async function open(page: Page, url: string, id?: string) {
  // не ждём события load жёстко: у части демо один ресурс может висеть минутами
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForLoadState('load', { timeout: 25_000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  if (id && CLEAR[id]) {
    await CLEAR[id](page);
    await page.waitForTimeout(500);
  }
}

async function shootBefore(browser: Browser, work: Work) {
  const url = BEFORE[work.id];
  if (!url) return;
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, reducedMotion: 'reduce', locale: 'ru-RU' });
  const page = await context.newPage();
  try {
    await open(page, url);
    await page.waitForTimeout(1200);
    const png = await page.screenshot({ animations: 'disabled' });
    await mkdir(path.join(OUT_DIR, 'before'), { recursive: true });
    const file = path.join(OUT_DIR, 'before', `${work.id}.webp`);
    const shot = await sharp(png).resize({ width: 1280 }).webp({ quality: 78 }).toFile(file);
    console.log(`${work.id}: before ${shot.width}×${shot.height} ${kb(shot.size)}`);
  } finally {
    await context.close();
  }
}

/** Проходит страницу сверху вниз, чтобы сработали ленивые картинки и появление блоков. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 180));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
}

async function shootDesktop(browser: Browser, work: Work) {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    locale: 'ru-RU',
  });
  const page = await context.newPage();
  try {
    await open(page, work.url, work.id);
    await scrollThrough(page);

    const png = await page.screenshot({ fullPage: true, animations: 'disabled' });
    const meta = await sharp(png).metadata();
    const width = Math.min(meta.width ?? WIDTH, WIDTH);
    const fullHeight = meta.height ?? 0;

    const long = await sharp(png)
      .extract({ left: 0, top: 0, width, height: Math.min(fullHeight, MAX_HEIGHT) })
      .webp({ quality: 72 })
      .toFile(out(work.id, 'long'));

    const cover = await sharp(png)
      .extract({ left: 0, top: 0, width, height: Math.min(fullHeight, COVER_CROP) })
      .resize({ width: COVER_WIDTH })
      .webp({ quality: 76 })
      .toFile(out(work.id, 'cover'));

    const note = fullHeight > MAX_HEIGHT ? ` (страница ${fullHeight}px, обрезано)` : '';
    console.log(`${work.id}: long ${long.width}×${long.height} ${kb(long.size)}${note}, cover ${cover.width}×${cover.height} ${kb(cover.size)}`);
  } finally {
    await context.close();
  }
}

async function shootMobile(browser: Browser, work: Work) {
  const context = await browser.newContext({
    viewport: MOBILE,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
    locale: 'ru-RU',
  });
  const page = await context.newPage();
  try {
    await open(page, work.url, work.id);
    await page.waitForTimeout(600);
    const png = await page.screenshot({ animations: 'disabled' });
    const cover = await sharp(png).webp({ quality: 76 }).toFile(out(work.id, 'cover-m'));
    console.log(`${work.id}: cover-m ${cover.width}×${cover.height} ${kb(cover.size)}`);
  } finally {
    await context.close();
  }
}

async function main() {
  const only = process.argv.slice(2);
  const works = only.length ? WORKS.filter((w) => only.includes(w.id)) : WORKS;
  if (!works.length) throw new Error(`Нет работ с id: ${only.join(', ')}`);

  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  let failed = 0;
  for (const work of works) {
    for (const shoot of [shootDesktop, shootMobile, shootBefore]) {
      try {
        await shoot(browser, work);
      } catch (err) {
        failed += 1;
        console.error(`${work.id}: не снято. ${err instanceof Error ? err.message.split('\n')[0] : err}`);
      }
    }
  }

  await browser.close();
  if (failed) process.exitCode = 1;
}

main();
