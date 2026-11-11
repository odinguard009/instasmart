/**
 * Pustaka konten yang dibundel ke aplikasi (bekerja offline).
 * Konten = file JSON statis di /content. Menambah file kartu baru di content/cards/ otomatis ikut termuat.
 */
import accounts from '../../content/accounts.json';
import topics from '../../content/topics.json';
import { parseLibrary, type Library } from './library';

const cardFiles = import.meta.glob<unknown>('../../content/cards/*.json', { eager: true, import: 'default' });

export const library: Library = parseLibrary({ topics, accounts, cardFiles });
