# Mekanisme anti-doomscroll

Instasmart meniru rasa dan kekayaan media Instagram, bukan mekanisme adiktifnya. Dokumen ini mencatat apa yang dibangun, di mana kodenya, dan batas kemampuannya.

## Yang dibangun

| Mekanisme | Cara kerja | Kode |
| --- | --- | --- |
| Feed tanpa batas, isinya tetap materi | Paket pertama sepanjang target harian (default 20, bisa diatur 5-100); paket lanjutan 10 item dimuat otomatis saat ujung feed tinggal sekitar 2400px di bawah layar. Setelah seluruh pustaka tampil hari itu, kartu didaur ulang (kecuali 40 kartu terakhir) dengan label "Putaran ulang hari ini". | `src/domain/feedBuilder.ts` (`extendPlan`), `src/config/feed.ts`, `src/features/home/HomePage.tsx` |
| Penanda "Target harian tercapai" | Disisipkan setelah item ke-N (target): ringkasan, streak, topik terlemah, kejutan penutup. Tidak memblokir guliran. | `src/features/home/MilestonePanel.tsx` |
| Stories dan Reels berhingga | 3 story per hari; tab Reels hanya berisi reel dari rencana hari itu lalu kartu penutup. | `pickStories`, `src/features/reels/ReelsPage.tsx` |
| Tanpa metrik sosial | Tidak ada jumlah suka, pengikut, atau tayangan. Hati dan simpan hanya koleksi pribadi. Komentar adalah bagian statis kartu. | `src/components/PostShell.tsx` |
| Tanpa interupsi waktu | Tidak ada notifikasi, pengingat, atau timer sesi. Batas datang dari kuota, bukan dari jam. | (tidak ada kodenya, dan jangan ditambah) |
| Urutan untuk retensi | Kartu yang dijawab salah dijadwalkan ulang (SM-2) dan didahulukan; topik lemah diberi porsi lebih. | `src/domain/sm2.ts`, `feedBuilder.ts` |
| Variasi, bukan umpan tanpa henti | Tipe yang sama maksimal 2 kali berturut-turut; humor 1 dari tiap 4 item; reel, carousel, polling selalu hadir; satu kejutan per hari. | `src/config/feed.ts` |

### Kenapa feed sekarang tanpa batas

Versi awal memakai kuota keras 20 item dan "Tambah 5 item" berkonfirmasi (maks 2 paket). Pemilik repo memintanya dihapus (2026-11-11): aplikasi ini untuk dirinya sendiri, dan tujuannya justru menggantikan guliran tanpa henti di Instagram dengan guliran tanpa henti yang isinya materi belajar. Batas keras membuatnya kembali ke Instagram setelah 20 item. Prinsip lain (tanpa metrik sosial, tanpa notifikasi/timer, urutan untuk retensi) tetap berlaku.

Satu-satunya hal berbasis waktu adalah pemutaran konten itu sendiri: slide story berganti otomatis dan reel berjalan sesuai durasinya. Itu bukan timer sesi.

## Yang sengaja dibiarkan terbuka

Jelajah menampilkan seluruh pustaka tanpa kuota. Alasannya: mencari kartu tertentu adalah tindakan sengaja (seperti membuka buku), bukan guliran pasif, dan pustakanya berhingga. Kartu yang dibuka dari Jelajah tidak dihitung sebagai item feed.

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

Belum ada bukti bahwa rancangan ini benar-benar mengurangi doom-scrolling pada penggunanya; ini hipotesis desain yang masuk akal, belum hasil pengukuran. Streak, kejutan harian, dan feed tanpa batas adalah teknik keterlibatan juga; di sini dipakai supaya kebiasaan menggulir berpindah ke materi belajar. Apakah itu lebih baik daripada membatasi waktu layar belum diukur.
