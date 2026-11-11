/** Favorit: koleksi pribadi (disukai/disimpan), dikelompokkan per topik. */
import { useState } from 'react';
import { CardThumb } from '@/components/CardThumb';
import { library } from '@/content';
import type { Favorite } from '@/state/schema';
import { useStore } from '@/state/store';

const FILTERS = {
  semua: { label: 'Semua', test: () => true },
  disukai: { label: 'Disukai', test: (favorite: Favorite) => favorite.liked },
  disimpan: { label: 'Disimpan', test: (favorite: Favorite) => favorite.saved },
} as const;
type Filter = keyof typeof FILTERS;

export function FavoritesPage() {
  const favorites = useStore((s) => s.favorites);
  const [filter, setFilter] = useState<Filter>('semua');
  const groups = library.topics
    .map((topic) => ({
      topic,
      cards: library.cards.filter((card) => {
        const favorite = favorites[card.id];
        return card.topicId === topic.id && favorite !== undefined && FILTERS[filter].test(favorite);
      }),
    }))
    .filter((group) => group.cards.length > 0);

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 px-3 pb-2 pt-3 backdrop-blur">
        <h1 className="text-xl font-black">Favorit</h1>
        <div className="mt-2 flex gap-2" role="group" aria-label="Filter favorit">
          {(Object.keys(FILTERS) as Filter[]).map((key) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={`h-11 rounded-full px-3.5 text-sm font-semibold ${filter === key ? 'bg-ink text-bg' : 'bg-raised'}`}>
              {FILTERS[key].label}
            </button>
          ))}
        </div>
      </header>
      {groups.length === 0 && (
        <p className="p-8 text-center text-sm text-muted">Belum ada favorit. Ketuk hati atau ikon simpan pada post untuk mengumpulkannya di sini. Koleksi ini hanya untukmu; tidak ada jumlah suka dari orang lain.</p>
      )}
      {groups.map(({ topic, cards }) => (
        <section key={topic.id} aria-label={topic.name}>
          <h2 className="px-3 pb-2 pt-4 text-sm font-bold">
            {topic.name} <span className="font-normal text-muted">· {cards.length}</span>
          </h2>
          <div className="grid grid-cols-3 gap-0.5">
            {cards.map((card) => (
              <CardThumb key={card.id} card={card} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
