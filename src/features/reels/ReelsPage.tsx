/**
 * Tab Reels: video vertikal layar penuh, snap per item. Tanpa batas (instruksi pemilik repo): reel dari rencana
 * hari ini dulu, lalu pustaka reel diacak dan didaur ulang (src/domain/reelQueue.ts).
 */
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { VideoMedia } from '@/cards/media/VideoMedia';
import { AccountAvatar } from '@/components/AccountAvatar';
import { Icon } from '@/components/Icon';
import { topicPaletteOf } from '@/content/lookup';
import { library } from '@/content';
import { effectiveStatus, eligibleCards } from '@/domain/moderation';
import { reelQueue, type QueuedReel } from '@/domain/reelQueue';
import { todayKey } from '@/lib/date';
import { useInView } from '@/lib/useInView';
import { ReelPlayer } from '@/reels/ReelPlayer';
import { planReels, type PlanReel } from '@/state/selectors';
import { useActions, useStore } from '@/state/store';

/** Jumlah reel yang ditambahkan ke antrean setiap kali mendekati ujung. */
const REELS_PAGE = 8;

function ReelSlide({ reel }: { reel: QueuedReel & { card: PlanReel['card'] } }) {
  const { card, key, fromPlan } = reel;
  const [ref, inView] = useInView<HTMLElement>(0.7);
  const favorite = useStore((s) => s.favorites[card.id]);
  const draft = useStore((s) => effectiveStatus(card, s.moderation) !== 'approved');
  const { consumeItem, viewCard, toggleFavorite } = useActions();

  useEffect(() => {
    if (!inView) return;
    // Hanya reel dari rencana hari ini yang dihitung ke target; reel tambahan cukup tercatat dilihat.
    if (fromPlan) consumeItem(key, [card.id]);
    else viewCard(card.id);
  }, [inView, fromPlan, key, card.id, consumeItem, viewCard]);

  return (
    <section ref={ref} className="relative h-full w-full shrink-0 snap-start snap-always bg-black" aria-label={`Reel dari ${card.account}`}>
      {card.type === 'reel' ? (
        <ReelPlayer card={card} topicPalette={topicPaletteOf(card)} active={inView} className="h-full w-full" />
      ) : (
        <VideoMedia card={card} active={inView} className="h-full w-full" />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-24 flex items-end gap-3 px-3 text-white">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <AccountAvatar card={card} className="h-8 w-8" />
            <p className="truncate text-sm font-bold drop-shadow">{card.account}</p>
          </div>
          <p className="mt-1 line-clamp-1 text-[11px] opacity-80">
            Sumber: {card.source.title}, {card.source.reference}
          </p>
          {draft && <p className="mt-0.5 text-[11px] font-bold text-amber-300">Belum diverifikasi: cek sumbernya sebelum dihafal.</p>}
        </div>
        <div className="pointer-events-auto flex flex-col items-center gap-1">
          <button type="button" className="grid h-12 w-12 place-items-center" aria-label={favorite?.liked ? 'Batal suka' : 'Suka (masuk koleksi Profil)'} aria-pressed={favorite?.liked ?? false} onClick={() => toggleFavorite(card.id, 'liked')}>
            <Icon name="heart" filled={favorite?.liked} className={`h-8 w-8 drop-shadow ${favorite?.liked ? 'text-red-500' : ''}`} />
          </button>
          <button type="button" className="grid h-12 w-12 place-items-center" aria-label={favorite?.saved ? 'Hapus dari simpanan' : 'Simpan'} aria-pressed={favorite?.saved ?? false} onClick={() => toggleFavorite(card.id, 'saved')}>
            <Icon name="bookmark" filled={favorite?.saved} className="h-7 w-7 drop-shadow" />
          </button>
          <button type="button" className="grid h-12 w-12 place-items-center" aria-label="Bagikan sebagai gambar" onClick={() => void import('@/lib/shareImage').then((m) => m.shareCardImage(card)).catch(() => undefined)}>
            <Icon name="share" className="h-7 w-7 drop-shadow" />
          </button>
        </div>
      </div>
    </section>
  );
}

/** Penanda dua slide sebelum ujung: memanjangkan antrean sebelum pengguna sampai di sana. */
function MoreReels({ onMore }: { onMore: () => void }) {
  const [ref, inView] = useInView<HTMLDivElement>(0);
  useEffect(() => {
    if (inView) onMore();
  }, [inView, onMore]);
  return <div ref={ref} aria-hidden className="h-px w-full shrink-0" />;
}

export function ReelsPage() {
  const plan = useStore((s) => s.day?.plan);
  const moderation = useStore((s) => s.moderation);
  const showUnverified = useStore((s) => s.settings.showUnverified);
  const [length, setLength] = useState(REELS_PAGE);
  const fromPlan = useMemo(() => (plan ? planReels(plan).map((reel) => ({ key: reel.key, cardId: reel.card.id })) : []), [plan]);
  const libraryIds = useMemo(() => eligibleCards(library.cards, moderation, showUnverified).filter((card) => card.type === 'reel' || card.type === 'video').map((card) => card.id), [moderation, showUnverified]);
  const queue = useMemo(
    () =>
      reelQueue(fromPlan, libraryIds, Math.max(length, fromPlan.length), `reels:${todayKey()}`).flatMap((item) => {
        const card = library.cardById.get(item.cardId);
        return card && (card.type === 'reel' || card.type === 'video') ? [{ ...item, card }] : [];
      }),
    [fromPlan, libraryIds, length],
  );

  return (
    <div className="relative h-full bg-black">
      <h1 className="pointer-events-none absolute left-4 top-5 z-10 text-xl font-black text-white drop-shadow">Reels</h1>
      <div className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto">
        {queue.map((reel, index) => (
          <Fragment key={reel.key}>
            {index === queue.length - 2 && <MoreReels key={`more-${queue.length}`} onMore={() => setLength(queue.length + REELS_PAGE)} />}
            <ReelSlide reel={reel} />
          </Fragment>
        ))}
        {queue.length === 0 && (
          <section className="grid h-full w-full place-items-center px-8 text-center text-white">
            <div>
              <h2 className="text-2xl font-black">Belum ada reel yang bisa ditampilkan</h2>
              <p className="mt-2 text-sm opacity-80">Nyalakan "Tampilkan kartu yang belum diverifikasi" di Profil, atau setujui reel di halaman Review.</p>
              <Link to="/profil" className="mt-5 inline-grid h-12 place-items-center rounded-xl bg-white px-5 font-bold text-black">
                Buka Profil
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
