/**
 * SEMUA aturan dan bobot pembangun feed ada di file ini.
 * Ubah angka di sini untuk menyetel variasi, kuota, dan porsi review; jangan menyebar angka ke modul lain.
 */
import type { CardType } from '@/content/schema';

export interface FeedConfig {
  /**
   * Target harian = panjang paket pertama feed dan titik "target tercapai" (bisa diubah di Profil).
   * Feed tidak berhenti di sini: pemilik repo meminta feed tanpa batas (lihat docs/DECISIONS.md).
   */
  defaultQuota: number;
  minQuota: number;
  maxQuota: number;
  /** Ukuran satu paket lanjutan yang dimuat otomatis saat pengguna mendekati ujung feed. */
  extraBatchSize: number;
  /** Paket lanjutan dimuat saat ujung feed tinggal sejauh ini (px) di bawah layar. */
  autoExtendMarginPx: number;
  /** Saat seluruh pustaka sudah tampil hari itu, kartu boleh diulang kecuali N kartu terakhir yang tampil. */
  recycleWindow: number;
  /** Story per hari (di baris Stories, di luar kuota feed). */
  storiesPerDay: number;
  /** Tidak boleh tipe yang sama lebih dari N kali berturut-turut. */
  maxSameTypeRun: number;
  /** 1 humor tiap N item feed (4 = 1 humor per 3 item belajar). */
  humorEvery: number;
  /** Porsi maksimum kuota untuk kartu ulang (SM-2) yang jatuh tempo. */
  maxReviewShare: number;
  /** Jumlah minimum per hari untuk format "kaya" (jika stok ada), agar selalu berselang. */
  minPerDay: Partial<Record<CardType, number>>;
  /** Bobot acak tipe untuk slot belajar yang tersisa. */
  typeWeights: Partial<Record<CardType, number>>;
  /** Kuota minimum agar "kejutan harian" disisipkan. */
  surpriseMinQuota: number;
  /** Jumlah soal pada kejutan "tantangan cepat". */
  rapidQuizSize: number;
  /** Posisi relatif kejutan di feed (0..1). */
  surprisePosition: number;
}

export const FEED_CONFIG: FeedConfig = {
  defaultQuota: 20,
  minQuota: 5,
  maxQuota: 100,
  extraBatchSize: 10,
  autoExtendMarginPx: 2400,
  recycleWindow: 40,
  storiesPerDay: 3,
  maxSameTypeRun: 2,
  humorEvery: 4,
  maxReviewShare: 0.3,
  minPerDay: { reel: 2, carousel: 2, poll: 1 },
  typeWeights: { quiz: 4, fact: 3, reel: 2, carousel: 2, mnemonic: 1.5, poll: 1, review: 1.5, video: 1 },
  surpriseMinQuota: 8,
  rapidQuizSize: 3,
  surprisePosition: 0.6,
};

/** Tipe yang punya jawaban dan dijadwalkan ulang dengan SM-2. */
export const REVIEWABLE_TYPES: readonly CardType[] = ['quiz', 'poll', 'review'];

/** Kualitas SM-2 (0-5) untuk tiap hasil. */
export const SM2_QUALITY = {
  quizCorrect: 4,
  quizWrong: 1,
  recallForgot: 1,
  recallHard: 3,
  recallEasy: 5,
} as const;

/** Soal TKP (skor 1-5 per pilihan): skor minimal yang dihitung "benar" dan kualitas SM-2 per skor. */
export const TKP_GRADING = {
  passScore: 4,
  qualityByScore: { 5: 4, 4: 3, 3: 2, 2: 1, 1: 0 } as Record<number, number>,
} as const;

/** Durasi default satu slide story (ms). */
export const STORY_SLIDE_MS = 6000;
