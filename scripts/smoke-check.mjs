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
await visit('04-feed-tanpa-batas', '/', async () => {
  const main = page.locator('main');
  const countPosts = () => page.locator('main article').count();
  const before = await countPosts();
  for (let i = 0; i < 4; i++) {
    await main.evaluate((node) => node.scrollTo(0, node.scrollHeight));
    await page.waitForTimeout(600);
  }
  const after = await countPosts();
  if (after <= before) errors.push(`[cek] feed tidak bertambah saat digulir ke ujung (${before} -> ${after})`);
  else console.log(`ok   feed bertambah otomatis: ${before} -> ${after} post`);
  await expectText('Target harian tercapai');
});
await visit('05-reels', '/reels', () => page.waitForTimeout(2500));
await visit('06-jelajah', '/jelajah', () => expectText('kartu'));
await visit('07-jelajah-cari', '/jelajah', async () => {
  await page.getByPlaceholder('Cari pasal, konsep, atau kata kunci').fill('1320');
  await page.waitForTimeout(400);
});
await visit('08-favorit', '/favorit', () => expectText('Favorit'));
await visit('09-profil', '/profil', () => expectText('Target harian'));
await visit('10-review', '/review', () => expectText('Lapor salah'));

await visit('11-kuis-detail', '/kartu/perdata-unsur-pmh', async () => {
  await page.getByRole('button', { name: /Ada perjanjian tertulis sebelumnya/ }).click();
  await page.waitForTimeout(300);
  await expectText('Tepat!');
  await page.getByRole('button', { name: 'Suka (masuk Favorit)' }).click();
});
await visit('12-favorit-terisi', '/favorit', async () => {
  if ((await page.locator('a[href="#/kartu/perdata-unsur-pmh"]').count()) !== 1) errors.push('[cek] kartu yang disukai tidak muncul di Favorit');
});
await visit('13-carousel-detail', '/kartu/perdata-asas-perjanjian', async () => {
  await page.getByRole('button', { name: 'Ke slide 3' }).click();
  await page.waitForTimeout(700);
  await expectText('3/7');
});
await visit('14-reel-detail', '/kartu/pidana-empat-hal-baru', () => page.waitForTimeout(6000));
await visit('15-video-detail', '/kartu/kebangsaan-video-contoh-tujuan-negara', async () => {
  await page.waitForTimeout(1500);
  const ready = await page.locator('video').evaluate((video) => video.readyState >= 2 && video.videoWidth > 0);
  if (!ready) errors.push('[cek] video MP4 lokal tidak termuat');
});
await visit('16-review-setujui', '/review', async () => {
  await page.getByRole('button', { name: 'Tandai sudah diverifikasi' }).first().click();
  await expectText('Disetujui · 1');
  await page.getByRole('button', { name: 'Lapor salah', exact: true }).first().click();
  await page.getByRole('button', { name: 'Laporkan', exact: true }).click();
  await expectText('Dilaporkan · 1');
});
await visit('17-tema-terang', '/profil', async () => {
  await page.getByText('Terang', { exact: true }).click();
  await page.waitForTimeout(300);
  if (await page.evaluate(() => document.documentElement.classList.contains('dark'))) errors.push('[cek] tema terang tidak diterapkan');
});
await visit('18-beranda-terang', '/');
await visit('19-render-frame', '/render/perdata-wanprestasi-vs-pmh?t=9000');

// Offline: konteks terpisah dengan service worker aktif, lalu putuskan jaringan dan muat ulang.
const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const offlinePage = await offlineContext.newPage();
await offlinePage.goto(BASE);
await offlinePage.evaluate(() => navigator.serviceWorker.ready);
await offlinePage.waitForTimeout(2500);
await offlineContext.setOffline(true);
try {
  await offlinePage.reload();
  await offlinePage.waitForTimeout(1000);
  const offlineOk = (await offlinePage.getByText('Instasmart').count()) > 0 && (await offlinePage.locator('article').count()) > 0;
  if (offlineOk) console.log('ok   offline (dimuat ulang tanpa jaringan)');
  else errors.push('[cek] aplikasi tidak tampil saat offline');
} catch (error) {
  errors.push(`[cek] muat ulang offline gagal: ${error.message}`);
}
await offlineContext.close();

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
