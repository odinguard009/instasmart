# Arsitektur Instasmart

## Alur data

```
content/topics.json ─┐
content/accounts.json├─► src/content/library.ts ──► Library (cards, topics, accounts, peta id)
content/cards/*.json ┘     parseLibrary(): validasi zod per kartu + cek lintas kartu
                                │
                                ▼
      src/domain/moderation.ts  eligibleCards(): buang kartu dilaporkan; draft ikut pengaturan
                                │
                                ▼
      src/domain/feedBuilder.ts buildDailyPlan({cards, progress, today, quota})
                                │   1. kartu ulang SM-2 yang jatuh tempo (maks 30% kuota)
                                │   2. kejutan harian (1 slot)
                                │   3. humor (1 dari tiap 4 item)
                                │   4. slot belajar: minimum reel/carousel/polling, sisanya acak berbobot
                                │   5. susun: tidak ada tipe sama > 2 kali berturut; humor disebar
                                │   6. pilih 3 story + 1 kejutan penutup
                                ▼
      DailyPlan { date, items[], storyIds[], closingCardId, extraBatches }
                                │  disimpan di state.day.plan (stabil sepanjang hari)
                                ▼
      UI (src/features/*)  ──aksi──►  src/state/store.ts  ──►  src/state/reducers.ts (murni)
        HomePage: StoryRow + FeedPost + DonePanel               consumeItem, recordAnswer (→ sm2Next),
        ReelsPage, ExplorePage, FavoritesPage,                  toggleFavorite, setApproved, reportCard,
        ProfilePage, ReviewPage                                 updateSettings, extendDay, startDay
                                                                    │
                                                                    ▼
                                       src/state/persistence.ts ──► localStorage["instasmart:state:v1"]
                                       (reviveState: toleran terhadap field baru)
```

Besok paginya `startDay` melihat tanggal berganti dan membangun rencana baru dari progres terbaru: kartu yang dijawab salah kemarin jatuh tempo dan muncul sebagai "Ulang".

## Peta modul

| Modul | Isi | Murni? | Dites di |
| --- | --- | --- | --- |
| `src/content/schema.ts` | Skema zod kartu, visual, scene, topik, akun | ya | `tests/schema.test.ts` |
| `src/content/library.ts` | Rakit pustaka + cek id ganda/topik/akun | ya | `tests/schema.test.ts` |
| `src/config/feed.ts` | Semua angka aturan feed dan SM-2 | data | dipakai semua tes feed |
| `src/domain/feedBuilder.ts` | Rencana harian, paket tambahan, penyusun variasi | ya | `tests/feedBuilder.test.ts` |
| `src/domain/sm2.ts` | Penjadwal ulang SM-2 | ya | `tests/sm2.test.ts` |
| `src/domain/{streak,stats,moderation,explore}.ts` | Streak, akurasi, status verifikasi, filter Jelajah | ya | `tests/reducers.test.ts`, `tests/ui-logic.test.tsx` |
| `src/state/schema.ts` | Skema zod state pengguna | ya | `tests/reducers.test.ts` |
| `src/state/reducers.ts` | Semua perubahan state | ya | `tests/reducers.test.ts` |
| `src/state/store.ts` | Zustand: membungkus reducer + simpan otomatis | tidak | lewat smoke check |
| `src/reels/engine/*` | Timeline, mesin pemutar, gerak scene | ya | `tests/reelEngine.test.ts` |
| `src/visuals/*` | Template SVG, maskot, tata letak teks | ya (render) | `tests/ui-logic.test.tsx` (render semua konten) |
| `src/features/stories/storyNav.ts` | Navigasi story | ya | `tests/ui-logic.test.tsx` |
| `src/cards/CardView.tsx` | Pemetaan tipe kartu ke komponen media | komponen | smoke check |

## Keputusan utama dan alasannya

- **Satu skema, banyak pemakai.** `src/content/schema.ts` dipakai aplikasi, tes, validator, dan generator. Kartu yang lolos validasi dijamin bisa dirender, karena tes "render seluruh konten" merender setiap visual dan scene.
- **Visual sebagai data, bukan file gambar.** Kartu mendeklarasikan `visual: { template, ... }`; `VisualView` menggambarnya sebagai SVG deterministik. Akibatnya konten ringan, bebas masalah hak cipta, tajam di semua layar, bisa dibagikan sebagai PNG, dan bisa ditulis oleh model tanpa alat gambar.
- **Reel = fungsi dari waktu.** `SceneView(scene, localMs)` tidak punya timer. Jam hanya ada di `ReelPlayer` (requestAnimationFrame di atas `playerReducer`). Karena itu frame mana pun bisa dirender ulang persis: dasar `scripts/render-reels.ts` dan tes mesin.
- **Feed berhingga karena konstruksi.** Tidak ada "muat lagi": `DailyPlan.items` dibuat sekali sepanjang kuota. Perpanjangan hanya lewat `extendPlan` yang dibatasi `maxExtraBatchesPerDay`.
- **Deterministik.** RNG ber-seed tanggal (`src/lib/rng.ts`). Rencana hari yang sama selalu sama; tes bisa menguji 40 hari sekaligus.
- **State = satu objek JSON tervalidasi.** Export/import cukup serialisasi objek itu. `reviveState` mengisi field baru dengan default, sehingga menambah pengaturan tidak menghapus progres.
- **Moderasi lokal di atas konten statis.** Status efektif = status di file + tindakan pengguna (`state.moderation`). File konten tidak pernah diubah aplikasi.
- **HashRouter.** GitHub Pages tidak punya fallback SPA; rute berbasis hash (`#/review`) selalu bisa dimuat ulang dan dibuka offline.

## Batas-batas yang perlu diketahui

- Lebar huruf SVG diperkirakan dari jumlah karakter (`src/visuals/text.ts`), bukan diukur. Cukup akurat untuk font sistem tebal; teks yang sangat lebar bisa sedikit melewati margin.
- Narasi reel memakai suara bawaan perangkat (Web Speech API). Durasi ucapan tidak disinkronkan ke durasi scene; ucapan dipotong saat scene berganti.
- `localStorage` terbatas beberapa MB; state Instasmart berukuran kilobyte, jadi aman, tetapi data hilang bila pengguna menghapus data situs. Karena itu ada export/import.
