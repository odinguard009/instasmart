/** Kunci tanggal lokal "YYYY-MM-DD". Semua logika harian memakai kunci ini, bukan objek Date. */
export type DateKey = string;

export function toDateKey(date: Date): DateKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(): DateKey {
  return toDateKey(new Date());
}

function toUtcMs(key: DateKey): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

const DAY_MS = 86_400_000;

export function addDays(key: DateKey, days: number): DateKey {
  return new Date(toUtcMs(key) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Selisih hari b - a (positif jika b setelah a). */
export function diffDays(a: DateKey, b: DateKey): number {
  return Math.round((toUtcMs(b) - toUtcMs(a)) / DAY_MS);
}
