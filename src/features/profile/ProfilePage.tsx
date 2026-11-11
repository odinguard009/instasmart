/** Profil: streak, statistik, akurasi per sub-topik, topik terlemah, pengaturan, cadangan. */
import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { library } from '@/content';
import { accuracyBySubTopic, totals, weakestTopics } from '@/domain/stats';
import { visibleStreak } from '@/domain/streak';
import { todayKey } from '@/lib/date';
import { useStore } from '@/state/store';
import { CharacterSvg } from '@/visuals/characters/mascots';
import { BackupSection } from './BackupSection';
import { SettingsSection } from './SettingsSection';

function percent(ratio: number | null): string {
  return ratio === null ? 'belum ada' : `${Math.round(ratio * 100)}%`;
}

export function ProfilePage() {
  const progress = useStore((s) => s.progress);
  const streak = useStore((s) => s.streak);
  const sum = totals(library.cards, progress);
  const weakest = weakestTopics(library.cards, progress)[0];
  const bySubTopic = accuracyBySubTopic(library.topics, library.cards, progress);

  return (
    <div className="space-y-6 px-4 pb-10 pt-4">
      <header className="flex items-center gap-4">
        <span className="story-ring rounded-full p-[3px]">
          <span className="block h-20 w-20 overflow-hidden rounded-full bg-surface">
            <CharacterSvg id="owl" expression="smug" className="h-full w-full translate-y-[8%] scale-110" />
          </span>
        </span>
        <div>
          <h1 className="text-xl font-black">Profil</h1>
          <p className="text-sm text-muted">Calon hakim yang sedang smart-scrolling</p>
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-surface p-3">
          <dt className="flex items-center gap-1 text-xs text-muted">
            <Icon name="flame" className="h-3.5 w-3.5" /> Streak
          </dt>
          <dd className="text-xl font-black">{visibleStreak(streak, todayKey())} hari</dd>
          <dd className="text-xs text-muted">terbaik {streak.best}</dd>
        </div>
        <div className="rounded-2xl bg-surface p-3">
          <dt className="text-xs text-muted">Kartu dilihat</dt>
          <dd className="text-xl font-black">
            {sum.cardsSeen}/{sum.cardsTotal}
          </dd>
        </div>
        <div className="rounded-2xl bg-surface p-3">
          <dt className="text-xs text-muted">Akurasi</dt>
          <dd className="text-xl font-black">{percent(sum.answers.ratio)}</dd>
          <dd className="text-xs text-muted">{sum.answers.correct + sum.answers.wrong} jawaban</dd>
        </div>
      </dl>

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
        <div className="space-y-4">
          {library.topics.map((topic) => (
            <div key={topic.id}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted">{topic.name}</h3>
              <ul className="mt-1.5 space-y-1.5">
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
            </div>
          ))}
        </div>
      </section>

      <SettingsSection />

      <Link to="/review" className="flex h-14 items-center justify-between rounded-2xl bg-surface px-4 font-bold">
        <span className="flex items-center gap-2">
          <Icon name="shield" className="h-5 w-5" /> Review &amp; verifikasi kartu
        </span>
        <span aria-hidden>›</span>
      </Link>

      <BackupSection />
    </div>
  );
}
