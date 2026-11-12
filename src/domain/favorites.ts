/** Koleksi pribadi (disukai/disimpan) untuk grid Profil. */
import type { Card } from '@/content/schema';
import type { Favorite } from '@/state/schema';

export type FavoriteField = 'liked' | 'saved';

/** Kartu yang ditandai `field`, terbaru dulu (seperti galeri tersimpan). Id yang tak ada di pustaka diabaikan. */
export function favoriteCards(cardById: ReadonlyMap<string, Card>, favorites: Readonly<Record<string, Favorite>>, field: FavoriteField): Card[] {
  return Object.entries(favorites)
    .filter(([, favorite]) => favorite[field])
    .sort(([, a], [, b]) => b.updatedAt.localeCompare(a.updatedAt))
    .flatMap(([id]) => {
      const card = cardById.get(id);
      return card ? [card] : [];
    });
}
