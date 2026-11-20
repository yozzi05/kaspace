/**
 * Проверка страницы на контрольных ширинах в обычном режиме и при prefers-reduced-motion.
 *
 *   npm run check                         против http://localhost:3000 (npm run dev)
 *   npm run check -- http://localhost:4173   против собранного сайта
 *
 * Что проверяется: ошибки в консоли, блоки шире экрана, заставка входа, автозапуск клипов
 * на телефоне, поведение при «меньше движения». CHECK_DIR=папка сохраняет снимки разделов.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import type { Page } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:3000';
const WIDTHS = [360, 390, 768, 1024, 1440, 1920];
const SHOTS = process.env.CHECK_DIR;
const ANCHORS = ['#top', '.facts', '#services', '#works', '.wk-grid', '#reels', '#process', '#calc', '#faq', '#demo', 'footer'];

type Problem = string;

/** Блоки, которые вылезают за экран (ленты с горизонтальной прокруткой не считаются). */
async function overflow(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('main *, footer *, header *')) {
      if (el.closest('.wk-strip, .rl-strip, .wv, .intro, .kcursor')) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > vw + 1.5 || r.left < -1.5) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
        out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} [${Math.round(r.left)}…${Math.round(r.right)} из ${vw}]`);
      }
    }
    return [...new Set(out)].slice(0, 6);
  });
}

async function run(width: number, reduced: boolean): Promise<Problem[]> {
  const phone = width < 768;
  // CHECK_RESOLVE="MAP example.ru 1.2.3.4": проверка домена, пока локальный DNS держит старый адрес
  const browser = await chromium.launch({
    args: process.env.CHECK_RESOLVE ? [`--host-resolver-rules=${process.env.CHECK_RESOLVE}`] : [],
  });
  const context = await browser.newContext({
    viewport: { width, height: phone ? 800 : 900 },
    isMobile: phone,
    hasTouch: phone,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    colorScheme: 'dark',
    locale: 'ru-RU',
  });
  const page = await context.newPage();
  const problems: Problem[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !/reels\/|404/.test(m.text())) problems.push(`консоль: ${m.text().slice(0, 140)}`);
  });
  page.on('pageerror', (e) => problems.push(`ошибка страницы: ${e.message.slice(0, 140)}`));

  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(reduced ? 900 : 2800);

  const state = await page.evaluate(() => ({
    intro: document.documentElement.dataset.intro,
    introShown: !!document.querySelector('.intro') && getComputedStyle(document.querySelector('.intro')!).display !== 'none',
    heroOpacity: getComputedStyle(document.querySelector('.hero-word')!).opacity,
  }));
  if (state.introShown) problems.push('заставка входа не ушла');
  if (state.heroOpacity !== '1') problems.push(`слова первого экрана не видны (opacity ${state.heroOpacity})`);

  for (const sel of ANCHORS) {
    const found = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return false;
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70);
      return true;
    }, sel);
    if (!found) {
      problems.push(`нет блока ${sel}`);
      continue;
    }
    await page.waitForTimeout(650);
    for (const o of await overflow(page)) problems.push(`шире экрана у ${sel}: ${o}`);
    if (SHOTS) {
      await mkdir(SHOTS, { recursive: true });
      const name = `${width}${reduced ? '-reduced' : ''}-${sel.replace(/[^a-z]/gi, '') || 'top'}.jpg`;
      await page.screenshot({ path: path.join(SHOTS, name), type: 'jpeg', quality: 60 });
    }
  }

  /* Клипы в ленте работ */
  await page.evaluate(() => {
    const el = document.querySelector('.wk-stripwrap')!;
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 60);
  });
  await page.waitForTimeout(3500);
  const clips = await page.evaluate(() => {
    const v = document.querySelector<HTMLVideoElement>('.dc-video');
    return {
      playing: !!v && !v.paused && v.currentTime > 0,
      rate: v?.playbackRate,
      playButton: !!document.querySelector('.dc-play'),
      pinned: document.querySelector('.wk-strip')?.getAttribute('data-pin'),
    };
  });
  if (reduced) {
    if (clips.playing) problems.push('клип запустился сам при «меньше движения»');
    if (!clips.playButton) problems.push('нет кнопки воспроизведения при «меньше движения»');
    if (clips.pinned === 'true') problems.push('лента работ закреплена при «меньше движения»');
  } else if (phone) {
    if (!clips.playing) problems.push('клип не запустился сам на телефоне');
    else if (clips.rate !== 1.5) problems.push(`скорость клипа ${clips.rate}, ожидалась 1.5`);
  }

  await browser.close();
  return problems;
}

let failed = 0;
for (const width of WIDTHS) {
  for (const reduced of [false, true]) {
    const problems = await run(width, reduced);
    const label = `${String(width).padStart(4)}px ${reduced ? 'меньше движения' : 'обычный режим  '}`;
    if (problems.length) {
      failed += 1;
      console.log(`✗ ${label}\n   - ${[...new Set(problems)].join('\n   - ')}`);
    } else {
      console.log(`✓ ${label}`);
    }
  }
}
if (failed) process.exitCode = 1;
