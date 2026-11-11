/** Halaman Review: periksa sumber tiap kartu, tandai terverifikasi, atau lapor salah. Disimpan lokal. */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cardSearchText } from '@/cards/coverVisual';
import { Icon } from '@/components/Icon';
import { ReportDialog } from '@/components/ReportDialog';
import { library } from '@/content';
import type { Card } from '@/content/schema';
import { subTopicName, topicOf, TYPE_LABELS } from '@/content/lookup';
import { effectiveStatus, type EffectiveStatus } from '@/domain/moderation';
import { useActions, useStore } from '@/state/store';

const STATUS_LABELS: Record<EffectiveStatus, string> = { draft: 'Draft', approved: 'Disetujui', reported: 'Dilaporkan' };
const STATUS_STYLES: Record<EffectiveStatus, string> = { draft: 'bg-warn/15 text-warn', approved: 'bg-good/15 text-good', reported: 'bg-bad/15 text-bad' };
type Filter = EffectiveStatus | 'semua';
const FILTERS: Filter[] = ['semua', 'draft', 'approved', 'reported'];

/** Ringkasan isi kartu untuk diperiksa terhadap sumber. */
function summary(card: Card): string {
  switch (card.type) {
    case 'quiz':
    case 'poll':
      return `${card.question} → ${card.options[card.answerIndex] ?? ''}. ${card.explanation}`;
    case 'review':
      return `${card.front} → ${card.back}`;
    case 'humor':
      return `${card.caption} (Mengajarkan: ${card.teaches})`;
    case 'story':
      return card.title;
    default:
      return card.caption;
  }
}

function ReviewItem({ card, status, onReport }: { card: Card; status: EffectiveStatus; onReport: () => void }) {
  const note = useStore((s) => s.moderation[card.id]?.reportNote);
  const { setApproved, clearReport } = useActions();
  return (
    <li className="space-y-2 border-b border-line px-4 py-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-bold ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
        <span className="rounded-full bg-raised px-2 py-0.5 font-semibold">{TYPE_LABELS[card.type]}</span>
        <span className="text-muted">
          {topicOf(card)?.shortName} · {subTopicName(card)}
        </span>
      </div>
      <p className="line-clamp-4 text-sm">{summary(card)}</p>
      <p className="text-xs">
        <span className="font-bold">Sumber:</span> {card.source.title}, {card.source.reference}
        {card.source.url && (
          <>
            {' · '}
            <a className="underline" href={card.source.url} target="_blank" rel="noreferrer">
              buka sumber
            </a>
          </>
        )}
      </p>
      {card.needsVerification && <p className="text-xs font-semibold text-warn">Perlu perhatian: pembuat kartu ragu pada detail atau versi peraturannya.</p>}
      {status === 'reported' && note && <p className="text-xs text-bad">Catatan laporan: {note}</p>}
      <div className="flex flex-wrap gap-2 pt-1">
        <Link to={`/kartu/${card.id}`} className="grid h-11 place-items-center rounded-xl bg-raised px-3 text-sm font-semibold">
          Lihat kartu
        </Link>
        {status === 'reported' ? (
          <button type="button" className="h-11 rounded-xl bg-raised px-3 text-sm font-semibold" onClick={() => clearReport(card.id)}>
            Cabut laporan
          </button>
        ) : (
          <>
            <button type="button" className={`h-11 rounded-xl px-3 text-sm font-semibold ${status === 'approved' ? 'bg-raised' : 'bg-good text-white'}`} onClick={() => setApproved(card.id, status !== 'approved')}>
              {status === 'approved' ? 'Batalkan verifikasi' : 'Tandai sudah diverifikasi'}
            </button>
            <button type="button" className="flex h-11 items-center gap-1.5 rounded-xl bg-raised px-3 text-sm font-semibold text-bad" onClick={onReport}>
              <Icon name="flag" className="h-4 w-4" /> Lapor salah
            </button>
          </>
        )}
      </div>
    </li>
  );
}

export function ReviewPage() {
  const navigate = useNavigate();
  const moderation = useStore((s) => s.moderation);
  const [filter, setFilter] = useState<Filter>('semua');
  const [text, setText] = useState('');
  const [reporting, setReporting] = useState<Card | null>(null);

  const rows = useMemo(() => library.cards.map((card) => ({ card, status: effectiveStatus(card, moderation) })), [moderation]);
  const counts = useMemo(() => {
    const tally: Record<Filter, number> = { semua: rows.length, draft: 0, approved: 0, reported: 0 };
    for (const row of rows) tally[row.status] += 1;
    return tally;
  }, [rows]);
  const query = text.trim().toLowerCase();
  const shown = rows.filter((row) => (filter === 'semua' || row.status === filter) && (!query || cardSearchText(row.card).includes(query)));

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 px-1 pb-2 backdrop-blur">
        <div className="flex h-12 items-center gap-1">
          <button type="button" className="grid h-11 w-11 place-items-center" onClick={() => navigate(-1)} aria-label="Kembali">
            <Icon name="back" />
          </button>
          <h1 className="text-base font-bold">Review &amp; verifikasi</h1>
        </div>
        <p className="px-3 text-xs text-muted">Cocokkan isi kartu dengan sumber resminya. Tandai terverifikasi hanya setelah kamu sendiri memeriksanya.</p>
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-3" role="group" aria-label="Filter status">
          {FILTERS.map((key) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={`h-9 shrink-0 rounded-full px-3.5 text-sm font-semibold ${filter === key ? 'bg-ink text-bg' : 'bg-raised'}`}>
              {key === 'semua' ? 'Semua' : STATUS_LABELS[key]} · {counts[key]}
            </button>
          ))}
        </div>
        <label className="mx-3 mt-2 flex h-10 items-center gap-2 rounded-xl bg-raised px-3">
          <Icon name="search" className="h-4 w-4 text-muted" />
          <span className="sr-only">Cari kartu</span>
          <input type="search" value={text} onChange={(event) => setText(event.target.value)} placeholder="Cari kartu" className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted" />
        </label>
      </header>
      {shown.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted">Tidak ada kartu pada filter ini.</p>
      ) : (
        <ul>
          {shown.map(({ card, status }) => (
            <ReviewItem key={card.id} card={card} status={status} onReport={() => setReporting(card)} />
          ))}
        </ul>
      )}
      {reporting && <ReportDialog card={reporting} onClose={() => setReporting(null)} />}
    </div>
  );
}
