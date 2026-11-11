/** Pencarian kecil di atas pustaka konten yang sering dipakai UI. */
import { library } from './index';
import type { Account, Card, PaletteId, Topic } from './schema';

const FALLBACK_PALETTE: PaletteId = 'arang';

export function topicOf(card: Card): Topic | undefined {
  return library.topicById.get(card.topicId);
}

export function topicPaletteOf(card: Card): PaletteId {
  return topicOf(card)?.palette ?? FALLBACK_PALETTE;
}

export function subTopicName(card: Card): string {
  return topicOf(card)?.subTopics.find((sub) => sub.id === card.subTopicId)?.name ?? card.subTopicId;
}

export function accountOf(card: Card): Account | undefined {
  return library.accountByUsername.get(card.account);
}

/** Label tipe kartu dalam Bahasa Indonesia. */
export const TYPE_LABELS: Record<Card['type'], string> = {
  fact: 'Fakta',
  quiz: 'Kuis',
  humor: 'Humor',
  mnemonic: 'Jembatan keledai',
  carousel: 'Carousel',
  poll: 'Polling',
  reel: 'Reel',
  video: 'Video',
  story: 'Story',
  review: 'Ingat lagi',
};
