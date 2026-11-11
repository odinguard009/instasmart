/**
 * Penanda "target harian tercapai" di tengah feed tanpa batas: ringkasan, streak, topik terlemah, kejutan penutup.
 * Tidak memblokir guliran; feed tetap berlanjut di bawahnya (permintaan pemilik repo, docs/DECISIONS.md).
 */
import { useState } from 'react';
import { CardView } from '@/cards/CardView';
import { Icon } from '@/components/Icon';
import { library } from '@/content';
import { visibleStreak } from '@/domain/streak';
import { weakestTopics } from '@/domain/stats';
import { todayKey } from '@/lib/date';
import type { DayState } from '@/state/schema';
import { useStore } from '@/state/store';
import { CharacterSvg } from '@/visuals/characters/mascots';

export function MilestonePanel({ day, target }: { day: DayState; target: number }) {
  const streak = useStore((s) => visibleStreak(s.streak, todayKey()));
  const progress = useStore((s) => s.progress);
  const [closingOpen, setClosingOpen] = useState(false);

  const storiesLeft = day.plan.storyIds.filter((id) => !day.storiesSeen.includes(id)).length;
  const weakest = weakestTopics(library.cards, progress)[0];
  const weakestName = weakest && library.topicById.get(weakest.topicId)?.name;
  const closing = day.plan.closingCardId ? library.cardById.get(day.plan.closingCardId) : undefined;

  return (
    <section className="border-y border-line px-4 pb-8 pt-6 text-center" aria-label="Target harian tercapai">
      <CharacterSvg id="owl" expression="happy" className="mx-auto h-24 w-24" />
      <h2 className="mt-2 text-2xl font-black">Target harian tercapai</h2>
      <p className="mt-1 text-sm text-muted">{target} item pertama hari ini sudah lewat. Lanjut menggulir kalau masih mau; feed di bawah ini tetap berisi materi.</p>

      <dl className="mt-5 grid grid-cols-3 gap-2 text-left">
        <div className="rounded-2xl bg-surface p-3">
          <dt className="text-xs text-muted">Item dilihat</dt>
          <dd className="text-xl font-black">{day.consumed.length}</dd>
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
    </section>
  );
}
