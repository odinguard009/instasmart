/** RNG deterministik berbasis seed teks, supaya rencana harian bisa direproduksi dan dites. */
export type Rng = () => number;

function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/** mulberry32: menghasilkan angka [0, 1). */
export function createRng(seed: string): Rng {
  let a = hashSeed(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i] as T;
    out[i] = out[j] as T;
    out[j] = a;
  }
  return out;
}

/** Memilih satu kunci secara acak sebanding bobotnya. Mengembalikan undefined jika total bobot 0. */
export function weightedPick<K>(entries: readonly (readonly [K, number])[], rng: Rng): K | undefined {
  const total = entries.reduce((sum, [, w]) => sum + Math.max(0, w), 0);
  if (total <= 0) return undefined;
  let roll = rng() * total;
  for (const [key, weight] of entries) {
    roll -= Math.max(0, weight);
    if (roll < 0) return key;
  }
  return entries[entries.length - 1]?.[0];
}
