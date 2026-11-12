/** Tab Statistik di Profil: topik terlemah dan akurasi per sub-topik. */
import { library } from '@/content';
import { accuracyBySubTopic, weakestTopics } from '@/domain/stats';
import { useStore } from '@/state/store';

export function percent(ratio: number | null): string {
  return ratio === null ? 'belum ada' : `${Math.round(ratio * 100)}%`;
}

export function StatsPanel() {
  const progress = useStore((s) => s.progress);
  const weakest = weakestTopics(library.cards, progress)[0];
  const bySubTopic = accuracyBySubTopic(library.topics, library.cards, progress);

  return (
    <div className="space-y-4 px-4 pb-10 pt-4">
      <section aria-labelledby="weak-title" className="rounded-2xl bg-surface p-4">
        <h2 id="weak-title" className="text-sm font-bold">
          Topik terlemah
        </h2>
        <p className="mt-1 text-sm text-muted">
          {weakest
            ? `${library.topicById.get(weakest.topicId)?.name ?? weakest.topicId} (${percent(weakest.ratio)} benar). Feed otomatis memberi topik ini porsi lebih.`
            : 'Belum cukup jawaban untuk dinilai. Jawab beberapa kuis dulu.'}
        </p>
      </section>

      <section aria-labelledby="accuracy-title">
        <h2 id="accuracy-title" className="mb-2 text-sm font-bold">
          Akurasi per sub-topik
        </h2>
        <div className="space-y-2">
          {library.topics.map((topic) => (
            <details key={topic.id} className="rounded-xl bg-surface px-3 py-2">
              <summary className="flex min-h-11 cursor-pointer items-center text-xs font-bold uppercase tracking-wide text-muted">{topic.name}</summary>
              <ul className="mt-1.5 space-y-1.5 pb-1">
                {topic.subTopics.map((sub) => {
                  const accuracy = bySubTopic.find((a) => a.topicId === topic.id && a.subTopicId === sub.id);
                  const ratio = accuracy?.ratio ?? null;
                  return (
                    <li key={sub.id} className="text-sm">
                      <div className="flex justify-between gap-2">
                        <span>{sub.name}</span>
                        <span className="shrink-0 text-muted">{percent(ratio)}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raised" role="progressbar" aria-label={`Akurasi ${sub.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((ratio ?? 0) * 100)}>
                        <div className="h-full rounded-full bg-good" style={{ width: `${(ratio ?? 0) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
