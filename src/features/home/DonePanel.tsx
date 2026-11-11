/** Layar "Selesai hari ini": ringkasan, streak, topik lemah, kejutan penutup, dan "tambah 5" yang butuh konfirmasi. */
import { useState } from 'react';
import { CardView } from '@/cards/CardView';
import { Icon } from '@/components/Icon';
import { FEED_CONFIG } from '@/config/feed';
import { library } from '@/content';
import { canExtend } from '@/domain/feedBuilder';
import { visibleStreak } from '@/domain/streak';
import { weakestTopics } from '@/domain/stats';
import { todayKey } from '@/lib/date';
import type { DayState } from '@/state/schema';
import { useActions, useStore } from '@/state/store';
import { CharacterSvg } from '@/visuals/characters/mascots';

export function DonePanel({ day }: { day: DayState }) {
  const streak = useStore((s) => visibleStreak(s.streak, todayKey()));
  const progress = useStore((s) => s.progress);
  const { extendDay } = useActions();
  const [confirming, setConfirming] = useState(false);
  const [closingOpen, setClosingOpen] = useState(false);

  const total = day.plan.items.length;
  const seen = day.consumed.length;
  const storiesLeft = day.plan.storyIds.filter((id) => !day.storiesSeen.includes(id)).length;
  const weakest = weakestTopics(library.cards, progress)[0];
  const weakestName = weakest && library.topicById.get(weakest.topicId)?.name;
  const closing = day.plan.closingCardId ? library.cardById.get(day.plan.closingCardId) : undefined;
  const extendable = canExtend(day.plan);

  return (
    <section className="px-4 pb-10 pt-8 text-center" aria-label="Selesai hari ini">
      <CharacterSvg id="owl" expression="happy" className="mx-auto h-28 w-28" />
      <h2 className="mt-2 text-2xl font-black">Selesai hari ini</h2>
      <p className="mt-1 text-sm text-muted">Feed-mu memang ada ujungnya. Sisanya biar otak yang mengendapkan.</p>

      <dl className="mt-5 grid grid-cols-3 gap-2 text-left">
        <div className="rounded-2xl bg-surface p-3">
          <dt className="text-xs text-muted">Item dilihat</dt>
          <dd className="text-xl font-black">
            {seen}/{total}
          </dd>
        </div>
        <div className="rounded-2xl bg-surface p-3">
          <dt className="text-xs text-muted">Jawaban benar</dt>
          <dd className="text-xl font-black">
            {day.correct}/{day.correct + day.wrong}
          </dd>
        </div>
        <div className="rounded-2xl bg-surface p-3">
          <dt className="flex items-center gap-1 text-xs text-muted">
            <Icon name="flame" className="h-3.5 w-3.5" /> Streak
          </dt>
          <dd className="text-xl font-black">{streak} hari</dd>
        </div>
      </dl>

      <div className="mt-3 space-y-1 text-sm text-muted">
        {weakestName && (
          <p>
            Topik yang paling perlu diulang: <span className="font-bold text-ink">{weakestName}</span> ({Math.round((weakest?.ratio ?? 0) * 100)}% benar).
          </p>
        )}
        {storiesLeft > 0 && <p>Masih ada {storiesLeft} story hari ini yang belum ditonton, di baris atas.</p>}
      </div>

      {closing && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-line text-left">
          {closingOpen ? (
            <CardView card={closing} ribbon="Kejutan penutup" />
          ) : (
            <button type="button" className="flex h-16 w-full items-center justify-center gap-2 bg-brand/15 font-bold text-brand" onClick={() => setClosingOpen(true)}>
              <Icon name="gift" className="h-5 w-5" /> Buka kejutan penutup
            </button>
          )}
        </div>
      )}

      <div className="mt-6">
        {!extendable ? (
          <p className="text-sm text-muted">Paket tambahan hari ini sudah habis. Sampai jumpa besok.</p>
        ) : confirming ? (
          <div className="rounded-2xl bg-surface p-4" role="alertdialog" aria-label="Konfirmasi tambah item">
            <p className="text-sm font-semibold">Yakin mau tambah {FEED_CONFIG.extraBatchSize} item? Kuota harian dibuat supaya belajarmu tidak berubah jadi scroll tanpa henti.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" className="h-12 flex-1 rounded-xl bg-raised font-bold" onClick={() => setConfirming(false)}>
                Cukup untuk hari ini
              </button>
              <button
                type="button"
                className="h-12 flex-1 rounded-xl bg-brand font-bold text-white"
                onClick={() => {
                  extendDay();
                  setConfirming(false);
                }}
              >
                Ya, tambah {FEED_CONFIG.extraBatchSize}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="h-12 rounded-xl px-4 text-sm font-semibold text-muted underline" onClick={() => setConfirming(true)}>
            Tambah {FEED_CONFIG.extraBatchSize} item
          </button>
        )}
      </div>
    </section>
  );
}
