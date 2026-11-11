# Keputusan yang diambil saat fondasi dibuat

Format: keputusan, lalu alasannya dalam satu baris. Tambahkan baris baru di bawah bila mengambil keputusan desain.

## Produk dan aturan feed

1. **Kuota harian menghitung item feed (post, reel, kejutan); story dihitung terpisah, 3 per hari.** Supaya kuota mudah dipahami dan baris Stories tetap terisi tanpa memakan jatah belajar.
2. **Reel muncul di feed Beranda (diputar di tempat) dan tab Reels hanya menampilkan reel dari rencana hari itu.** Agar tab Reels tidak menjadi guliran tanpa akhir; menonton di salah satu tempat memakai kuota yang sama.
3. **Tipe kartu `review` adalah flashcard ingat-kembali; "post ulang" SM-2 adalah penanda `isReview` pada item feed.** Dua hal berbeda: yang satu jenis konten, yang lain alasan sebuah kartu muncul lagi.
4. **"Format" untuk aturan variasi = tipe kartu.** Paling sederhana untuk dites: tidak ada tipe yang sama lebih dari 2 kali berturut-turut.
5. **"Tambah 5 item" dibatasi 2 paket per hari.** Permintaan tidak menyebut batas, tetapi tanpa batas feed bisa diperpanjang terus dan prinsip feed berhingga runtuh.
6. **Jelajah tidak dibatasi kuota.** Mencari kartu tertentu adalah tindakan sengaja dan pustakanya berhingga; lihat `docs/ANTI-DOOMSCROLL.md`.
7. **Perubahan kuota dan sakelar "belum diverifikasi" berlaku mulai rencana feed berikutnya.** Rencana hari ini sengaja stabil agar hitungan "x/20" tidak berubah di tengah hari.
8. **Narasi suara default mati.** Seperti Reels yang mulai tanpa suara, dan mutu suara perangkat tidak terjamin; caption selalu tampil.
9. **Pemutaran story/reel berbasis waktu tidak dianggap "timer sesi".** Itu durasi konten, bukan pembatas atau pengingat.
10. **Kartu yang dilaporkan salah langsung disembunyikan dari feed.** Lebih aman kehilangan satu kartu daripada menghafal yang salah.
11. **Nama pengguna tidak ditulis di aplikasi; profil memakai sebutan umum.** Repo bisa publik; data pribadi tidak perlu ada di kode.

## Teknis

12. **HashRouter, sehingga halaman review beralamat `#/review`.** GitHub Pages tidak punya fallback SPA; rute hash selalu bisa dimuat ulang dan dibuka offline.
13. **Data pengguna di `localStorage` (satu objek JSON tervalidasi), bukan IndexedDB.** Datanya kecil dan sinkron; antarmuka `KeyValueStorage` di `src/state/persistence.ts` memudahkan pindah nanti.
14. **Zustand untuk store, reducer murni untuk logika.** Store tipis; semua perubahan state bisa dites tanpa React.
15. **Versi dependensi mengikuti yang terbaru saat instalasi (React 19, Vite 8, TypeScript 6, zod 4, ESLint 10), dengan Tailwind 3.** Tailwind 3 dipilih karena konfigurasinya sederhana dan stabil dengan PostCSS.
16. **Font sistem, tanpa font web.** Bekerja offline, tanpa urusan lisensi, dan aman saat SVG diekspor menjadi PNG.
17. **"Bagikan sebagai gambar" membagikan visual sampul kartu (PNG 1080x1080).** Untuk kuis/reel/carousel, sampulnya dibuat otomatis dari isi kartu.
18. **Field `source.quote` ditambahkan ke skema.** Agar generator wajib membawa kutipan persis dan peninjau bisa membandingkannya di halaman Review.
19. **Generator memakai keluaran teks JSON yang divalidasi zod, bukan structured outputs.** Skema kartu berupa union besar; validasi sendiri lebih sederhana dan memberi pesan penolakan per kartu.
20. **Generator mengaktifkan fallback penolakan sisi server hanya untuk model `claude-fable-*`.** Parameter itu tidak berlaku untuk semua model yang bisa dipilih lewat `CLAUDE_MODEL`.
21. **State lama dimuat secara toleran (`reviveState`).** Field baru diisi default supaya pembaruan aplikasi tidak menghapus progres.
22. **Satu contoh kartu `video` disertakan, berisi hasil render reel "empat tujuan negara".** Supaya jalur file MP4 lokal benar-benar teruji; isinya memang duplikat reel dan boleh dihapus.

## Konten dan sumber

23. **Situs peraturan resmi tidak bisa diakses otomatis dari lingkungan pembuat.** `peraturan.go.id` memutus koneksi; `jdih.mahkamahagung.go.id` dan `mkri.id` menjawab HTTP 403. Yang berhasil diambil: halaman metadata UU 20/2025 di Database Peraturan BPK dan satu artikel ulasan di Dandapala (lihat `content/sources/kuhap-2025.md`).
24. **Karena itu sebagian besar kartu ditulis dari pengetahuan model, bukan dari teks resmi yang diunduh.** Semua berstatus `draft`; kartu yang nomor pasal atau versinya kurang pasti diberi `needsVerification: true` (44 dari 114).
25. **Semua kartu KUHAP baru diberi `needsVerification`.** Nomor pasalnya (230, 235, dan lainnya) berasal dari artikel ulasan, belum dicocokkan dengan teks UU.
26. **Kartu KUHP Nasional untuk Pasal 40, 53, 54, 79, dan 624 diberi `needsVerification`.** Penulis cukup yakin tetapi tidak dapat mencocokkannya dengan teks resmi; nilai kategori denda juga bisa berubah oleh aturan penyesuaian.
27. **Rumusan pasal di visual `quote` adalah inti norma, dan caption-nya mengatakan demikian.** Menghindari kesan kutipan verbatim padahal tidak diambil dari teks resmi.
28. **Kartu "versi lama" (mis. Pasal 184 KUHAP 1981) diberi label jelas.** Masih berguna untuk perbandingan dan perkara lama, tetapi tidak boleh tertukar dengan hukum yang berlaku.
29. **Komentar pada post adalah bagian statis kartu dan diberi keterangan "Komentar fiktif".** Supaya tidak dikira komentar orang sungguhan.

## Proses

30. **Tidak ada subagent yang dipakai.** Instruksi pemilik repo; dicatat juga di `CLAUDE.md`.
31. **Generator kartu dan skrip foto Pexels tidak dijalankan dengan kunci sungguhan.** Tidak ada kunci di lingkungan pembuat dan instruksinya melarang memanggil API saat membangun; yang diuji hanya jalur "tanpa kunci" dan pemeriksaan tipe.
32. **Commit dikirim ke `main` (sesuai permintaan pemilik) dan juga ke branch kerja sesi `claude/dreamy-clarke-jqsuk3`.** Lingkungan sesi menetapkan branch kerja sendiri; keduanya menunjuk commit yang sama, dan branch kerja boleh dihapus.
33. **Langkah deploy di CI bergantung pada pengaturan Pages di repo.** Workflow sudah benar secara sintaks, tetapi job `deploy` baru bisa berhasil setelah Settings > Pages > Source diset ke "GitHub Actions"; itu langkah manual pemilik repo (lihat README).

## Putaran 2 (2026-11-11)

34. **Feed tanpa batas menggantikan kuota keras.** Instruksi langsung pemilik repo ("hilangkan batas 20 per hari, ini untuk konsumsi pribadi dan mengatasi kebiasaan doomscrolling saya"). Tombol "Tambah 5 item" berkonfirmasi dan batas 2 paket dihapus; paket 10 item dimuat otomatis. Hanya ada satu mode (tanpa sakelar terbatas/tanpa batas) supaya jalur kode dan tes tidak berlipat.
35. **Target harian dipertahankan sebagai penanda, bukan batas.** `settings.dailyQuota` tetap dipakai (state lama tetap valid) untuk panjang paket pertama dan posisi panel "Target harian tercapai".
36. **Daur ulang kartu setelah pustaka habis.** Kartu yang sama tidak diulang dalam 40 item terakhir (`recycleWindow`, dipersempit ke separuh pustaka bila pustaka kecil). Kartu ulang mendapat `round` agar kunci React, item feed, dan jawaban kuis tidak bertabrakan; jawaban ulang tetap memperbarui akurasi dan SM-2.
37. **Topik diberi `group` (`hukum` / `cpns`).** Satu pustaka dan satu feed untuk dua tujuan belajar; kelompok hanya dipakai untuk filter Jelajah. Topik lama `kebangsaan` dipindah ke `cpns` karena isinya materi TWK.
38. **Soal TKP dimodelkan sebagai `quiz` dengan `scores` opsional, bukan tipe kartu baru.** Komponen, SM-2, dan statistik tetap satu jalur; `gradeChoice` memetakan skor 1-5 ke benar/salah (ambang 4) dan kualitas SM-2.
39. **Skor TKP adalah penilaian penulis, bukan kunci resmi.** Semua kartu TKP diberi `needsVerification` dan sumbernya menyebut "latihan buatan sendiri". Angka komposisi soal dan ambang batas SKD juga `needsVerification` karena ditetapkan ulang setiap seleksi.
40. **Jawaban soal hitungan TIU dihitung ulang dengan skrip sebelum ditulis.** Kesalahan kunci jawaban pada soal angka mudah terjadi dan merusak kepercayaan.
41. **Topik hukum baru yang terdampak UU Cipta Kerja (ketenagakerjaan, lingkungan, agraria, persaingan) ditulis pada tingkat konsep.** Rincian yang berubah lewat peraturan pelaksana diberi `needsVerification`.
42. **Empat palet baru (nila, mawar, zaitun, kopi).** Supaya 27 topik (saat itu) tetap bisa dibedakan secara visual.
43. **Urutan pilihan kuis diacak sekali di data (deterministik per id kartu), bukan saat render.** Sebelumnya 129 dari 187 kunci ada di posisi B sehingga jawaban bisa ditebak dari letaknya. Mengacak di data menjaga indeks jawaban yang tersimpan tetap bermakna; tes menjaga agar tidak ada posisi yang memegang 40% kunci atau lebih. Jawaban hari ini yang sudah tersimpan bisa menyorot pilihan yang berbeda satu kali.
44. **Pasal undang-undang khusus yang dicabut KUHP Nasional diberi label "versi lama".** Daftar pencabutan diambil dari Database Peraturan BPK (`content/sources/kuhp-2023-pencabutan.md`): antara lain Pasal 2 ayat (1), 3, 5, 11, 13 UU Tipikor; Pasal 2 ayat (1), 3-5 UU TPPU; Pasal 8, 9, 36-40 UU Pengadilan HAM; Pasal 111-126 UU Narkotika.
45. **Post memakai `content-visibility: auto`.** Uji gulir 500 post di Chromium headless menghasilkan sekitar 56 ribu elemen DOM dan heap 72-86 MB; di ponsel kelas bawah ini bisa berat. Virtualisasi penuh belum dibuat (lihat ROADMAP).
46. **Panjang pilihan kuis tidak boleh membocorkan kunci.** Pada 45% kuis (100% soal TKP) kunci adalah satu-satunya pilihan terpanjang. Pengecoh diperpanjang dan kunci dipadatkan langsung di JSON (bukan menjalankan ulang skrip penulis) sehingga turun ke sekitar 20%; tes menolak bila naik ke sepertiga atau lebih.
47. **Empat topik hukum baru (perundang-undangan, pemilu, pajak, siber & PDP) memakai ulang palet yang sudah ada.** Topik tetap dibedakan oleh nama, akun, dan filter; menambah palet baru tidak sebanding manfaatnya.
