# Cara memperluas Instasmart

Setiap resep di bawah diakhiri dengan langkah yang sama:

```bash
npm run validate:content   # jika menyentuh konten
npm run lint && npm test && npm run build
```

Ingat aturan akurasi di `CLAUDE.md`: kartu baru selalu `status: "draft"`, wajib punya `source`, dan jangan mengarang pasal.

## (a) Menambah topik atau sub-topik

1. Edit `content/topics.json`: tambah objek `{ id, name, shortName, palette, subTopics: [{ id, name }] }`.
   `id` berupa slug huruf kecil; `palette` salah satu dari `PALETTE_IDS` di `src/content/schema.ts`.
2. (Opsional) Tambah akun fiktif untuk topik itu di `content/accounts.json` (`username`, `displayName`, `character`, `bio`).
3. Buat `content/cards/<id-topik>.json` berisi array kartu. Sertakan minimal satu `story`, karena baris Stories memilih story per topik.
4. Tidak ada kode yang perlu diubah: file di `content/cards/` otomatis termuat.

## (b) Menambah kartu secara manual

1. Buka file topik di `content/cards/`. Salin kartu bertipe sama sebagai pola, lalu ubah isinya.
2. Field wajib semua tipe: `id` (unik, slug, awali dengan id topik), `type`, `topicId`, `subTopicId`, `account`, `source { title, reference, url? }`, `status: "draft"`, `createdAt`.
3. Field per tipe (lihat `src/content/schema.ts` untuk batas panjang):
   - `fact`: `visual`, `caption`
   - `humor`: `visual`, `caption`, `teaches`
   - `mnemonic`: `visual`, `caption`, `phrase`, `expansion[]`
   - `quiz` / `poll`: `question`, `options[]`, `answerIndex`, `explanation`, `caption?`
   - `review` (flashcard): `front`, `back`
   - `carousel`: `caption`, `slides[]` berisi `{ kind: "visual", visual }` atau `{ kind: "quiz", ...soal }`
   - `story`: `title`, `slides[]` (4-8) berisi `{ visual, durationMs? }`
   - `reel`: `caption`, `scenes[]` (lihat bagian e)
   - `video`: `src` (`videos/<nama>.mp4` di `public/videos/`), `poster?`, `caption`
4. Opsional: `comments[]` (komentar netizen fiktif), `needsVerification: true`, `tags: ["kejutan"]` (kandidat kejutan harian).
5. Jalankan `npm run validate:content`. Pesan error menyebut file, id kartu, dan field yang salah.

## (c) Menambah tipe kartu baru

Contoh: tipe `timeline`.

1. `src/content/schema.ts`: tambah `'timeline'` ke `CARD_TYPES`, buat `timelineCard = z.strictObject({ ...cardBase, type: z.literal('timeline'), ... })`, masukkan ke `cardSchema`.
2. Jalankan `npx tsc -b`. Kompiler akan menunjukkan setiap `switch`/`Record` yang belum menangani tipe baru. Lengkapi:
   - `src/cards/CardView.tsx` (komponen medianya; buat di `src/cards/media/`),
   - `src/cards/coverVisual.ts` (`coverVisual` dan `cardSearchText`),
   - `src/content/lookup.ts` (`TYPE_LABELS`),
   - `src/features/review/ReviewPage.tsx` (`summary`) bila ringkasan default tidak cocok,
   - `tests/fixtures.ts` (`BODIES`).
3. `src/config/feed.ts`: beri bobot di `typeWeights` supaya tipe baru ikut dipilih feed; tambah ke `REVIEWABLE_TYPES` bila punya jawaban dan perlu jadwal ulang SM-2.
4. `src/domain/explore.ts`: masukkan ke salah satu `FORMAT_FILTERS`.
5. Tambah satu kartu contoh dan tes untuk aturan khususnya.

## (d) Menambah template visual baru

Contoh: template `tabel`.

1. `src/content/schema.ts`: buat `tabelVisual = z.strictObject({ ...visualBase, template: z.literal('tabel'), ... })` dan masukkan ke `visualSchema`.
2. Buat `src/visuals/templates/TabelTemplate.tsx`. Terima `TemplateProps<VisualOf<'tabel'>>` (`visual`, `palette`, `frame`). Gambar hanya dengan elemen SVG; tata letak dihitung dari `frame.w`/`frame.h` supaya bekerja di kanvas persegi (post) dan potret (story). Pakai `layoutText` + `SvgText` untuk teks, dan `Backdrop`/`Pill`/`Watermark` dari `templates/shared.tsx`.
3. `src/visuals/VisualView.tsx`: tambah `case 'tabel'` di `renderTemplate` dan di `visualAltText`.
4. Tes "render seluruh konten" otomatis mencakup template baru begitu ada kartu yang memakainya. Lihat hasilnya di peramban (`npm run dev`, buka Jelajah).

Menambah palet: tambah id di `PALETTE_IDS` (schema) dan entri di `src/visuals/palettes.ts`.
Menambah maskot: tambah id di `CHARACTER_IDS` (schema) dan entri di `MASCOTS` (`src/visuals/characters/mascots.tsx`), digambar di kotak 200x200 memakai `<Face>`.
Menambah ilustrasi: tambah nama di `ILLUSTRATION_SCENES` (schema) dan entri `SCENES` di `IllustrationTemplate.tsx`.

## (e) Menambah scene reel atau gerak baru

Menambah reel = menambah kartu `reel` dengan daftar `scenes`. Tiap scene:

```json
{
  "durationMs": 4200,
  "background": "gradient | solid | spotlight | stripes",
  "character": "owl | cat | gecko | kancil",
  "expression": "happy | shock | think | smug | sad",
  "characterMotion": "idle | bounce | enter-left | enter-right | nod",
  "kicker": "Label kecil",
  "text": "Teks kinetik besar (maks 110 karakter)",
  "textMotion": "words | pop | slide-up | type",
  "transition": "cut | fade | slide | zoom",
  "effect": "zoom | shake | confetti",
  "caption": "Caption berjalan sekaligus naskah narasi (maks 200 karakter)"
}
```

Hanya `durationMs`, `text`, dan `caption` yang wajib; sisanya punya default. Atur `durationMs` kira-kira 60 ms per karakter caption supaya sempat dibaca.

Menambah JENIS gerak/efek/latar baru:

1. `src/content/schema.ts`: tambah nilainya ke `TEXT_MOTIONS`, `CHARACTER_MOTIONS`, `SCENE_TRANSITIONS`, `SCENE_EFFECTS`, atau `SCENE_BACKGROUNDS`.
2. `src/reels/engine/motion.ts`: tangani nilai baru di fungsi yang bersangkutan (kompiler menandai `switch` yang belum lengkap). Gerak harus fungsi murni dari `localMs`: jangan memakai `Date.now()`, `Math.random()`, atau animasi CSS berbasis waktu.
3. Latar baru: `backgroundStyle` di `src/reels/SceneView.tsx`.
4. Tambah tes di `tests/reelEngine.test.ts` (keadaan awal, keadaan akhir netral).

## (f) Menjalankan generator konten

1. Siapkan bahan: salin teks resmi (peraturan.go.id, JDIH, Database Peraturan BPK) ke `content/sources/<nama>.md`, lengkap dengan URL dan tanggal pengambilan. Aturannya ada di `content/sources/README.md`.
2. Jalankan:

   ```bash
   ANTHROPIC_API_KEY=sk-ant-... npm run generate:cards -- --source <nama>.md --topic <topicId> --sub <subTopicId> --account <username> --count 6
   ```

   Model default `claude-fable-5-2`; ganti lewat env `CLAUDE_MODEL`.
3. Generator membuang kartu yang tidak lolos skema atau yang `source.quote`-nya tidak ditemukan persis di teks sumber, lalu menulis sisanya ke `content/cards/generated-<topik>-<waktu>.json` dengan status `draft`.
4. Baca tiap kartu, cocokkan dengan sumber, perbaiki bila perlu, lalu `npm run validate:content`. Setujui di aplikasi lewat Profil > Review.
5. Gaya humor dan larangan mengarang diatur di `scripts/generator-prompt.ts`.

Generator memanggil API berbayar dan tidak pernah dijalankan otomatis (tidak saat build, tidak saat tes).
