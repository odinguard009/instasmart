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

export function loadState(storage: KeyValueStorage | undefined): UserState {
  const raw = storage?.getItem(STORAGE_KEY);
  if (!raw || !storage) return createInitialState();
  try {
    const parsed = userStateSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
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
