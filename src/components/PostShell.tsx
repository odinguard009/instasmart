/** Kerangka post ala Instagram: header akun, media, bar aksi pribadi, caption, sumber, komentar statis. */
import { useState, type ReactNode } from 'react';
import type { Card } from '@/content/schema';
import { accountOf, subTopicName, topicOf, TYPE_LABELS } from '@/content/lookup';
import { useActions, useStore } from '@/state/store';
import { AccountAvatar } from './AccountAvatar';
import { DraftBadge } from './DraftBadge';
import { Icon } from './Icon';
import { ReportDialog } from './ReportDialog';

interface PostShellProps {
  card: Card;
  /** Pita kecil di atas header, mis. "Ulang" atau "Kejutan hari ini". */
  ribbon?: string;
  caption?: string;
  /** Konten tambahan di bawah caption (mis. uraian jembatan keledai). */
  extra?: ReactNode;
  children: ReactNode;
}

const COMMENTS_PREVIEW = 2;

function Comments({ card }: { card: Card }) {
  const [expanded, setExpanded] = useState(false);
  const comments = card.comments ?? [];
  if (comments.length === 0) return null;
  const shown = expanded ? comments : comments.slice(0, COMMENTS_PREVIEW);
  return (
    <div className="space-y-1 text-sm">
      {shown.map((comment, index) => (
        <p key={index}>
          <span className="font-semibold">{comment.user}</span> {comment.text}
        </p>
      ))}
      {!expanded && comments.length > COMMENTS_PREVIEW && (
        <button type="button" className="min-h-11 text-muted" onClick={() => setExpanded(true)}>
          Lihat semua {comments.length} komentar
        </button>
      )}
      <p className="text-xs text-muted">Komentar fiktif, bagian dari kartu.</p>
    </div>
  );
}

export function PostShell({ card, ribbon, caption, extra, children }: PostShellProps) {
  const favorite = useStore((s) => s.favorites[card.id]);
  const { toggleFavorite } = useActions();
  const [heartBurst, setHeartBurst] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const liked = favorite?.liked ?? false;
  const saved = favorite?.saved ?? false;

  const like = () => {
    if (!liked) toggleFavorite(card.id, 'liked');
    setHeartBurst((n) => n + 1);
  };
  const share = async () => {
    try {
      // Dimuat saat dibutuhkan: modul ini membawa perender SVG-ke-teks yang cukup besar.
      const { shareCardImage } = await import('@/lib/shareImage');
      const outcome = await shareCardImage(card);
      setShareNote(outcome === 'downloaded' ? 'Gambar diunduh.' : null);
    } catch {
      setShareNote('Gagal membuat gambar.');
    }
  };

  return (
    <article className="border-b border-line bg-bg pb-4" aria-label={`${TYPE_LABELS[card.type]} dari ${card.account}`}>
      {ribbon && <p className="bg-brand/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand">{ribbon}</p>}
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <AccountAvatar card={card} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold">{card.account}</p>
          <p className="truncate text-xs text-muted">
            {topicOf(card)?.shortName} · {subTopicName(card)}
          </p>
        </div>
        <div className="relative">
          <button type="button" className="grid h-11 w-11 place-items-center" aria-label="Menu post" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            <Icon name="more" className="h-6 w-6" />
          </button>
          {menuOpen && <button type="button" className="fixed inset-0 z-10 cursor-default" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} />}
          {menuOpen && (
            <div className="absolute right-2 top-11 z-20 w-56 overflow-hidden rounded-xl border border-line bg-surface text-sm shadow-xl">
              <p className="border-b border-line px-4 py-2.5 text-xs text-muted">{accountOf(card)?.bio}</p>
              <button
                type="button"
                className="flex h-12 w-full items-center gap-2 px-4 text-left font-semibold text-bad"
                onClick={() => {
                  setMenuOpen(false);
                  setReporting(true);
                }}
              >
                <Icon name="flag" className="h-4 w-4" /> Lapor salah
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="relative" onDoubleClick={like}>
        {children}
        {heartBurst > 0 && (
          <span key={heartBurst} className="pointer-events-none absolute inset-0 grid place-items-center">
            <Icon name="heart" filled className="h-28 w-28 animate-heart-pop text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" />
          </span>
        )}
      </div>

      <div className="flex items-center px-1.5 pt-1">
        <button type="button" className="grid h-11 w-11 place-items-center" aria-label={liked ? 'Batal suka' : 'Suka (masuk Favorit)'} aria-pressed={liked} onClick={() => toggleFavorite(card.id, 'liked')}>
          <Icon name="heart" filled={liked} className={`h-7 w-7 transition-transform active:scale-125 ${liked ? 'text-bad' : ''}`} />
        </button>
        <button type="button" className="grid h-11 w-11 place-items-center" aria-label="Bagikan sebagai gambar" onClick={share}>
          <Icon name="share" className="h-6 w-6" />
        </button>
        <span className="ml-1 rounded-full bg-raised px-2.5 py-1 text-xs font-semibold text-muted">{TYPE_LABELS[card.type]}</span>
        <button type="button" className="ml-auto grid h-11 w-11 place-items-center" aria-label={saved ? 'Hapus dari simpanan' : 'Simpan'} aria-pressed={saved} onClick={() => toggleFavorite(card.id, 'saved')}>
          <Icon name="bookmark" filled={saved} className="h-6 w-6" />
        </button>
      </div>

      <div className="space-y-2 px-3">
        {shareNote && <p className="text-xs text-muted">{shareNote}</p>}
        {caption && (
          <p className="whitespace-pre-line text-sm leading-relaxed">
            <span className="font-semibold">{card.account}</span> {caption}
          </p>
        )}
        {extra}
        <p className="text-xs text-muted">
          Sumber: {card.source.title}, {card.source.reference}
          {card.source.url && (
            <>
              {' · '}
              <a className="underline" href={card.source.url} target="_blank" rel="noreferrer">
                buka
              </a>
            </>
          )}
        </p>
        <DraftBadge card={card} />
        <Comments card={card} />
      </div>
      {reporting && <ReportDialog card={card} onClose={() => setReporting(false)} />}
    </article>
  );
}
