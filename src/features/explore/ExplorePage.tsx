/** Jelajah: grid seluruh pustaka dengan pencarian teks, filter topik, dan filter format. */
import { useMemo, useState } from 'react';
import { CardThumb } from '@/components/CardThumb';
import { Icon } from '@/components/Icon';
import { library } from '@/content';
import { filterCards, FORMAT_FILTERS, type FormatFilter } from '@/domain/explore';
import { eligibleCards } from '@/domain/moderation';
import { useStore } from '@/state/store';

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`h-9 shrink-0 rounded-full px-3.5 text-sm font-semibold ${active ? 'bg-ink text-bg' : 'bg-raised text-ink'}`}>
      {children}
    </button>
  );
}

export function ExplorePage() {
  const moderation = useStore((s) => s.moderation);
  const showUnverified = useStore((s) => s.settings.showUnverified);
  const [text, setText] = useState('');
  const [topicId, setTopicId] = useState<string | null>(null);
  const [format, setFormat] = useState<FormatFilter>('semua');

  const visible = useMemo(() => eligibleCards(library.cards, moderation, showUnverified), [moderation, showUnverified]);
  const results = useMemo(() => filterCards(visible, { text, topicId, format }), [visible, text, topicId, format]);

  return (
    <div>
      <header className="sticky top-0 z-30 space-y-2 border-b border-line bg-bg/95 px-3 pb-2 pt-3 backdrop-blur">
        <label className="flex h-11 items-center gap-2 rounded-xl bg-raised px-3">
          <Icon name="search" className="h-5 w-5 text-muted" />
          <span className="sr-only">Cari kartu</span>
          <input type="search" value={text} onChange={(event) => setText(event.target.value)} placeholder="Cari pasal, konsep, atau kata kunci" className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted" />
        </label>
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Filter format">
          {(Object.keys(FORMAT_FILTERS) as FormatFilter[]).map((key) => (
            <Chip key={key} active={format === key} onClick={() => setFormat(key)}>
              {FORMAT_FILTERS[key].label}
            </Chip>
          ))}
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Filter topik">
          <Chip active={topicId === null} onClick={() => setTopicId(null)}>
            Semua topik
          </Chip>
          {library.topics.map((topic) => (
            <Chip key={topic.id} active={topicId === topic.id} onClick={() => setTopicId(topic.id)}>
              {topic.shortName}
            </Chip>
          ))}
        </div>
      </header>
      <p className="px-3 py-2 text-xs text-muted" role="status">
        {results.length} kartu
      </p>
      {results.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted">Tidak ada kartu yang cocok.</p>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {results.map((card) => (
            <CardThumb key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
