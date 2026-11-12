# CLAUDE.md

Panduan untuk model/agen yang melanjutkan proyek ini. Baca sampai habis sebelum mengubah apa pun.

## Aturan kerja dari pemilik repo (wajib)

- **Dilarang memakai subagent.** Jangan memanggil tool Agent/Task atau menjalankan agen lain dalam bentuk apa pun; kerjakan semuanya sendiri di sesi utama. (Instruksi langsung pemilik repo, 2026-11-11.)
- Selalu jujur: jangan mengarang, jangan mengklaim sesuatu sudah dites kalau belum dijalankan. Laporkan apa yang gagal atau belum diverifikasi apa adanya. Kurangi pujian yang tidak perlu.
- UI dan dokumentasi berbahasa Indonesia.

## Produk dalam satu paragraf

Instasmart adalah PWA (Android, offline) yang terasa seperti Instagram, tetapi seluruh isinya materi belajar: ilmu hukum (persiapan seleksi calon hakim) dan persiapan SKD CPNS (TWK, TIU, TKP): post foto, carousel, story, reel (motion graphics), kuis, polling, humor. Tujuannya mengganti doom-scrolling dengan smart-scrolling. Tanpa backend: konten = JSON statis di `content/`, data pengguna = `localStorage`.

## Prinsip anti-doomscroll (jangan dilanggar saat menambah fitur)

1. **Feed sengaja TANPA BATAS** (instruksi pemilik repo, 2026-11-11): aplikasi ini untuk pemakaian pribadi sebagai pengganti doom-scrolling, jadi paket lanjutan dimuat otomatis saat mendekati ujung feed, dan kartu didaur ulang setelah seluruh pustaka tampil. Jangan mengembalikan kuota keras atau tombol "Tambah 5 item" berkonfirmasi. Target harian (default 20) hanya penanda "target tercapai" yang tidak memblokir.
2. Tidak ada metrik sosial (jumlah suka, pengikut, dilihat). Hati dan simpan hanya koleksi pribadi.
3. Tidak ada notifikasi, pengingat, timer sesi, atau interupsi berbasis waktu.
4. Urutan konten mengoptimalkan retensi (SM-2) dan variasi, bukan lama pemakaian. Isi feed tetap materi belajar; jangan menambah konten tanpa muatan belajar.

Rincian: `docs/ANTI-DOOMSCROLL.md`.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan (http://localhost:5173/instasmart/) |
| `npm run build` | Typecheck (`tsc -b`) + build produksi ke `dist/` |
| `npm run preview` | Menyajikan `dist/` di http://localhost:4173/instasmart/ |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit test, tanpa peramban) |
| `npm run validate:content` | Validasi semua konten + hitung kartu per tipe/topik |
| `npm run smoke` | Cek peramban dengan Playwright terhadap `preview` (juga jalan di CI sebelum deploy) |
| `npm run icons` | Membuat ulang ikon PWA |
| `npm run generate:cards` | Generator kartu (butuh `ANTHROPIC_API_KEY`; manual) |
| `npm run fetch:photos` | Ambil foto Pexels (butuh `PEXELS_API_KEY`; opsional) |
| `npm run render:reels` | Render reel ke MP4 (butuh Playwright + ffmpeg; opsional) |

## Struktur folder

```
content/            Konten (sumber kebenaran): topics.json, accounts.json, cards/*.json, sources/*.md
src/content/        schema.ts (SATU-SATUNYA kontrak data konten), library.ts (rakit+validasi), index.ts, lookup.ts
src/config/feed.ts  SEMUA aturan dan bobot feed (kuota, rasio humor, variasi, SM-2)
src/domain/         Logika murni: feedBuilder, sm2, streak, stats, moderation, explore
src/state/          schema.ts (kontrak data pengguna), reducers.ts (murni), store.ts (zustand), persistence.ts, selectors.ts
src/visuals/        Mesin visual SVG: templates/, characters/ (maskot), palettes.ts, text.ts, VisualView.tsx
src/reels/          engine/ (timeline, player, motion: murni) + SceneView, ReelStage, ReelPlayer, useNarration
src/cards/          CardView.tsx (tipe kartu -> komponen), media/, coverVisual.ts
src/features/       Satu folder per layar: home, stories, reels, explore, profile (termasuk koleksi Disimpan/Disukai dan Pengaturan), review
src/components/     Komponen bersama (PostShell, BottomNav, Icon, ...)
src/lib/            Utilitas kecil (date, rng, useInView, shareImage)
scripts/            Skrip Node (tsx): validasi, ikon, generator, foto, render reel, smoke check
tests/              Unit test Vitest
docs/               ARCHITECTURE, EXTENDING, DECISIONS, ANTI-DOOMSCROLL
```

Alur data dan alasan desain: `docs/ARCHITECTURE.md`. Cara menambah topik/kartu/tipe/template/scene: `docs/EXTENDING.md`.

## Konvensi kode

- TypeScript `strict` + `noUncheckedIndexedAccess`. Tanpa `any`, tanpa `!` (non-null assertion), tanpa `// @ts-ignore`.
- Tipe data konten dan state diturunkan dari zod (`z.infer`). Jangan mendefinisikan ulang bentuknya di tempat lain.
- Logika bisnis = fungsi murni di `src/domain` atau `src/state/reducers.ts`, dan WAJIB punya tes. Komponen hanya menampilkan dan memanggil aksi store.
- Angka aturan feed hanya boleh ada di `src/config/feed.ts`.
- Satu file satu tanggung jawab; file kecil. Impor antar-modul memakai alias `@/`.
- Tanpa kode mati dan tanpa komentar "TODO". Pekerjaan yang ditunda dicatat di `ROADMAP.md`.
- Komentar dalam Bahasa Indonesia, menjelaskan "kenapa", bukan mengulang kode.
- Animasi reel harus tetap fungsi murni dari waktu (lihat `src/reels/engine/motion.ts`), supaya bisa dites dan dirender ulang.
- Aksesibilitas: tombol punya label, target tap minimal sekitar 44px, kontras cukup di tema gelap dan terang.
- Elemen `sr-only` (input tersembunyi) harus berada di dalam induk `relative`; kalau tidak, fokus padanya menggulir seluruh dokumen.

## Aturan akurasi konten (paling penting)

Pengguna menghafal isi kartu untuk ujian. Kartu yang salah lebih buruk daripada tidak ada kartu.

- **Jangan mengarang pasal.** Jangan menulis nomor pasal, nomor UU, atau isi norma kecuali yakin. Jika ragu: tulis konsepnya saja, isi `source.reference` dengan nama peraturan tanpa nomor pasal, dan set `needsVerification: true`.
- Setiap kartu wajib punya `source` (ditolak skema bila tidak ada). Humor wajib punya `teaches`.
- Semua kartu buatan model berstatus `draft`. **Jangan pernah menulis `status: "approved"`**; itu hak manusia setelah memeriksa sumber (lewat halaman Review atau dengan mengedit JSON sendiri).
- Lencana "Belum diverifikasi: cek sumbernya sebelum dihafal" pada kartu draft tidak boleh dihilangkan atau disamarkan.
- Peraturan berubah. KUHP Nasional (UU 1/2023) dan KUHAP baru (UU 20/2025) berlaku sejak 2 Januari 2026. Jangan menulis kartu pidana/acara pidana berdasarkan versi lama tanpa label "versi lama". Ragu versi mana yang berlaku: `needsVerification: true`.
- Kutipan di `content/sources/` hanya boleh berisi teks yang benar-benar diambil dari sumbernya, dengan URL dan tanggal.
- Humor tidak boleh mengubah atau menyesatkan isi hukum; tanpa SARA; tanpa menyerang orang/lembaga nyata.
- Media: hanya visual SVG buatan sendiri, maskot orisinal, atau foto berlisensi jelas dengan kredit (Pexels). Dilarang memakai gambar/video dari Instagram, Google Images, karakter/merek/logo berhak cipta, atau wajah orang nyata.

## Checklist sebelum commit

1. `npm run lint` lulus.
2. `npm test` lulus (termasuk validasi seluruh `content/cards/*.json`).
3. `npm run build` lulus.
4. Jika menyentuh UI: jalankan `npm run preview` lalu `npm run smoke`, dan lihat screenshot di `out/screenshots/`.
5. Jika menambah logika: ada tesnya. Jika menambah keputusan desain: catat satu baris di `docs/DECISIONS.md`.
6. Tidak ada kartu baru berstatus `approved`; kartu yang meragukan diberi `needsVerification`.
7. Pesan commit menjelaskan apa dan kenapa, dalam Bahasa Indonesia.
