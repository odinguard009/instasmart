/**
 * Merender kartu apa pun sebagai post. Satu-satunya tempat yang memetakan tipe kartu -> komponen media.
 * Menambah tipe kartu: skema (content/schema.ts) -> komponen media -> satu `case` di sini (+ coverVisual.ts).
 */
import type { ReactNode } from 'react';
import { PostShell } from '@/components/PostShell';
import type { Card } from '@/content/schema';
import { topicPaletteOf } from '@/content/lookup';
import { useInView } from '@/lib/useInView';
import { ReelPlayer } from '@/reels/ReelPlayer';
import { VisualView } from '@/visuals/VisualView';
import { CarouselMedia } from './media/CarouselMedia';
import { FlashcardMedia } from './media/FlashcardMedia';
import { QuestionBlock } from './media/QuestionBlock';
import { VideoMedia } from './media/VideoMedia';

interface CardViewProps {
  card: Card;
  ribbon?: string;
  /** Dipanggil saat pengguna ingin membuka story (tipe `story` saja). */
  onOpenStory?: () => void;
  /** Putaran tampil ulang di feed (lihat FeedItem.round): jawaban dicatat dengan kunci terpisah. */
  round?: number;
}

interface Parts {
  media: ReactNode;
  caption?: string;
  extra?: ReactNode;
}

function useParts(card: Card, onOpenStory: (() => void) | undefined, answerKey: string): { parts: Parts; ref: (node: HTMLDivElement | null) => void } {
  const palette = topicPaletteOf(card);
  const [ref, inView] = useInView<HTMLDivElement>(0.6);
  const visual = (v: Parameters<typeof VisualView>[0]['visual']) => <VisualView visual={v} topicPalette={palette} className="block h-auto w-full" />;

  switch (card.type) {
    case 'fact':
      return { ref, parts: { media: visual(card.visual), caption: card.caption } };
    case 'humor':
      return {
        ref,
        parts: {
          media: visual(card.visual),
          caption: card.caption,
          extra: (
            <p className="rounded-lg bg-raised px-2.5 py-1.5 text-xs">
              <span className="font-bold">Yang diajarkan:</span> {card.teaches}
            </p>
          ),
        },
      };
    case 'mnemonic':
      return {
        ref,
        parts: {
          media: visual(card.visual),
          caption: card.caption,
          extra: (
            <div className="rounded-lg bg-raised px-3 py-2 text-sm">
              <p className="font-extrabold tracking-wide">{card.phrase}</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-[13px]">
                {card.expansion.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </div>
          ),
        },
      };
    case 'quiz':
    case 'poll':
      return {
        ref,
        parts: { media: <QuestionBlock question={card} cardId={card.id} answerKey={answerKey} topicPalette={palette} variant={card.type} />, caption: card.caption },
      };
    case 'review':
      return { ref, parts: { media: <FlashcardMedia card={card} answerKey={answerKey} topicPalette={palette} />, caption: card.caption } };
    case 'carousel':
      return { ref, parts: { media: <CarouselMedia card={card} answerKey={answerKey} topicPalette={palette} />, caption: card.caption } };
    case 'reel':
      return { ref, parts: { media: <ReelPlayer card={card} topicPalette={palette} active={inView} className="aspect-[4/5] w-full" />, caption: card.caption } };
    case 'video':
      return { ref, parts: { media: <VideoMedia card={card} active={inView} className="aspect-[4/5] w-full" />, caption: card.caption } };
    case 'story':
      return {
        ref,
        parts: {
          media: (
            <button type="button" className="relative block w-full" onClick={onOpenStory} aria-label={`Tonton story ${card.title}`}>
              {card.slides[0] && visual(card.slides[0].visual)}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-left text-sm font-bold text-white">
                Tonton story · {card.slides.length} slide
              </span>
            </button>
          ),
          caption: card.title,
        },
      };
  }
}

export function CardView({ card, ribbon, onOpenStory, round }: CardViewProps) {
  const { parts, ref } = useParts(card, onOpenStory, round ? `${card.id}~${round}` : card.id);
  return (
    <PostShell card={card} ribbon={ribbon} caption={parts.caption} extra={parts.extra}>
      <div ref={ref}>{parts.media}</div>
    </PostShell>
  );
}
