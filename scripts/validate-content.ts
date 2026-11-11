/** Memvalidasi seluruh konten dan mencetak jumlah kartu per tipe, topik, dan status. Jalankan: npm run validate:content */
import { ContentError } from '../src/content/library';
import { loadLibraryFromDisk } from './content-io';

function tally<T>(items: readonly T[], keyOf: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) counts[keyOf(item)] = (counts[keyOf(item)] ?? 0) + 1;
  return counts;
}

try {
  const library = loadLibraryFromDisk();
  console.log(`Konten valid: ${library.cards.length} kartu, ${library.topics.length} topik, ${library.accounts.length} akun.`);
  console.log('Per tipe  :', tally(library.cards, (card) => card.type));
  console.log('Per topik :', tally(library.cards, (card) => card.topicId));
  console.log('Per status:', tally(library.cards, (card) => card.status));
  console.log('Perlu verifikasi khusus (needsVerification):', library.cards.filter((card) => card.needsVerification).length);
} catch (error) {
  if (error instanceof ContentError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}
