/**
 * Membuat ikon PWA (PNG) dari satu SVG buatan sendiri. Jalankan: npm run icons
 * Hasil di public/icons/ ikut di-commit, jadi skrip ini hanya perlu dijalankan saat desain ikon berubah.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { ROOT } from './content-io';

const OUT_DIR = join(ROOT, 'public', 'icons');

/** `inset` = porsi tepi kosong (ikon maskable butuh zona aman lebih besar). */
function iconSvg(inset: number): string {
  const scale = 1 - inset * 2;
  const offset = 256 * inset;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="bg" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#FFB23F"/><stop offset="0.5" stop-color="#FF5A5F"/><stop offset="1" stop-color="#B84DFF"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" fill="url(#bg)"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <g stroke="#2B1B12" stroke-width="6" stroke-linejoin="round">
      <path d="M70 70 L58 26 L104 54 Z M186 70 L198 26 L152 54 Z" fill="#8B5E3C"/>
      <ellipse cx="128" cy="140" rx="84" ry="88" fill="#8B5E3C"/>
      <circle cx="94" cy="118" r="36" fill="#F3E3C3"/>
      <circle cx="162" cy="118" r="36" fill="#F3E3C3"/>
      <circle cx="94" cy="118" r="21" fill="#FFFFFF"/>
      <circle cx="162" cy="118" r="21" fill="#FFFFFF"/>
      <path d="M114 146 L142 146 L128 168 Z" fill="#F2A33A"/>
    </g>
    <circle cx="94" cy="118" r="10" fill="#2B1B12"/>
    <circle cx="162" cy="118" r="10" fill="#2B1B12"/>
    <path d="M100 196 l18 18 l38 -44" fill="none" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

const TARGETS = [
  { file: 'icon-192.png', size: 192, inset: 0.04 },
  { file: 'icon-512.png', size: 512, inset: 0.04 },
  { file: 'icon-maskable-512.png', size: 512, inset: 0.14 },
] as const;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'icon.svg'), iconSvg(0.04));
for (const target of TARGETS) {
  await sharp(Buffer.from(iconSvg(target.inset)), { density: 300 }).resize(target.size, target.size).png().toFile(join(OUT_DIR, target.file));
  console.log(`dibuat: public/icons/${target.file}`);
}
