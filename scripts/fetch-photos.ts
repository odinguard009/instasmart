/**
 * OPSIONAL: mengambil foto latar bebas-lisensi dari Pexels untuk template visual `photo`.
 *   PEXELS_API_KEY=... npm run fetch:photos -- --query "courtroom" [--count 3]
 *
 * Foto disimpan ke public/photos/, lalu skrip mencetak potongan JSON `visual` (lengkap dengan kredit fotografer)
 * untuk ditempel ke kartu. Tanpa PEXELS_API_KEY skrip berhenti; aplikasi tetap berjalan penuh dengan visual SVG.
 * Hanya Pexels yang dipakai. Jangan mengambil gambar dari Instagram, Google Images, atau situs tanpa lisensi jelas.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { ROOT } from './content-io';

const responseSchema = z.object({
  photos: z.array(
    z.object({
      id: z.number(),
      alt: z.string().nullable().optional(),
      photographer: z.string(),
      photographer_url: z.url(),
      src: z.object({ large: z.url() }),
    }),
  ),
});

const apiKey = process.env.PEXELS_API_KEY;
if (!apiKey) {
  console.error('PEXELS_API_KEY belum diset. Tidak ada foto yang diambil; aplikasi tetap memakai visual SVG bawaan.\nKunci gratis: https://www.pexels.com/api/ lalu jalankan: PEXELS_API_KEY=... npm run fetch:photos -- --query "courtroom"');
  process.exit(1);
}

const { values } = parseArgs({ options: { query: { type: 'string' }, count: { type: 'string', default: '3' } } });
if (!values.query) {
  console.error('Argumen wajib: --query "<kata kunci>"');
  process.exit(1);
}

const url = new URL('https://api.pexels.com/v1/search');
url.searchParams.set('query', values.query);
url.searchParams.set('per_page', values.count);
url.searchParams.set('orientation', 'square');
const response = await fetch(url, { headers: { Authorization: apiKey } });
if (!response.ok) {
  console.error(`Pexels menjawab HTTP ${response.status}. Periksa kunci atau kuota.`);
  process.exit(1);
}
const { photos } = responseSchema.parse(await response.json());

const outDir = join(ROOT, 'public', 'photos');
mkdirSync(outDir, { recursive: true });
for (const photo of photos) {
  const file = `pexels-${photo.id}.jpg`;
  const image = await fetch(photo.src.large);
  if (!image.ok) {
    console.warn(`lewati ${photo.id}: HTTP ${image.status}`);
    continue;
  }
  writeFileSync(join(outDir, file), Buffer.from(await image.arrayBuffer()));
  const visual = {
    template: 'photo',
    src: `photos/${file}`,
    alt: photo.alt || values.query,
    overlayText: 'GANTI DENGAN TEKS KARTU',
    credit: { photographer: photo.photographer, url: photo.photographer_url },
  };
  console.log(`\nTersimpan: public/photos/${file}\nTempel ke kartu sebagai "visual":\n${JSON.stringify(visual, null, 2)}`);
}
console.log(`\n${photos.length} foto diproses. Kredit fotografer wajib tetap ada di kartu (divalidasi skema).`);
