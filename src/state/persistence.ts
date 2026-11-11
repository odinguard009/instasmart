/**
 * Penyimpanan state pengguna di localStorage (satu kunci JSON, tervalidasi zod saat dimuat).
 * Antarmuka KeyValueStorage sengaja kecil agar mudah diganti (mis. IndexedDB) tanpa menyentuh store.
 */
import { createInitialState, userStateSchema, type UserState } from './schema';

export const STORAGE_KEY = 'instasmart:state:v1';
const CORRUPT_BACKUP_KEY = 'instasmart:state:rusak';

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Menghidupkan state tersimpan/diimpor secara toleran:
 * field baru yang belum ada di data lama diisi nilai default, dan rencana harian yang tak lagi valid dibuang
 * (akan dibangun ulang). Dengan begitu menambah field/pengaturan baru tidak menghapus progres pengguna.
 * Mengembalikan null jika data memang tidak bisa dipakai.
 */
export function reviveState(raw: unknown): UserState | null {
  if (!isRecord(raw)) return null;
  const defaults = createInitialState();
  const candidate = { ...defaults, ...raw, settings: { ...defaults.settings, ...(isRecord(raw.settings) ? raw.settings : {}) } };
  const full = userStateSchema.safeParse(candidate);
  if (full.success) return full.data;
  const withoutDay = userStateSchema.safeParse({ ...candidate, day: null });
  return withoutDay.success ? withoutDay.data : null;
}

export function loadState(storage: KeyValueStorage | undefined): UserState {
  const raw = storage?.getItem(STORAGE_KEY);
  if (!raw || !storage) return createInitialState();
  try {
    const revived = reviveState(JSON.parse(raw));
    if (revived) return revived;
  } catch {
    // jatuh ke penanganan data rusak di bawah
  }
  // Data rusak/versi asing: simpan salinannya supaya tidak hilang diam-diam, lalu mulai bersih.
  storage.setItem(CORRUPT_BACKUP_KEY, raw);
  return createInitialState();
}

export function saveState(storage: KeyValueStorage | undefined, state: UserState): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Gagal menyimpan progres ke penyimpanan lokal', error);
  }
}

export function browserStorage(): KeyValueStorage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
