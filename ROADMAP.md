# Roadmap

Hal-hal di bawah ini sengaja BELUM dikerjakan. Urutannya kira-kira dari yang paling bernilai.

## Segera berguna (masih PWA)

- **Verifikasi konten oleh manusia.** Semua kartu masih `draft`. Cocokkan dengan teks resmi, lalu ubah `status` menjadi `approved` di JSON (atau setujui lewat halaman Review). Prioritas: 290 dari 759 kartu bertanda `needsVerification`.
- **Kutipan teks resmi di `content/sources/`.** Saat fondasi dibuat, situs peraturan resmi menolak akses otomatis. Isi folder ini dengan teks pasal yang disalin dari sumber resmi, lalu pakai generator.
- **Lebih banyak kartu per sub-topik.** Pustaka sekarang 759 kartu di 33 topik; banyak topik baru baru berisi 8-16 kartu. Feed tanpa batas akan mendaur ulang kartu lebih cepat untuk topik tipis.
- **Peta cakupan (jujur).** Belum "seluruh ilmu hukum". Sudah ada: pengantar ilmu hukum, HTN, HAN/PTUN, perdata, acara perdata, pidana, acara pidana, pidana khusus, peradilan anak, peradilan militer, peradilan agama, keluarga & waris, dagang/bisnis, internasional, HAM, agraria, ketenagakerjaan, lingkungan, adat, HKI, konsumen & persaingan, etika hakim, ilmu perundang-undangan, pemilu, pajak, siber & PDP, perbankan & pasar modal, hukum kesehatan (enam terakhir masih tipis, 10-17 kartu). Acara pidana KUHAP baru: praperadilan, upaya paksa, keadilan restoratif, dan DPA ditulis dari artikel ulasan (`content/sources/kuhap-2025-praperadilan-rj-dpa.md`), belum dari teks UU; pengakuan bersalah (plea bargain) dan sidang DPA menurut SEMA 1/2026 ditulis dari berita Hukumonline (`content/sources/sema-1-2026-plea-dpa.md`), teks SEMA belum dibaca langsung; upaya hukum atas putusan bebas ditulis sebagai perdebatan dari artikel MARINews dan kolom Hukumonline (`content/sources/kuhap-2025-upaya-hukum-putusan-bebas.md`), nomor pasal belum dicocokkan dengan teks UU; saksi mahkota ditulis dari kolom Hukumonline dan artikel MARINews (`content/sources/kuhap-2025-saksi-mahkota.md`), nomor pasal juga belum dicocokkan. Belum: hukum laut lebih dalam, teknik perancangan peraturan, yurisprudensi pilihan, SEMA/PERMA selain SEMA 1/2026.
- **CPNS: TIU figural** (soal gambar/pola bangun) belum ada karena belum ada template visual yang cocok. TIU dan TKP masih sedikit soal per sub-topik.
- **Ekspor status review.** Persetujuan di halaman Review tersimpan lokal; belum ada cara menuliskannya kembali ke file JSON repo selain mengedit manual.
- **Pengukur lebar teks sungguhan** untuk template SVG (sekarang perkiraan per karakter).
- **Sinkron narasi dengan scene** (durasi scene mengikuti lama ucapan) dan pilihan suara.
- **Virtualisasi feed** bila pemakaian sangat panjang (ratusan post) terasa berat di ponsel; sekarang hanya `content-visibility: auto`.
- **Tes komponen di peramban** sebagai bagian CI (sekarang `npm run smoke` dijalankan manual).

## Fase lanjutan

- **Aplikasi Android native dengan pembatasan aplikasi.** Membungkus PWA (Trusted Web Activity atau Capacitor) dan menambah modul native yang memakai izin statistik pemakaian/aksesibilitas, supaya Instagram bisa dibatasi atau baru terbuka setelah kuota belajar selesai. Ini satu-satunya jalan untuk pemblokiran sungguhan.
- **Render MP4 otomatis.** `scripts/render-reels.ts` sudah bisa merender satu reel secara manual. Lanjutannya: render semua reel di CI, tambah audio narasi (TTS yang lisensinya jelas), dan pakai hasilnya sebagai kartu `video`.
- **Sinkronisasi antar perangkat.** Sekarang hanya export/import JSON manual. Pilihan: berkas di penyimpanan awan milik pengguna, atau backend kecil dengan akun.
- **Paket konten terpisah dari aplikasi**, supaya kartu bisa diperbarui tanpa build ulang.
- **Statistik retensi** (kurva lupa per topik, prediksi kesiapan ujian).
