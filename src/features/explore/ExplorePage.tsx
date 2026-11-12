/** Jelajah: grid seluruh pustaka dengan pencarian teks, filter format, dan filter materi di lembar bawah. */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BottomSheet } from '@/components/BottomSheet';
import { CardGrid } from '@/components/CardGrid';
import { Icon } from '@/components/Icon';
import { library } from '@/content';
import { TOPIC_GROUP_LABELS, TOPIC_GROUPS, type TopicGroup } from '@/content/schema';
import { activeFilterCount, filterCards, FORMAT_FILTERS, type FormatFilter } from '@/domain/explore';
import { eligibleCards } from '@/domain/moderation';
import { todayKey } from '@/lib/date';
import { createRng, shuffle } from '@/lib/rng';
import { useStore } from '@/state/store';

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`h-11 shrink-0 rounded-full px-3.5 text-sm font-semibold ${active ? 'bg-ink text-bg' : 'bg-raised text-ink'}`}>
      {children}
    </button>
  );
}

export function ExplorePage() {
  const moderation = useStore((s) => s.moderation);
  const showUnverified = useStore((s) => s.settings.showUnverified);
  const [text, setText] = useState('');
  // ?topik=<id> (dari sorotan topik di Profil) membuka Jelajah langsung terfilter.
  const [params] = useSearchParams();
  const linkedTopic = library.topicById.get(params.get('topik') ?? '');
  const [group, setGroup] = useState<TopicGroup | null>(linkedTopic?.group ?? null);
  const [topicId, setTopicId] = useState<string | null>(linkedTopic?.id ?? null);
  const groupTopics = useMemo(() => library.topics.filter((topic) => group === null || topic.group === group), [group]);
  const [format, setFormat] = useState<FormatFilter>('semua');
  const [sheetOpen, setSheetOpen] = useState(false);

  const visible = useMemo(() => eligibleCards(library.cards, moderation, showUnverified), [moderation, showUnverified]);
  // Tanpa kata kunci, grid diacak per hari supaya Jelajah tidak selalu dibuka dengan topik yang sama (urutan berkas).
  const mixed = useMemo(() => shuffle(visible, createRng(`jelajah:${todayKey()}`)), [visible]);
  const results = useMemo(() => {
    const inGroup = new Set(groupTopics.map((topic) => topic.id));
    return filterCards(text.trim() ? visible : mixed, { text, topicId, format }).filter((card) => inGroup.has(card.topicId));
  }, [visible, mixed, text, topicId, format, groupTopics]);
  const pickGroup = (next: TopicGroup | null) => {
    setGroup(next);
    setTopicId(null);
  };

  const filterCount = activeFilterCount({ group, topicId });
  const activeTopic = topicId ? library.topicById.get(topicId) : undefined;
  const filterLabel = activeTopic ? activeTopic.shortName : group ? TOPIC_GROUP_LABELS[group] : 'Semua materi';

  return (
    <div>
      <header className="sticky top-0 z-30 space-y-2 bg-bg/95 px-3 pb-2 pt-3 backdrop-blur">
        <div className="flex gap-2">
          <label className="relative flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl bg-raised px-3">
            <Icon name="search" className="h-5 w-5 shrink-0 text-muted" />
            <span className="sr-only">Cari kartu</span>
            <input type="search" value={text} onChange={(event) => setText(event.target.value)} placeholder="Cari pasal, konsep, atau kata kunci" className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted" />
          </label>
          <button type="button" className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-raised" aria-label={`Filter materi (${filterLabel})`} aria-haspopup="dialog" onClick={() => setSheetOpen(true)}>
            <Icon name="sliders" className="h-5 w-5" />
            {filterCount > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-brand" aria-hidden />}
          </button>
        </div>
        <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3" role="group" aria-label="Filter format">
          {(Object.keys(FORMAT_FILTERS) as FormatFilter[]).map((key) => (
            <Chip key={key} active={format === key} onClick={() => setFormat(key)}>
              {FORMAT_FILTERS[key].label}
            </Chip>
          ))}
        </div>
      </header>
      <p className="flex items-center justify-between gap-2 px-3 pb-2 text-xs text-muted" role="status">
        <span className="truncate">{filterLabel}</span>
        <span className="shrink-0">{results.length} kartu</span>
      </p>
      {results.length === 0 ? <p className="p-8 text-center text-sm text-muted">Tidak ada kartu yang cocok.</p> : <CardGrid cards={results} resetKey={`${text}|${format}|${group ?? ''}|${topicId ?? ''}`} />}
      {sheetOpen && (
        <BottomSheet title="Filter materi" onClose={() => setSheetOpen(false)}>
          <div className="space-y-4 px-5 pb-6 pt-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Kelompok materi">
              <Chip active={group === null} onClick={() => pickGroup(null)}>
                Semua materi
              </Chip>
              {TOPIC_GROUPS.map((key) => (
                <Chip key={key} active={group === key} onClick={() => pickGroup(key)}>
                  {TOPIC_GROUP_LABELS[key]}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-line pt-4" role="group" aria-label="Topik">
              <Chip active={topicId === null} onClick={() => setTopicId(null)}>
                Semua topik
              </Chip>
              {groupTopics.map((topic) => (
                <Chip key={topic.id} active={topicId === topic.id} onClick={() => setTopicId(topic.id)}>
                  {topic.shortName}
                </Chip>
              ))}
            </div>
            <button type="button" className="h-12 w-full rounded-xl bg-ink font-bold text-bg" onClick={() => setSheetOpen(false)}>
              Tampilkan {results.length} kartu
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
