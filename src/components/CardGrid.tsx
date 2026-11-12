/** Grid 3 kolom ala galeri yang merender tile secara bertahap saat digulir. */
import { useEffect, useState } from 'react';
import type { Card } from '@/content/schema';
import { visibleCount } from '@/domain/explore';
import { useInView } from '@/lib/useInView';
import { CardThumb } from './CardThumb';

function MoreSentinel({ onMore }: { onMore: () => void }) {
  const [ref, inView] = useInView<HTMLDivElement>(0, '0px 0px 800px 0px');
  useEffect(() => {
    if (inView) onMore();
  }, [inView, onMore]);
  return <div ref={ref} aria-hidden className="h-px" />;
}

/** Ganti `resetKey` saat filter berubah supaya grid mulai lagi dari halaman pertama. */
export function CardGrid({ cards, resetKey = '' }: { cards: readonly Card[]; resetKey?: string }) {
  const [pages, setPages] = useState({ key: resetKey, count: 1 });
  const current = pages.key === resetKey ? pages.count : 1;
  const shown = visibleCount(current, cards.length);
  return (
    <>
      <div className="grid grid-cols-3 gap-0.5">
        {cards.slice(0, shown).map((card) => (
          <CardThumb key={card.id} card={card} />
        ))}
      </div>
      {shown < cards.length && <MoreSentinel key={`${resetKey}-${shown}`} onMore={() => setPages({ key: resetKey, count: current + 1 })} />}
    </>
  );
}
