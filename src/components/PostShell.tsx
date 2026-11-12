/** Kerangka post ala Instagram: header akun, media, bar aksi pribadi, caption, sumber, komentar statis. */
import { useState, type ReactNode } from 'react';
import type { Card } from '@/content/schema';
import { shouldCollapseCaption } from '@/domain/caption';
import { accountOf, subTopicName, topicOf, TYPE_LABELS } from '@/content/lookup';
import { useActions, useStore } from '@/state/store';
import { AccountAvatar } from './AccountAvatar';
import { BottomSheet } from './BottomSheet';
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

function Caption({ account, text }: { account: string; text: string }) {
  const [expanded, setExpanded] = useState(false);
  const collapsible = shouldCollapseCaption(text);
  const clamped = collapsible && !expanded;
  return (
    <div className="text-sm leading-relaxed">
      <p className={`whitespace-pre-line ${clamped ? 'line-clamp-3' : ''}`}>
        <span className="font-semibold">{account}</span> {text}
      </p>
      {clamped && (
        <button type="button" className="-my-2 min-h-11 text-muted" onClick={() => setExpanded(true)} aria-label="Tampilkan caption lengkap">
          lainnya
        </button>
      )}
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

  // content-visibility: feed tanpa batas bisa berisi ratusan post; post di luar layar tidak dirender ulang.
  return (
    <article className="border-b border-line bg-bg pb-4 [contain-intrinsic-size:auto_640px] [content-visibility:auto]" aria-label={`${TYPE_LABELS[card.type]} dari ${card.account}`}>
      {ribbon && <p className="bg-brand/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand">{ribbon}</p>}
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <AccountAvatar card={card} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold">{card.account}</p>
          <p className="truncate text-xs text-muted">
            {topicOf(card)?.shortName} · {subTopicName(card)}
          </p>
        </div>
        <button type="button" className="grid h-11 w-11 place-items-center" aria-label="Menu post" aria-haspopup="dialog" onClick={() => setMenuOpen(true)}>
          <Icon name="more" className="h-6 w-6" />
        </button>
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
        <button type="button" className="grid h-11 w-11 place-items-center" aria-label={liked ? 'Batal suka' : 'Suka (masuk koleksi Profil)'} aria-pressed={liked} onClick={() => toggleFavorite(card.id, 'liked')}>
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
        {caption && <Caption account={card.account} text={caption} />}
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
      {menuOpen && (
        <BottomSheet title="Menu post" hideTitle onClose={() => setMenuOpen(false)}>
          <p className="px-5 pb-3 pt-2 text-center text-sm text-muted">
            <span className="font-semibold text-ink">{card.account}</span> · {accountOf(card)?.bio}
          </p>
          <ul className="border-t border-line pb-4 text-[15px]">
            <li>
              <button type="button" className="flex h-14 w-full items-center gap-3 px-5 text-left" onClick={() => toggleFavorite(card.id, 'saved')}>
                <Icon name="bookmark" filled={saved} className="h-6 w-6" /> {saved ? 'Hapus dari simpanan' : 'Simpan'}
              </button>
            </li>
            <li>
              <button
                type="button"
                className="flex h-14 w-full items-center gap-3 px-5 text-left"
                onClick={() => {
                  setMenuOpen(false);
                  void share();
                }}
              >
                <Icon name="share" className="h-6 w-6" /> Bagikan sebagai gambar
              </button>
            </li>
            {card.source.url && (
              <li>
                <a className="flex h-14 w-full items-center gap-3 px-5" href={card.source.url} target="_blank" rel="noreferrer">
                  <Icon name="link" className="h-6 w-6" /> Buka sumber
                </a>
              </li>
            )}
            <li>
              <button
                type="button"
                className="flex h-14 w-full items-center gap-3 px-5 text-left font-semibold text-bad"
                onClick={() => {
                  setMenuOpen(false);
                  setReporting(true);
                }}
              >
                <Icon name="flag" className="h-6 w-6" /> Lapor salah
              </button>
            </li>
          </ul>
        </BottomSheet>
      )}
      {reporting && <ReportDialog card={card} onClose={() => setReporting(false)} />}
    </article>
  );
}
