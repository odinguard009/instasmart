# Instasmart

Instasmart mengubah kebiasaan doom-scrolling menjadi smart-scrolling. Tampilannya seperti Instagram (feed foto, carousel, stories, reels, kuis, polling, komentar netizen), tetapi seluruh isinya materi belajar: ilmu hukum (persiapan seleksi calon hakim) dan persiapan SKD CPNS (TWK, TIU, TKP), dikemas dengan humor. Feed-nya tanpa batas, tetapi setiap item berisi materi yang dijadwalkan ulang dengan SM-2.

- PWA: bisa dipasang dari Chrome Android dan berjalan offline.
- Tanpa backend dan tanpa akun. Progres tersimpan di perangkat (localStorage) dan bisa diekspor/diimpor sebagai JSON.
- Konten berupa file JSON di repo ini, mudah ditambah.

> **Peringatan konten.** Semua kartu awal ditulis oleh model AI, berstatus `draft`, dan BELUM diverifikasi manusia. Sebagian besar ditulis dari pengetahuan model, bukan disalin dari teks resmi. Setiap kartu menampilkan lencana "Belum diverifikasi: cek sumbernya sebelum dihafal". Periksa dulu di halaman Review (Profil > Review & verifikasi kartu) sebelum mengandalkannya untuk ujian.

## Isi aplikasi

| Tab | Isi |
| --- | --- |
| Beranda | Baris Stories (3 per hari), feed tanpa batas (paket baru dimuat otomatis), penanda "Target harian tercapai" setelah 20 item (bisa diatur) |
| Jelajah | Grid seluruh pustaka, pencarian teks, filter kelompok (Ilmu Hukum / CPNS), format, dan topik |
| Reels | Reel hari ini, layar penuh, snap per item, lalu kartu penutup |
| Favorit | Koleksi pribadi (disukai/disimpan) per topik |
| Profil | Streak, statistik, akurasi per sub-topik, topik terlemah, pengaturan, cadangan JSON, pintu ke Review |

Topik awal: Hukum Perdata; Hukum Acara Perdata; Hukum Pidana (KUHP Nasional); Hukum Acara Pidana (KUHAP baru); Hukum Tata Negara & Konstitusi; Hukum Administrasi Negara & PTUN; Kode Etik dan Pedoman Perilaku Hakim; Wawasan Kebangsaan.

## Menjalankan di komputer

Butuh Node.js 22 atau lebih baru.

```bash
npm install
```

```bash
npm run dev
```

Buka http://localhost:5173/instasmart/. Perintah lain:

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

```bash
npm run preview
```

`preview` menyajikan hasil build di http://localhost:4173/instasmart/ (service worker dan mode offline hanya aktif di hasil build, bukan di `dev`).

## Deploy ke GitHub Pages

Workflow `.github/workflows/deploy.yml` menjalankan lint, tes, build, lalu deploy setiap ada push ke `main`. Yang perlu dilakukan sekali di GitHub:

1. Buka repo > **Settings** > **Pages**.
2. Pada **Build and deployment** > **Source**, pilih **GitHub Actions**.
3. Push ke `main` (atau buka tab **Actions** > "Build dan deploy ke GitHub Pages" > **Run workflow**).
4. Setelah selesai, aplikasi ada di `https://<username>.github.io/instasmart/`.

Nama repo harus `instasmart`, karena `base` Vite diset ke `/instasmart/` di `vite.config.ts`. Jika nama repo diganti, ubah konstanta `BASE` di file itu dan path ikon di `index.html`.

## Memasang di HP Android

1. Buka alamat GitHub Pages di atas dengan Chrome.
2. Ketuk menu tiga titik > **Tambahkan ke layar utama** / **Instal aplikasi**.
3. Buka Instasmart dari ikon di layar utama. Setelah dibuka sekali saat online, aplikasi bisa dipakai offline.

Pembaruan konten sampai ke HP setelah deploy baru dan aplikasi dibuka ulang saat online.

## Menambah topik dan kartu

- Topik: `content/topics.json`. Akun fiktif: `content/accounts.json`. Kartu: `content/cards/*.json`.
- Salin kartu bertipe sama sebagai pola, ubah isinya, lalu jalankan:

```bash
npm run validate:content
```

- Kartu tanpa `source` ditolak. Kartu baru selalu `status: "draft"`.
- Langkah lengkap (topik, kartu, tipe kartu baru, template visual, scene reel): [`docs/EXTENDING.md`](docs/EXTENDING.md).

## Generator kartu (opsional, berbayar)

Membuat kartu dari teks sumber di `content/sources/` memakai Anthropic API. Dijalankan manual, tidak pernah saat build.

```bash
ANTHROPIC_API_KEY=sk-ant-... npm run generate:cards -- --source kuhap-2025.md --topic acara-pidana --sub kuhap-baru --account saksi.cicak --count 6
```

- Model default `claude-fable-5-2`; ganti lewat env `CLAUDE_MODEL`.
- Tanpa `ANTHROPIC_API_KEY`, skrip berhenti dengan pesan yang jelas.
- Kartu hanya boleh berasal dari teks sumber, wajib membawa kutipan persis (`source.quote`), divalidasi skema, dan ditulis sebagai `draft` ke `content/cards/generated-*.json`.
- Hasilnya tetap harus dibaca dan diverifikasi manusia.

## Batasan media (jujur)

- **Reel adalah motion graphics, bukan video live-action.** Tiap reel berupa urutan scene (latar, maskot beranimasi, teks kinetik, transisi, konfeti) yang digambar langsung di aplikasi.
- **Narasi suara** memakai suara bawaan perangkat (Web Speech API, `id-ID`), defaultnya mati, dan mutunya tergantung HP. Caption selalu tampil. Tidak ada musik.
- **Gambar** adalah SVG buatan sendiri: template poster, infografis, meme, komik, dan empat maskot orisinal (Pak Hoot si burung hantu hakim, Mpus si kucing panitera, Cika si cicak saksi, Bang Kancil si advokat). Tidak ada gambar dari Instagram, Google Images, karakter/merek berhak cipta, atau wajah orang nyata.
- **Foto asli (opsional):** `npm run fetch:photos` mengambil foto bebas-lisensi dari Pexels bila `PEXELS_API_KEY` diset, dan kredit fotografer wajib tampil. Tanpa kunci, aplikasi tetap lengkap dengan visual SVG.
- **Video sendiri:** taruh MP4/WebM di `public/videos/`, lalu buat kartu `type: "video"` (`src`, `poster`, `caption`). Satu contoh sudah disertakan.
- **Render reel ke MP4 (opsional):** `npm run render:reels -- <id-kartu>` butuh Playwright dan ffmpeg; hasilnya tanpa audio.

## Instasmart tidak bisa memblokir Instagram

PWA tidak punya izin membatasi aplikasi lain. Pasangkan dengan batas waktu aplikasi di Digital Wellbeing Android. Penjelasan: [`docs/ANTI-DOOMSCROLL.md`](docs/ANTI-DOOMSCROLL.md).

## Dokumen lain

- [`CLAUDE.md`](CLAUDE.md): panduan untuk model/agen yang melanjutkan proyek.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): alur data dan peta modul.
- [`docs/DECISIONS.md`](docs/DECISIONS.md): keputusan yang diambil saat fondasi dibuat.
- [`ROADMAP.md`](ROADMAP.md): hal yang sengaja belum dikerjakan.
