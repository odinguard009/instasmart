/**
 * Semua perubahan state pengguna sebagai fungsi murni: (state, argumen) -> state baru.
 * Store (store.ts) hanya membungkus fungsi-fungsi ini; logika jangan ditaruh di komponen.
 */
import { FEED_CONFIG } from '@/config/feed';
import type { Card } from '@/content/schema';
import { buildDailyPlan, extendPlan } from '@/domain/feedBuilder';
import { eligibleCards } from '@/domain/moderation';
import { sm2Next } from '@/domain/sm2';
import { bumpStreak } from '@/domain/streak';
import type { DateKey } from '@/lib/date';
import {
  userStateSchema,
  type CardProgress,
  type DayState,
  type Favorite,
  type Moderation,
  type Settings,
  type UserState,
} from './schema';

const EMPTY_PROGRESS: CardProgress = { seenCount: 0, lastSeen: null, correct: 0, wrong: 0 };

function patchProgress(state: UserState, cardId: string, patch: (p: CardProgress) => CardProgress): UserState['progress'] {
  return { ...state.progress, [cardId]: patch(state.progress[cardId] ?? EMPTY_PROGRESS) };
}

function patchHistory(state: UserState, today: DateKey, delta: { items?: number; correct?: number; wrong?: number }): UserState['history'] {
  const entry = state.history[today] ?? { items: 0, correct: 0, wrong: 0 };
  return {
    ...state.history,
    [today]: {
      items: entry.items + (delta.items ?? 0),
      correct: entry.correct + (delta.correct ?? 0),
      wrong: entry.wrong + (delta.wrong ?? 0),
    },
  };
}

function planInput(state: UserState, cards: readonly Card[], today: DateKey) {
  return {
    cards: eligibleCards(cards, state.moderation, state.settings.showUnverified),
    progress: state.progress,
    today,
    quota: state.settings.dailyQuota,
  };
}

/** Memastikan rencana hari ini ada. Hari berganti = rencana baru; hari yang sama = rencana tetap. */
export function startDay(state: UserState, cards: readonly Card[], today: DateKey): UserState {
  if (state.day?.plan.date === today) return state;
  const day: DayState = {
    plan: buildDailyPlan(planInput(state, cards, today)),
    consumed: [],
    storiesSeen: [],
    answers: {},
    correct: 0,
    wrong: 0,
  };
  return { ...state, day };
}

/** "Tambah 5 item" dari layar Selesai (dibatasi maxExtraBatchesPerDay). */
export function extendDay(state: UserState, cards: readonly Card[], today: DateKey): UserState {
  if (!state.day || state.day.plan.date !== today) return state;
  const plan = extendPlan(state.day.plan, planInput(state, cards, today));
  return plan === state.day.plan ? state : { ...state, day: { ...state.day, plan } };
}

function markSeen(state: UserState, cardIds: readonly string[], today: DateKey): UserState {
  let progress = state.progress;
  for (const cardId of cardIds) {
    progress = patchProgress({ ...state, progress }, cardId, (p) => ({ ...p, seenCount: p.seenCount + 1, lastSeen: today }));
  }
  return { ...state, progress, streak: bumpStreak(state.streak, today) };
}

/** Item feed terlihat di layar: memakan satu kuota (sekali saja per item). */
export function consumeItem(state: UserState, itemKey: string, cardIds: readonly string[], today: DateKey): UserState {
  const day = state.day;
  if (!day || day.consumed.includes(itemKey) || !day.plan.items.some((item) => item.key === itemKey)) return state;
  const seen = markSeen(state, cardIds, today);
  return { ...seen, day: { ...day, consumed: [...day.consumed, itemKey] }, history: patchHistory(seen, today, { items: 1 }) };
}

/** Kartu dibuka di luar feed (Jelajah/Favorit): tercatat dilihat, tidak memakan kuota. */
export function viewCard(state: UserState, cardId: string, today: DateKey): UserState {
  return markSeen(state, [cardId], today);
}

export function markStorySeen(state: UserState, storyId: string, today: DateKey): UserState {
  const seen = markSeen(state, [storyId], today);
  const day = seen.day;
  if (!day || day.storiesSeen.includes(storyId)) return seen;
  return { ...seen, day: { ...day, storiesSeen: [...day.storiesSeen, storyId] } };
}

export interface AnswerInput {
  /** Kunci unik jawaban: cardId, atau `cardId#indeksSlide` untuk kuis di dalam carousel. */
  answerKey: string;
  cardId: string;
  /** Indeks pilihan (kuis/polling) atau nilai ingat (flashcard). */
  selected: number;
  correct: boolean;
  /** Kualitas SM-2 (0-5). Kosongkan untuk jawaban yang tidak dijadwalkan ulang (slide kuis carousel). */
  quality?: number;
}

/** Mencatat jawaban sekali per hari per kunci, memperbarui akurasi dan (jika ada quality) jadwal SM-2. */
export function recordAnswer(state: UserState, input: AnswerInput, today: DateKey): UserState {
  if (state.day && input.answerKey in state.day.answers) return state;
  const progress = patchProgress(state, input.cardId, (p) => ({
    ...p,
    correct: p.correct + (input.correct ? 1 : 0),
    wrong: p.wrong + (input.correct ? 0 : 1),
    sm2: input.quality === undefined ? p.sm2 : sm2Next(p.sm2, input.quality, today),
  }));
  const delta = input.correct ? { correct: 1 } : { wrong: 1 };
  const day = state.day && {
    ...state.day,
    answers: { ...state.day.answers, [input.answerKey]: input.selected },
    correct: state.day.correct + (delta.correct ?? 0),
    wrong: state.day.wrong + (delta.wrong ?? 0),
  };
  return { ...state, progress, day, history: patchHistory(state, today, delta), streak: bumpStreak(state.streak, today) };
}

export function toggleFavorite(state: UserState, cardId: string, field: 'liked' | 'saved', now: string): UserState {
  const current: Favorite = state.favorites[cardId] ?? { liked: false, saved: false, updatedAt: now };
  const next: Favorite = { ...current, [field]: !current[field], updatedAt: now };
  const { [cardId]: _removed, ...others } = state.favorites;
  return { ...state, favorites: next.liked || next.saved ? { ...others, [cardId]: next } : others };
}

function patchModeration(state: UserState, cardId: string, patch: Moderation): UserState {
  return { ...state, moderation: { ...state.moderation, [cardId]: { ...state.moderation[cardId], ...patch } } };
}

export function setApproved(state: UserState, cardId: string, approved: boolean): UserState {
  return patchModeration(state, cardId, { approved });
}

/** "Lapor salah": kartu langsung disembunyikan dari feed sampai laporannya dicabut. */
export function reportCard(state: UserState, cardId: string, note: string, now: string): UserState {
  return patchModeration(state, cardId, { reportedAt: now, reportNote: note.trim() || undefined, approved: false });
}

export function clearReport(state: UserState, cardId: string): UserState {
  return patchModeration(state, cardId, { reportedAt: undefined, reportNote: undefined });
}

export function updateSettings(state: UserState, patch: Partial<Settings>): UserState {
  const dailyQuota = Math.min(FEED_CONFIG.maxQuota, Math.max(FEED_CONFIG.minQuota, patch.dailyQuota ?? state.settings.dailyQuota));
  return { ...state, settings: { ...state.settings, ...patch, dailyQuota } };
}

export type ImportResult = { ok: true; state: UserState } | { ok: false; error: string };

/** Memvalidasi teks JSON hasil export. State lama tidak disentuh jika gagal. */
export function parseImportedState(json: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: 'File bukan JSON yang valid.' };
  }
  const parsed = userStateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Isi file tidak cocok dengan format cadangan Instasmart.' };
  return { ok: true, state: parsed.data };
}
