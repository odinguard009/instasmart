import { diffDays, type DateKey } from '@/lib/date';
import type { Streak } from '@/state/schema';

/** Hari dihitung aktif begitu ada satu item dilihat. Bolong sehari = streak mulai lagi dari 1. */
export function bumpStreak(streak: Streak, today: DateKey): Streak {
  if (streak.lastActiveDate === today) return streak;
  const continues = streak.lastActiveDate !== null && diffDays(streak.lastActiveDate, today) === 1;
  const current = continues ? streak.current + 1 : 1;
  return { current, best: Math.max(streak.best, current), lastActiveDate: today };
}

/** Streak yang ditampilkan: 0 jika hari terakhir aktif sudah lebih dari kemarin. */
export function visibleStreak(streak: Streak, today: DateKey): number {
  if (streak.lastActiveDate === null) return 0;
  return diffDays(streak.lastActiveDate, today) <= 1 ? streak.current : 0;
}
