/** Carousel: geser horizontal (scroll-snap), indikator titik, tiap slide visual atau kuis. */
import { useRef, useState } from 'react';
import type { CardOf, PaletteId } from '@/content/schema';
import { VisualView } from '@/visuals/VisualView';
import { QuestionBlock } from './QuestionBlock';

export function CarouselMedia({ card, answerKey, topicPalette }: { card: CardOf<'carousel'>; answerKey: string; topicPalette: PaletteId }) {
  const [index, setIndex] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const goTo = (target: number) => {
    const node = scroller.current;
    if (node) node.scrollTo({ left: target * node.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={scroller}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        onScroll={(event) => {
          const node = event.currentTarget;
          setIndex(Math.round(node.scrollLeft / Math.max(1, node.clientWidth)));
        }}
        aria-roledescription="carousel"
        aria-label={`Carousel ${card.slides.length} slide`}
      >
        {card.slides.map((slide, slideIndex) => (
          <div key={slideIndex} className="flex w-full shrink-0 snap-center snap-always items-center bg-raised" aria-label={`Slide ${slideIndex + 1} dari ${card.slides.length}`}>
            {slide.kind === 'visual' ? (
              <VisualView visual={slide.visual} topicPalette={topicPalette} className="block h-auto w-full" />
            ) : (
              <QuestionBlock question={slide} cardId={card.id} answerKey={`${answerKey}#${slideIndex}`} topicPalette={topicPalette} variant="quiz" schedule={false} />
            )}
          </div>
        ))}
      </div>
      <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
        {index + 1}/{card.slides.length}
      </span>
      <div className="flex justify-center gap-1 pt-2.5">
        {card.slides.map((_, dot) => (
          <button
            key={dot}
            type="button"
            aria-label={`Ke slide ${dot + 1}`}
            aria-current={dot === index}
            onClick={() => goTo(dot)}
            className="grid h-9 w-5 place-items-center"
          >
            <span className={`block h-1.5 rounded-full transition-all ${dot === index ? 'w-3 bg-brand' : 'w-1.5 bg-muted/50'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
