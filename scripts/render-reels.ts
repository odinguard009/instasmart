/**
 * OPSIONAL: merender reel (motion graphics) menjadi file MP4 memakai Playwright + ffmpeg.
 *   npm run build && npm run preview &        (server hasil build harus berjalan)
 *   npm run render:reels -- <id-kartu-reel> [id lain ...] [--fps 30] [--base http://localhost:4173/instasmart/]
 *
 * Cara kerja: membuka #/render/<id>?t=<ms> (satu frame deterministik), memotret tiap frame, lalu menyalurkannya
 * ke ffmpeg. Hasil: out/reels/<id>.mp4 (tanpa audio). Butuh `playwright` yang bisa di-resolve dan `ffmpeg` di PATH.
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { loadLibraryFromDisk, ROOT } from './content-io';

interface PageLike {
  goto(url: string): Promise<unknown>;
  evaluate<T>(fn: (arg: string) => T, arg: string): Promise<T>;
  waitForSelector(selector: string): Promise<unknown>;
  screenshot(options: { type: 'png' }): Promise<Buffer>;
}
interface BrowserLike {
  newPage(options: { viewport: { width: number; height: number }; deviceScaleFactor: number }): Promise<PageLike>;
  close(): Promise<void>;
}
interface PlaywrightLike {
  chromium: { launch(): Promise<BrowserLike> };
}

const WIDTH = 540;
const HEIGHT = 960;

function loadPlaywright(): PlaywrightLike {
  try {
    return createRequire(import.meta.url)('playwright') as PlaywrightLike;
  } catch {
    console.error('Paket `playwright` tidak ditemukan. Pasang dulu (npm i -D playwright && npx playwright install chromium) atau set NODE_PATH.');
    process.exit(1);
  }
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { fps: { type: 'string', default: '30' }, base: { type: 'string', default: 'http://localhost:4173/instasmart/' } },
});
if (positionals.length === 0) {
  console.error('Sebutkan minimal satu id kartu reel. Contoh: npm run render:reels -- kebangsaan-empat-tujuan-negara');
  process.exit(1);
}
if (spawnSync('ffmpeg', ['-version']).status !== 0) {
  console.error('ffmpeg tidak ditemukan di PATH. Pasang ffmpeg dulu.');
  process.exit(1);
}

const fps = Number(values.fps);
const library = loadLibraryFromDisk();
const outDir = join(ROOT, 'out', 'reels');
mkdirSync(outDir, { recursive: true });
const browser = await loadPlaywright().chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });

for (const id of positionals) {
  const card = library.cardById.get(id);
  if (card?.type !== 'reel') {
    console.error(`lewati ${id}: bukan kartu reel`);
    continue;
  }
  const totalMs = card.scenes.reduce((sum, scene) => sum + scene.durationMs, 0);
  const frames = Math.ceil((totalMs / 1000) * fps);
  const output = join(outDir, `${id}.mp4`);
  const ffmpeg = spawn(
    'ffmpeg',
    ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-crf', '26', output],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  );
  const finished = new Promise<number | null>((resolve) => ffmpeg.on('close', resolve));

  await page.goto(`${values.base}#/render/${id}?t=0`);
  await page.waitForSelector('[data-render-ready]');
  for (let frame = 0; frame < frames; frame++) {
    const timeMs = Math.round((frame * 1000) / fps);
    // Ganti hash saja (tanpa muat ulang), lalu tunggu dua frame supaya React selesai menggambar.
    await page.evaluate((hash) => {
      window.location.hash = hash;
      return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    }, `/render/${id}?t=${timeMs}`);
    const png = await page.screenshot({ type: 'png' });
    if (!ffmpeg.stdin.write(png)) await new Promise((resolve) => ffmpeg.stdin.once('drain', resolve));
    if (frame % fps === 0) process.stdout.write(`\r${id}: ${Math.round((frame / frames) * 100)}%`);
  }
  ffmpeg.stdin.end();
  const code = await finished;
  console.log(code === 0 ? `\r${id}: selesai -> out/reels/${id}.mp4 (${frames} frame, ${(totalMs / 1000).toFixed(1)} detik)` : `\r${id}: ffmpeg gagal (kode ${code})`);
}
await browser.close();
