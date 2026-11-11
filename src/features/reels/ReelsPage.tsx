/** Tab Reels: video vertikal layar penuh, snap per item. Isinya reel dari rencana hari ini, lalu kartu penutup. */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { VideoMedia } from '@/cards/media/VideoMedia';
import { AccountAvatar } from '@/components/AccountAvatar';
import { Icon } from '@/components/Icon';
import { topicPaletteOf } from '@/content/lookup';
import { effectiveStatus } from '@/domain/moderation';
import { useInView } from '@/lib/useInView';
import { ReelPlayer } from '@/reels/ReelPlayer';
import { planReels, type PlanReel } from '@/state/selectors';
import { useActions, useStore } from '@/state/store';

function ReelSlide({ reel }: { reel: PlanReel }) {
  const { card, key } = reel;
  const [ref, inView] = useInView<HTMLElement>(0.7);
  const favorite = useStore((s) => s.favorites[card.id]);
  const draft = useStore((s) => effectiveStatus(card, s.moderation) !== 'approved');
  const { consumeItem, toggleFavorite } = useActions();

  useEffect(() => {
    if (inView) consumeItem(key, [card.id]);
  }, [inView, key, card.id, consumeItem]);

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
          <button type="button" className="grid h-12 w-12 place-items-center" aria-label={favorite?.liked ? 'Batal suka' : 'Suka (masuk Favorit)'} aria-pressed={favorite?.liked ?? false} onClick={() => toggleFavorite(card.id, 'liked')}>
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

export function ReelsPage() {
  const plan = useStore((s) => s.day?.plan);
  const reels = plan ? planReels(plan) : [];
  return (
    <div className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto bg-black">
      {reels.map((reel) => (
        <ReelSlide key={reel.key} reel={reel} />
      ))}
      <section className="grid h-full w-full shrink-0 snap-start place-items-center px-8 text-center text-white">
        <div>
          <h2 className="text-2xl font-black">{reels.length === 0 ? 'Belum ada reel hari ini' : 'Reels hari ini habis'}</h2>
          <p className="mt-2 text-sm opacity-80">Tidak ada putaran tanpa akhir di sini. Reel baru datang bersama feed besok.</p>
          <Link to="/jelajah" className="mt-5 inline-grid h-12 place-items-center rounded-xl bg-white px-5 font-bold text-black">
            Cari reel tertentu di Jelajah
          </Link>
        </div>
      </section>
    </div>
  );
}
