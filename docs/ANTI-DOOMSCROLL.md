# Mekanisme anti-doomscroll

Instasmart meniru rasa dan kekayaan media Instagram, bukan mekanisme adiktifnya. Dokumen ini mencatat apa yang dibangun, di mana kodenya, dan batas kemampuannya.

## Yang dibangun

| Mekanisme | Cara kerja | Kode |
| --- | --- | --- |
| Feed berhingga | Rencana harian dibuat sekali sepanjang kuota (default 20, bisa diatur 5-40). Tidak ada "muat lagi". | `src/domain/feedBuilder.ts`, `src/config/feed.ts` |
| Layar "Selesai hari ini" | Di ujung feed: ringkasan, streak, topik terlemah, dan kejutan penutup. Dibuat menyenangkan, bukan hukuman. | `src/features/home/DonePanel.tsx` |
| Tambah item berbiaya | "Tambah 5 item" butuh satu langkah konfirmasi, dan dibatasi 2 paket per hari. | `DonePanel.tsx`, `extendPlan` |
| Stories dan Reels berhingga | 3 story per hari; tab Reels hanya berisi reel dari rencana hari itu lalu kartu penutup. | `pickStories`, `src/features/reels/ReelsPage.tsx` |
| Tanpa metrik sosial | Tidak ada jumlah suka, pengikut, atau tayangan. Hati dan simpan hanya koleksi pribadi. Komentar adalah bagian statis kartu. | `src/components/PostShell.tsx` |
| Tanpa interupsi waktu | Tidak ada notifikasi, pengingat, atau timer sesi. Batas datang dari kuota, bukan dari jam. | (tidak ada kodenya, dan jangan ditambah) |
| Urutan untuk retensi | Kartu yang dijawab salah dijadwalkan ulang (SM-2) dan didahulukan; topik lemah diberi porsi lebih. | `src/domain/sm2.ts`, `feedBuilder.ts` |
| Variasi, bukan umpan tanpa henti | Tipe yang sama maksimal 2 kali berturut-turut; humor 1 dari tiap 4 item; reel, carousel, polling selalu hadir; satu kejutan per hari. | `src/config/feed.ts` |

Satu-satunya hal berbasis waktu adalah pemutaran konten itu sendiri: slide story berganti otomatis dan reel berjalan sesuai durasinya. Itu bukan timer sesi.

## Yang sengaja dibiarkan terbuka

Jelajah menampilkan seluruh pustaka tanpa kuota. Alasannya: mencari kartu tertentu adalah tindakan sengaja (seperti membuka buku), bukan guliran pasif, dan pustakanya berhingga. Kartu yang dibuka dari Jelajah tidak memakan kuota harian.

## Yang TIDAK bisa dilakukan Instasmart

**PWA tidak dapat memblokir atau membatasi Instagram.** Aplikasi web tidak punya izin untuk melihat, menutup, atau membatasi aplikasi lain di Android. Instasmart hanya bisa menjadi tempat yang lebih baik untuk menggulir; ia tidak bisa mencegah kamu membuka Instagram.

Pelengkap yang disarankan, memakai fitur bawaan Android:

1. Buka **Setelan** > **Kesejahteraan Digital & kontrol orang tua** (Digital Wellbeing).
2. Ketuk **Dasbor**, pilih **Instagram**.
3. Atur **Timer aplikasi**, misalnya 15 menit per hari. Setelah habis, ikon Instagram dinonaktifkan sampai besok.
4. Pertimbangkan **Mode Fokus** pada jam belajar, dan letakkan ikon Instasmart di tempat ikon Instagram biasanya berada.

Nama menu bisa sedikit berbeda antar merek HP.

Pemblokiran sungguhan (misalnya Instagram baru terbuka setelah kuota Instasmart selesai) membutuhkan aplikasi Android native dengan izin statistik pemakaian atau aksesibilitas. Itu dicatat sebagai fase lanjutan di `ROADMAP.md` dan tidak dikerjakan sekarang.

## Catatan kejujuran

Belum ada bukti bahwa rancangan ini benar-benar mengurangi doom-scrolling pada penggunanya; ini hipotesis desain yang masuk akal, belum hasil pengukuran. Streak dan kejutan harian adalah teknik keterlibatan juga; di sini dipakai untuk kebiasaan belajar dan dibatasi kuota.
