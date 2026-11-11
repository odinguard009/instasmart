# content/sources

Berkas `.md` di folder ini adalah bahan sumber untuk `scripts/generate-cards.ts` (generator kartu) dan
jejak dari mana fakta sebuah kartu berasal.

Aturan:

1. Isi hanya dengan teks yang benar-benar kamu ambil dari sumber resmi (peraturan.go.id, JDIH, Database
   Peraturan BPK, situs MK/MA), lengkap dengan URL dan tanggal pengambilan. Jangan menulis kutipan dari ingatan.
2. Satu berkas untuk satu peraturan atau satu tema. Nama berkas huruf kecil dengan tanda hubung.
3. Tandai jelas mana teks resmi dan mana ulasan (sumber sekunder).

Status saat fondasi dibuat (11 November 2026): situs peraturan.go.id, jdih.mahkamahagung.go.id, dan mkri.id
menolak akses otomatis dari lingkungan pembuat (koneksi diputus / HTTP 403). Yang berhasil diambil hanya
halaman metadata UU 20/2025 di Database Peraturan BPK dan satu artikel ulasan (lihat `kuhap-2025.md`).
Kartu topik lain ditulis dari pengetahuan pembuat, semuanya berstatus `draft`, dan WAJIB diverifikasi
terhadap teks resmi lewat halaman Review di aplikasi. Lihat `docs/DECISIONS.md`.
