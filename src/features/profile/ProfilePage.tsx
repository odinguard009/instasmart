/**
 * Profil ala galeri: avatar + angka pribadi (streak, kartu dilihat, akurasi), sorotan topik, lalu tab grid
 * Disimpan/Disukai dan Statistik. Angka di sini hanya milik pengguna sendiri, bukan metrik sosial.
 */
import { Link, useSearchParams } from 'react-router-dom';
import { CardGrid } from '@/components/CardGrid';
import { Icon, type IconName } from '@/components/Icon';
import { library } from '@/content';
import { favoriteCards, type FavoriteField } from '@/domain/favorites';
import { coverageByTopic, totals } from '@/domain/stats';
import { visibleStreak } from '@/domain/streak';
import { todayKey } from '@/lib/date';
import { useStore } from '@/state/store';
import { CharacterSvg } from '@/visuals/characters/mascots';
import { PALETTES } from '@/visuals/palettes';
import { percent, StatsPanel } from './StatsPanel';

const TABS = [
  { id: 'disimpan', label: 'Disimpan', icon: 'bookmark' },
  { id: 'disukai', label: 'Disukai', icon: 'heart' },
  { id: 'statistik', label: 'Statistik', icon: 'grid' },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];
type TabId = (typeof TABS)[number]['id'];

const FIELD_BY_TAB: Record<Exclude<TabId, 'statistik'>, FavoriteField> = { disimpan: 'saved', disukai: 'liked' };

function isTab(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <dd className="text-lg font-black leading-tight">{value}</dd>
      <dt className="text-xs text-muted">{label}</dt>
    </div>
  );
}

/** Sorotan topik: lingkaran berwarna topik dengan cincin cakupan (porsi kartu yang sudah pernah dilihat). */
function TopicHighlights() {
  const progress = useStore((s) => s.progress);
  const coverage = coverageByTopic(library.cards, progress);
  return (
    <ul className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1" aria-label="Topik">
      {library.topics.map((topic) => {
        const palette = PALETTES[topic.palette];
        const ratio = coverage.get(topic.id) ?? 0;
        return (
          <li key={topic.id} className="shrink-0">
            <Link to={`/jelajah?topik=${topic.id}`} className="flex w-[68px] flex-col items-center gap-1" aria-label={`${topic.name}, ${Math.round(ratio * 100)}% kartu sudah dilihat`}>
              <span className="grid h-[64px] w-[64px] place-items-center rounded-full p-[3px]" style={{ background: `conic-gradient(rgb(var(--ink)) ${ratio * 360}deg, rgb(var(--line)) 0)` }}>
                <span className="grid h-full w-full place-items-center rounded-full border-2 border-bg text-sm font-black" style={{ background: `linear-gradient(160deg, ${palette.bg}, ${palette.bgDeep})`, color: palette.ink }}>
                  {Math.round(ratio * 100)}%
                </span>
              </span>
              <span className="line-clamp-2 text-center text-[11px] leading-tight">{topic.shortName}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function ProfilePage() {
  const progress = useStore((s) => s.progress);
  const streak = useStore((s) => s.streak);
  const favorites = useStore((s) => s.favorites);
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab: TabId = isTab(requested) ? requested : 'disimpan';
  const sum = totals(library.cards, progress);
  const cards = tab === 'statistik' ? [] : favoriteCards(library.cardById, favorites, FIELD_BY_TAB[tab]);

  return (
    <div>
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-line bg-bg/95 pl-4 pr-1 backdrop-blur">
        <h1 className="text-lg font-black">Profil</h1>
        <Link to="/pengaturan" className="grid h-11 w-11 place-items-center" aria-label="Pengaturan">
          <Icon name="menu" className="h-6 w-6" />
        </Link>
      </header>

      <section className="flex items-center gap-5 px-4 pt-4">
        <span className="story-ring shrink-0 rounded-full p-[3px]">
          <span className="block h-20 w-20 overflow-hidden rounded-full border-2 border-bg bg-surface">
            <CharacterSvg id="owl" expression="smug" className="h-full w-full translate-y-[8%] scale-110" />
          </span>
        </span>
        <dl className="flex flex-1 justify-between" aria-label="Statistik pribadi">
          <Stat value={`${visibleStreak(streak, todayKey())}`} label="hari streak" />
          <Stat value={`${sum.cardsSeen}`} label="kartu dilihat" />
          <Stat value={sum.answers.ratio === null ? '–' : percent(sum.answers.ratio)} label="akurasi" />
        </dl>
      </section>
      <div className="px-4 pb-3 pt-3 text-sm">
        <p className="font-bold">Calon hakim &amp; CPNS</p>
        <p className="text-muted">Sedang smart-scrolling. {sum.cardsSeen} dari {sum.cardsTotal} kartu sudah dilihat · streak terbaik {streak.best} hari · {sum.answers.correct + sum.answers.wrong} jawaban.</p>
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <Link to="/pengaturan" className="grid h-11 flex-1 place-items-center rounded-xl bg-raised text-sm font-bold">
          Pengaturan
        </Link>
        <Link to="/review" className="grid h-11 flex-1 place-items-center rounded-xl bg-raised text-sm font-bold">
          Review kartu
        </Link>
      </div>

      <TopicHighlights />

      <div role="tablist" aria-label="Koleksi" className="sticky top-12 z-20 mt-3 flex border-b border-line bg-bg">
        {TABS.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={item.label}
              onClick={() => setParams(item.id === 'disimpan' ? {} : { tab: item.id }, { replace: true })}
              className={`flex h-12 flex-1 items-center justify-center gap-1.5 border-b-2 text-xs font-semibold ${active ? 'border-ink text-ink' : 'border-transparent text-muted'}`}
            >
              <Icon name={item.icon} filled={active && item.icon !== 'grid'} className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" aria-label={TABS.find((item) => item.id === tab)?.label}>
        {tab === 'statistik' ? (
          <StatsPanel />
        ) : cards.length > 0 ? (
          <CardGrid cards={cards} resetKey={tab} />
        ) : (
          <p className="px-8 py-12 text-center text-sm text-muted">
            {tab === 'disimpan' ? 'Belum ada yang disimpan. Ketuk ikon simpan pada post untuk mengumpulkannya di sini.' : 'Belum ada yang disukai. Ketuk hati atau ketuk dua kali pada post.'} Koleksi ini hanya untukmu; tidak ada jumlah suka dari orang lain.
          </p>
        )}
      </div>
    </div>
  );
}
