/**
 * Antrean tab Reels tanpa batas: reel dari rencana hari ini dulu, lalu seluruh pustaka reel yang diacak
 * per putaran. Pustaka reel kecil (puluhan), jadi daur ulang tak terhindarkan; yang dijaga hanyalah
 * reel yang sama tidak muncul lagi terlalu cepat.
 */
import { createRng, shuffle } from '@/lib/rng';

export interface QueuedReel {
  key: string;
  cardId: string;
  /** true = item rencana hari ini (dihitung ke target harian); false = tambahan dari pustaka. */
  fromPlan: boolean;
}

/** Jarak minimum (dalam item) sebelum reel yang sama boleh tampil lagi; dibatasi ukuran pustaka. */
export const REEL_REPEAT_GAP = 6;

export function reelQueue(planReels: readonly { key: string; cardId: string }[], libraryIds: readonly string[], length: number, seed: string): QueuedReel[] {
  const queue: QueuedReel[] = planReels.slice(0, length).map((reel) => ({ key: reel.key, cardId: reel.cardId, fromPlan: true }));
  if (libraryIds.length === 0) return queue;
  const gap = Math.min(REEL_REPEAT_GAP, libraryIds.length - 1);
  for (let round = 0; queue.length < length; round++) {
    const pending = shuffle(libraryIds, createRng(`${seed}:${round}`));
    while (pending.length > 0 && queue.length < length) {
      const recent = new Set(gap > 0 ? queue.slice(-gap).map((item) => item.cardId) : []);
      const index = pending.findIndex((id) => !recent.has(id));
      const [id] = pending.splice(Math.max(0, index), 1);
      if (id !== undefined) queue.push({ key: `x:${round}:${id}`, cardId: id, fromPlan: false });
    }
  }
  return queue;
}
