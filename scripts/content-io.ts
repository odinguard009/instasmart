/** Membaca pustaka konten dari disk (untuk skrip Node; aplikasi memakai src/content/index.ts). */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseLibrary, type Library } from '../src/content/library';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const CONTENT_DIR = join(ROOT, 'content');
export const CARDS_DIR = join(CONTENT_DIR, 'cards');
export const SOURCES_DIR = join(CONTENT_DIR, 'sources');

export function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function loadLibraryFromDisk(): Library {
  const cardFiles = Object.fromEntries(
    readdirSync(CARDS_DIR)
      .filter((file) => file.endsWith('.json'))
      .map((file) => [file, readJson(join(CARDS_DIR, file))]),
  );
  return parseLibrary({ topics: readJson(join(CONTENT_DIR, 'topics.json')), accounts: readJson(join(CONTENT_DIR, 'accounts.json')), cardFiles });
}
