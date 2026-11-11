/**
 * Kontrak data PENGGUNA (progres, favorit, pengaturan, rencana harian) yang disimpan lokal.
 * Dipakai untuk penyimpanan, export/import, dan sebagai sumber tipe modul domain.
 */
import { z } from 'zod';
import { FEED_CONFIG } from '@/config/feed';

const dateKey = z.iso.date();
const count = z.number().int().min(0);

export const sm2Schema = z.strictObject({
  repetitions: count,
  intervalDays: z.number().int().min(1),
  easeFactor: z.number().min(1.3),
  dueDate: dateKey,
});
export type Sm2State = z.infer<typeof sm2Schema>;

export const cardProgressSchema = z.strictObject({
  seenCount: count,
  lastSeen: dateKey.nullable(),
  correct: count,
  wrong: count,
  sm2: sm2Schema.optional(),
});
export type CardProgress = z.infer<typeof cardProgressSchema>;
export type ProgressMap = Record<string, CardProgress>;

export const THEMES = ['dark', 'light', 'system'] as const;
export const settingsSchema = z.strictObject({
  dailyQuota: z.number().int().min(FEED_CONFIG.minQuota).max(FEED_CONFIG.maxQuota),
  showUnverified: z.boolean(),
  theme: z.enum(THEMES),
  /** Narasi suara reel (Web Speech). Caption selalu tampil. */
  sound: z.boolean(),
});
export type Settings = z.infer<typeof settingsSchema>;

export const surpriseSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('unique-card'), cardId: z.string() }),
  z.strictObject({ type: z.literal('rapid-quiz'), cardIds: z.array(z.string()).min(1) }),
]);
export type Surprise = z.infer<typeof surpriseSchema>;

export const feedItemSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('card'), key: z.string(), cardId: z.string(), isReview: z.boolean() }),
  z.strictObject({ kind: z.literal('surprise'), key: z.string(), surprise: surpriseSchema }),
]);
export type FeedItem = z.infer<typeof feedItemSchema>;

export const dailyPlanSchema = z.strictObject({
  date: dateKey,
  items: z.array(feedItemSchema),
  storyIds: z.array(z.string()),
  /** Kartu "kejutan penutup" di layar Selesai (bonus, di luar kuota). */
  closingCardId: z.string().nullable(),
  extraBatches: count,
});
export type DailyPlan = z.infer<typeof dailyPlanSchema>;

export const dayStateSchema = z.strictObject({
  plan: dailyPlanSchema,
  /** key item feed yang sudah dilihat hari ini */
  consumed: z.array(z.string()),
  storiesSeen: z.array(z.string()),
  /** kunci jawaban (cardId atau cardId#slide) -> indeks pilihan / nilai ingat */
  answers: z.record(z.string(), z.number().int()),
  correct: count,
  wrong: count,
});
export type DayState = z.infer<typeof dayStateSchema>;

export const favoriteSchema = z.strictObject({ liked: z.boolean(), saved: z.boolean(), updatedAt: z.string() });
export type Favorite = z.infer<typeof favoriteSchema>;

export const moderationSchema = z.strictObject({
  /** Ditandai pengguna "sudah saya verifikasi" di halaman Review. */
  approved: z.boolean().optional(),
  reportedAt: z.string().optional(),
  reportNote: z.string().max(500).optional(),
});
export type Moderation = z.infer<typeof moderationSchema>;
export type ModerationMap = Record<string, Moderation>;

export const streakSchema = z.strictObject({ current: count, best: count, lastActiveDate: dateKey.nullable() });
export type Streak = z.infer<typeof streakSchema>;

export const historyEntrySchema = z.strictObject({ items: count, correct: count, wrong: count });

export const STATE_VERSION = 1;
export const userStateSchema = z.strictObject({
  version: z.literal(STATE_VERSION),
  settings: settingsSchema,
  progress: z.record(z.string(), cardProgressSchema),
  favorites: z.record(z.string(), favoriteSchema),
  moderation: z.record(z.string(), moderationSchema),
  streak: streakSchema,
  day: dayStateSchema.nullable(),
  history: z.record(dateKey, historyEntrySchema),
});
export type UserState = z.infer<typeof userStateSchema>;

export function createInitialState(): UserState {
  return {
    version: STATE_VERSION,
    settings: { dailyQuota: FEED_CONFIG.defaultQuota, showUnverified: true, theme: 'dark', sound: false },
    progress: {},
    favorites: {},
    moderation: {},
    streak: { current: 0, best: 0, lastActiveDate: null },
    day: null,
    history: {},
  };
}
