/**
 * Halaman bantu untuk scripts/render-reels.ts: menampilkan SATU frame reel pada waktu tertentu.
 * URL: #/render/<id-kartu>?t=<milidetik>. Bukan bagian navigasi pengguna.
 */
import { useParams, useSearchParams } from 'react-router-dom';
import { library } from '@/content';
import { topicPaletteOf } from '@/content/lookup';
import { buildTimeline } from '@/reels/engine/timeline';
import { ReelStage } from '@/reels/ReelStage';

export function RenderPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const card = id ? library.cardById.get(id) : undefined;
  if (card?.type !== 'reel') return <p data-render-error>Reel tidak ditemukan: {id}</p>;
  const timeMs = Number(params.get('t') ?? 0);
  return (
    <div className="fixed inset-0 bg-black" data-render-ready data-total-ms={buildTimeline(card.scenes).totalMs}>
      <ReelStage card={card} timeMs={Number.isFinite(timeMs) ? timeMs : 0} topicPalette={topicPaletteOf(card)} />
    </div>
  );
}
