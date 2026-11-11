/**
 * Penjadwal ulang SM-2 (SuperMemo 2) sederhana. Fungsi murni.
 * quality: 0-5 (>= 3 dianggap ingat). Lihat SM2_QUALITY di config/feed.ts untuk pemetaan dari UI.
 */
import { addDays, type DateKey } from '@/lib/date';
import type { Sm2State } from '@/state/schema';

export const SM2_MIN_EASE = 1.3;
export const SM2_INITIAL_EASE = 2.5;

export function sm2Next(previous: Sm2State | undefined, quality: number, today: DateKey): Sm2State {
  const q = Math.min(5, Math.max(0, Math.round(quality)));
  const prev = previous ?? { repetitions: 0, intervalDays: 1, easeFactor: SM2_INITIAL_EASE, dueDate: today };
  const easeFactor = Math.max(SM2_MIN_EASE, prev.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  if (q < 3) {
    return { repetitions: 0, intervalDays: 1, easeFactor, dueDate: addDays(today, 1) };
  }
  const repetitions = prev.repetitions + 1;
  const intervalDays =
    repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.max(1, Math.round(prev.intervalDays * easeFactor));
  return { repetitions, intervalDays, easeFactor, dueDate: addDays(today, intervalDays) };
}

export function isDue(sm2: Sm2State | undefined, today: DateKey): boolean {
  return sm2 !== undefined && sm2.dueDate <= today;
}
