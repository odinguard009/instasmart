/** Beranda: baris Stories + feed harian berhingga + layar Selesai. */
import { useEffect } from 'react';
import { CardView } from '@/cards/CardView';
import { library } from '@/content';
import { useInView } from '@/lib/useInView';
import type { FeedItem } from '@/state/schema';
import { itemCardIds, planStories } from '@/state/selectors';
import { useActions, useStore } from '@/state/store';
import { DonePanel } from './DonePanel';
import { StoryRow } from './StoryRow';
import { SurprisePost } from './SurprisePost';

/** Satu item feed. Begitu separuhnya terlihat, item dihitung "dilihat" dan memakai satu kuota. */
function FeedPost({ item }: { item: FeedItem }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.5);
  const { consumeItem } = useActions();

  useEffect(() => {
    if (inView) consumeItem(item.key, itemCardIds(item));
  }, [inView, item, consumeItem]);

  if (item.kind === 'surprise') {
    return (
      <div ref={ref}>
        <SurprisePost surprise={item.surprise} />
      </div>
    );
  }
  const card = library.cardById.get(item.cardId);
  if (!card) return null;
  return (
    <div ref={ref}>
      <CardView card={card} ribbon={item.isReview ? 'Ulang: waktunya mengingat lagi' : undefined} />
    </div>
  );
}

export function HomePage() {
  const day = useStore((s) => s.day);
  if (!day) return null;
  const total = day.plan.items.length;

  return (
    <div>
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-line bg-bg/95 px-4 backdrop-blur">
        <h1 className="text-xl font-black tracking-tight">Instasmart</h1>
        <p className="rounded-full bg-raised px-3 py-1 text-xs font-bold" aria-label={`${day.consumed.length} dari ${total} item hari ini sudah dilihat`}>
          {day.consumed.length}/{total} hari ini
        </p>
      </header>
      <StoryRow stories={planStories(day.plan)} />
      {total === 0 && (
        <p className="p-6 text-center text-sm text-muted">
          Tidak ada kartu yang bisa ditampilkan. Nyalakan "Tampilkan kartu yang belum diverifikasi" di Profil, atau setujui kartu di halaman Review.
        </p>
      )}
      {day.plan.items.map((item) => (
        <FeedPost key={item.key} item={item} />
      ))}
      <DonePanel day={day} />
    </div>
  );
}
