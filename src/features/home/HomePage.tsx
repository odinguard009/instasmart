/** Beranda: baris Stories + feed tanpa batas (paket lanjutan dimuat otomatis) + penanda target harian. */
import { Fragment, useEffect } from 'react';
import { CardView } from '@/cards/CardView';
import { FEED_CONFIG } from '@/config/feed';
import { library } from '@/content';
import { useInView } from '@/lib/useInView';
import type { FeedItem } from '@/state/schema';
import { itemCardIds, planStories } from '@/state/selectors';
import { useActions, useStore } from '@/state/store';
import { MilestonePanel } from './MilestonePanel';
import { StoryRow } from './StoryRow';
import { SurprisePost } from './SurprisePost';

/** Satu item feed. Begitu separuhnya terlihat, item dihitung "dilihat". */
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
  const ribbon = item.isReview ? 'Ulang: waktunya mengingat lagi' : item.round ? 'Putaran ulang hari ini' : undefined;
  return (
    <div ref={ref}>
      <CardView card={card} ribbon={ribbon} round={item.round} />
    </div>
  );
}

/**
 * Penanda tak terlihat di ujung feed; terpicu saat ujung tinggal `autoExtendMarginPx` di bawah layar
 * (juga saat pengguna melompat langsung ke bawah). Di-remount (key = panjang feed) setiap kali feed bertambah;
 * jika paket kosong, panjang tidak berubah sehingga penanda tidak memicu ulang tanpa henti.
 */
function ExtendSentinel() {
  const [ref, inView] = useInView<HTMLDivElement>(0, `0px 0px ${FEED_CONFIG.autoExtendMarginPx}px 0px`);
  const { extendDay } = useActions();
  useEffect(() => {
    if (inView) extendDay();
  }, [inView, extendDay]);
  return <div ref={ref} aria-hidden className="h-px" />;
}

export function HomePage() {
  const day = useStore((s) => s.day);
  const target = useStore((s) => s.settings.dailyQuota);
  if (!day) return null;
  const items = day.plan.items;
  const total = items.length;
  const reached = day.consumed.length >= target;

  return (
    <div>
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-line bg-bg/95 px-4 backdrop-blur">
        <h1 className="text-xl font-black tracking-tight">Instasmart</h1>
        <p className="rounded-full bg-raised px-3 py-1 text-xs font-bold" aria-label={`${day.consumed.length} item dilihat hari ini, target ${target}`}>
          {reached ? `${day.consumed.length} item hari ini` : `${day.consumed.length}/${target} target`}
        </p>
      </header>
      <StoryRow stories={planStories(day.plan)} />
      {total === 0 && (
        <p className="p-6 text-center text-sm text-muted">
          Tidak ada kartu yang bisa ditampilkan. Nyalakan "Tampilkan kartu yang belum diverifikasi" di Profil, atau setujui kartu di halaman Review.
        </p>
      )}
      {items.map((item, index) => (
        <Fragment key={item.key}>
          {index === target && <MilestonePanel day={day} target={target} />}
          <FeedPost item={item} />
        </Fragment>
      ))}
      {total > 0 && <ExtendSentinel key={`ext-${total}`} />}
      {total > 0 && (
        <p className="px-4 pb-10 pt-6 text-center text-sm text-muted" role="status">
          Memuat kartu berikutnya…
        </p>
      )}
    </div>
  );
}
