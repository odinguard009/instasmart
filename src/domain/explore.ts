/** Filter dan pencarian Jelajah (murni). */
import { cardSearchText } from '@/cards/coverVisual';
import type { Card, CardType } from '@/content/schema';

/** Kelompok format untuk chip filter Jelajah. */
export const FORMAT_FILTERS = {
  semua: { label: 'Semua', types: null },
  foto: { label: 'Foto', types: ['fact', 'humor', 'mnemonic'] },
  carousel: { label: 'Carousel', types: ['carousel'] },
  reel: { label: 'Reel', types: ['reel', 'video'] },
  kuis: { label: 'Kuis', types: ['quiz', 'poll', 'review'] },
  story: { label: 'Story', types: ['story'] },
} as const satisfies Record<string, { label: string; types: readonly CardType[] | null }>;

export type FormatFilter = keyof typeof FORMAT_FILTERS;

export interface ExploreQuery {
  text: string;
  topicId: string | null;
  format: FormatFilter;
}

export function filterCards(cards: readonly Card[], query: ExploreQuery): Card[] {
  const words = query.text.toLowerCase().split(/\s+/).filter(Boolean);
  const types: readonly CardType[] | null = FORMAT_FILTERS[query.format].types;
  return cards.filter((card) => {
    if (query.topicId && card.topicId !== query.topicId) return false;
    if (types && !types.includes(card.type)) return false;
    if (words.length === 0) return true;
    const haystack = cardSearchText(card);
    return words.every((word) => haystack.includes(word));
  });
}

/** Jumlah tile yang dirender sekaligus; berikutnya ditambah saat ujung grid mendekat (merender 3000+ SVG sekaligus terasa macet). */
export const EXPLORE_PAGE_SIZE = 45;

/** Banyak tile yang ditampilkan setelah `pages` kali muat, tidak melebihi jumlah hasil. */
export function visibleCount(pages: number, total: number, pageSize = EXPLORE_PAGE_SIZE): number {
  return Math.min(total, Math.max(1, pages) * pageSize);
}

/** Jumlah filter non-default yang aktif, untuk lencana tombol Filter. */
export function activeFilterCount(query: { group: string | null; topicId: string | null }): number {
  return (query.group === null ? 0 : 1) + (query.topicId === null ? 0 : 1);
}
