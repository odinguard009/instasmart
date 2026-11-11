/**
 * Pemeriksaan asap di peramban sungguhan (Playwright): membuka tiap layar hasil build, mencatat error konsol,
 * dan menyimpan screenshot ke out/screenshots/.
 *
 * Pakai:  npm run build && npm run preview &   lalu   npm run smoke
 * Butuh paket `playwright` yang bisa di-resolve (mis. NODE_PATH=/path/ke/node_modules) beserta Chromium-nya.
 * Bukan bagian dari `npm test` karena butuh peramban.
 */
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.argv[2] ?? 'http://localhost:4173/instasmart/';
const OUT = 'out/screenshots';
mkdirSync(OUT, { recursive: true });

const errors = [];
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
const page = await context.newPage();
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`[console] ${page.url()} :: ${message.text()}`);
});
page.on('pageerror', (error) => errors.push(`[pageerror] ${page.url()} :: ${error.message}`));

async function visit(name, hash, after) {
  await page.goto(`${BASE}#${hash}`);
  await page.reload();
  await page.waitForTimeout(700);
  if (after) await after();
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`ok   ${name}`);
}

async function expectText(text) {
  if ((await page.getByText(text, { exact: false }).count()) === 0) errors.push(`[cek] teks "${text}" tidak ditemukan di ${page.url()}`);
}

await visit('01-beranda', '/', () => expectText('Instasmart'));
await visit('02-story', '/', async () => {
  await page.locator('section[aria-label="Stories hari ini"] button').first().click();
  await page.waitForTimeout(900);
  if ((await page.getByRole('dialog').count()) === 0) errors.push('[cek] penampil story tidak terbuka');
});
await visit('03-beranda-scroll', '/', async () => {
  const main = page.locator('main');
  for (let i = 0; i < 6; i++) {
    await main.evaluate((node, step) => node.scrollTo(0, step * 700), i + 1);
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${OUT}/03-beranda-scroll-${i + 1}.png` });
  }
});
await visit('04-selesai', '/', async () => {
  await page.locator('main').evaluate((node) => node.scrollTo(0, node.scrollHeight));
  await page.waitForTimeout(500);
  await expectText('Selesai hari ini');
  await page.getByRole('button', { name: /^Tambah \d+ item$/ }).click();
  if ((await page.getByRole('alertdialog').count()) === 0) errors.push('[cek] konfirmasi tambah item tidak muncul');
});
await visit('05-reels', '/reels', () => page.waitForTimeout(2500));
await visit('06-jelajah', '/jelajah', () => expectText('kartu'));
await visit('07-jelajah-cari', '/jelajah', async () => {
  await page.getByPlaceholder('Cari pasal, konsep, atau kata kunci').fill('1320');
  await page.waitForTimeout(400);
});
await visit('08-favorit', '/favorit', () => expectText('Favorit'));
await visit('09-profil', '/profil', () => expectText('Kuota harian'));
await visit('10-review', '/review', () => expectText('Lapor salah'));

const manifest = await page.request.get(`${BASE}manifest.webmanifest`);
if (!manifest.ok()) errors.push(`[cek] manifest gagal dimuat: HTTP ${manifest.status()}`);
else console.log(`ok   manifest (${(await manifest.json()).name})`);
const worker = await page.request.get(`${BASE}sw.js`);
if (!worker.ok()) errors.push(`[cek] service worker gagal dimuat: HTTP ${worker.status()}`);
else console.log('ok   sw.js');

await browser.close();
if (errors.length > 0) {
  console.error(`\n${errors.length} masalah:\n${errors.join('\n')}`);
  process.exit(1);
}
console.log('\nTidak ada error konsol. Screenshot di', OUT);
