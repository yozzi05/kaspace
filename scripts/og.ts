/**
 * Рисует картинку для соцсетей и значок для iOS:
 *   public/og.png        1200×630: тёмный фон, название с синей «s», строка услуг
 *   app/apple-icon.png   180×180: плашка-логотип
 *
 *   npm run og
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const root = process.cwd();

const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@700&family=JetBrains+Mono:wght@500&display=block" rel="stylesheet">
<style>
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:630px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:44px;
    background:radial-gradient(120% 90% at 50% 45%,#121C36 0%,#0A1122 55%,#060B17 100%);color:#F0EEE8;overflow:hidden;position:relative}
  body::before{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(240,238,232,.12) 1.4px,transparent 1.6px);background-size:30px 30px}
  .word{position:relative;display:flex;align-items:baseline;font:700 236px/1 'Familjen Grotesk',sans-serif;letter-spacing:-.035em}
  .word b{font-weight:700;color:#3DB8FF}
  .word i{display:block;width:.17em;height:.78em;margin-left:.07em;background:#3DB8FF}
  .line{position:relative;font:500 26px/1 'JetBrains Mono',monospace;letter-spacing:.22em;text-transform:uppercase;color:rgba(240,238,232,.72)}
</style></head><body>
  <div class="word">ka<b>s</b>pace<i></i></div>
  <div class="line">Сайты · Приложения · ИИ-автоматизация</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const shot = await page.screenshot({ type: 'png' });
await browser.close();

const og = await sharp(shot).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(path.join(root, 'public', 'og.png'));
console.log(`og.png: ${og.width}×${og.height}, ${Math.round(og.size / 1024)} КБ`);

const icon = await readFile(path.join(root, 'app', 'icon.svg'));
const apple = await sharp(icon, { density: 400 }).resize(180, 180).png().toFile(path.join(root, 'app', 'apple-icon.png'));
console.log(`apple-icon.png: ${apple.width}×${apple.height}`);
