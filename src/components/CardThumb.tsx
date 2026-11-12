/** Thumbnail kartu untuk grid Jelajah dan Profil. */
import { memo } from 'react';
import { Link } from 'react-router-dom';
import { coverVisual } from '@/cards/coverVisual';
import type { Card } from '@/content/schema';
import { topicPaletteOf, TYPE_LABELS } from '@/content/lookup';
import { PALETTES } from '@/visuals/palettes';
import { visualAltText, VisualView } from '@/visuals/VisualView';
import { Icon, type IconName } from './Icon';

const TYPE_ICONS: Partial<Record<Card['type'], IconName>> = { carousel: 'layers', reel: 'reels', video: 'reels', story: 'play' };

/** Teks pertanyaan untuk kartu yang sampulnya hanya teks; null untuk kartu bergambar. */
function textCover(card: Card): { kicker: string; text: string } | null {
  if (card.type === 'quiz') return { kicker: 'Kuis', text: card.question };
  if (card.type === 'poll') return { kicker: 'Polling', text: card.question };
  if (card.type === 'review') return { kicker: 'Ingat lagi', text: card.front };
  return null;
}

/**
 * Sampul kartu teks dirender sebagai HTML, bukan SVG 1080px yang dikecilkan: di tile selebar ~130px
 * teks SVG menjadi terlalu kecil untuk dibaca, dan ribuan SVG juga lebih berat dirender.
 */
function TextTile({ card, kicker, text }: { card: Card; kicker: string; text: string }) {
  const palette = PALETTES[topicPaletteOf(card)];
  return (
    <span className="flex h-full w-full flex-col gap-1.5 p-2" style={{ background: `linear-gradient(160deg, ${palette.bg}, ${palette.bgDeep})`, color: palette.ink }}>
      <span className="self-start rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide" style={{ background: palette.accent, color: palette.accentInk }}>
        {kicker}
      </span>
      <span className="line-clamp-5 text-[12px] font-bold leading-[1.25]">{text}</span>
    </span>
  );
}

export const CardThumb = memo(function CardThumb({ card }: { card: Card }) {
  const icon = TYPE_ICONS[card.type];
  const text = textCover(card);
  const visual = text ? null : coverVisual(card);
  const label = text ? text.text : visual ? visualAltText(visual) : card.id;
  return (
    <Link to={`/kartu/${card.id}`} className="relative block aspect-square overflow-hidden bg-raised" style={{ contentVisibility: 'auto' }} aria-label={`${TYPE_LABELS[card.type]}: ${label}`}>
      {text ? <TextTile card={card} kicker={text.kicker} text={text.text} /> : visual && <VisualView visual={visual} topicPalette={topicPaletteOf(card)} className="h-full w-full" />}
      {icon && (
        <span className="absolute right-1.5 top-1.5 text-white drop-shadow">
          <Icon name={icon} className="h-5 w-5" />
        </span>
      )}
    </Link>
  );
});
