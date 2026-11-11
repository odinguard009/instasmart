/** Thumbnail kartu untuk grid Jelajah/Favorit. */
import { memo } from 'react';
import { Link } from 'react-router-dom';
import { coverVisual } from '@/cards/coverVisual';
import type { Card } from '@/content/schema';
import { topicPaletteOf, TYPE_LABELS } from '@/content/lookup';
import { visualAltText, VisualView } from '@/visuals/VisualView';
import { Icon, type IconName } from './Icon';

const TYPE_ICONS: Partial<Record<Card['type'], IconName>> = { carousel: 'layers', reel: 'reels', video: 'reels', story: 'play' };

export const CardThumb = memo(function CardThumb({ card }: { card: Card }) {
  const visual = coverVisual(card);
  const icon = TYPE_ICONS[card.type];
  return (
    <Link to={`/kartu/${card.id}`} className="relative block aspect-square overflow-hidden bg-raised" style={{ contentVisibility: 'auto' }} aria-label={`${TYPE_LABELS[card.type]}: ${visualAltText(visual)}`}>
      <VisualView visual={visual} topicPalette={topicPaletteOf(card)} className="h-full w-full" />
      {icon && (
        <span className="absolute right-1.5 top-1.5 text-white drop-shadow">
          <Icon name={icon} className="h-5 w-5" />
        </span>
      )}
    </Link>
  );
});
