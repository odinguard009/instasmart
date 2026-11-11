/** Turunan state + pustaka konten yang dipakai beberapa layar. */
import { library } from '@/content';
import type { Card, CardOf } from '@/content/schema';
import type { DailyPlan, FeedItem } from './schema';

function isCard(card: Card | undefined): card is Card {
  return card !== undefined;
}

/** Id kartu di balik satu item feed (kejutan tantangan cepat punya beberapa). */
export function itemCardIds(item: FeedItem): string[] {
  if (item.kind === 'card') return [item.cardId];
  return item.surprise.type === 'unique-card' ? [item.surprise.cardId] : item.surprise.cardIds;
}

export function cardsByIds(ids: readonly string[]): Card[] {
  return ids.map((id) => library.cardById.get(id)).filter(isCard);
}

export function planStories(plan: DailyPlan): CardOf<'story'>[] {
  return cardsByIds(plan.storyIds).filter((card): card is CardOf<'story'> => card.type === 'story');
}

export interface PlanReel {
  key: string;
  card: CardOf<'reel'> | CardOf<'video'>;
}

/** Reel/video dalam rencana hari ini, beserta key item feed-nya (untuk kuota). */
export function planReels(plan: DailyPlan): PlanReel[] {
  return plan.items.flatMap((item): PlanReel[] => {
    if (item.kind !== 'card') return [];
    const card = library.cardById.get(item.cardId);
    return card && (card.type === 'reel' || card.type === 'video') ? [{ key: item.key, card }] : [];
  });
}
