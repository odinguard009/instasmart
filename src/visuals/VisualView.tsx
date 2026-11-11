/**
 * Pintu masuk mesin visual: `visual` (data) -> SVG deterministik.
 * Menambah template: (1) skema di content/schema.ts, (2) file di templates/, (3) satu `case` di renderTemplate.
 * TypeScript akan menandai `switch` ini jika ada template yang belum ditangani.
 */
import type { ReactNode } from 'react';
import type { PaletteId, Visual } from '@/content/schema';
import { FRAMES, type Frame, type FrameName } from './frame';
import { paletteOf, type Palette } from './palettes';
import { BigtypeTemplate } from './templates/BigtypeTemplate';
import { ComicTemplate } from './templates/ComicTemplate';
import { CoverTemplate } from './templates/CoverTemplate';
import { IllustrationTemplate } from './templates/IllustrationTemplate';
import { InfographicTemplate } from './templates/InfographicTemplate';
import { MemeTemplate } from './templates/MemeTemplate';
import { PhotoTemplate } from './templates/PhotoTemplate';
import { QuoteTemplate } from './templates/QuoteTemplate';

function renderTemplate(visual: Visual, palette: Palette, frame: Frame): ReactNode {
  switch (visual.template) {
    case 'quote':
      return <QuoteTemplate visual={visual} palette={palette} frame={frame} />;
    case 'infographic':
      return <InfographicTemplate visual={visual} palette={palette} frame={frame} />;
    case 'meme':
      return <MemeTemplate visual={visual} palette={palette} frame={frame} />;
    case 'comic':
      return <ComicTemplate visual={visual} palette={palette} frame={frame} />;
    case 'cover':
      return <CoverTemplate visual={visual} palette={palette} frame={frame} />;
    case 'bigtype':
      return <BigtypeTemplate visual={visual} palette={palette} frame={frame} />;
    case 'illustration':
      return <IllustrationTemplate visual={visual} palette={palette} frame={frame} />;
    case 'photo':
      return <PhotoTemplate visual={visual} palette={palette} frame={frame} />;
  }
}

/** Teks alternatif untuk pembaca layar: gabungan teks di dalam visual. */
export function visualAltText(visual: Visual): string {
  switch (visual.template) {
    case 'quote':
      return [visual.label, visual.text, visual.footer].filter(Boolean).join('. ');
    case 'infographic':
      return [visual.title, ...visual.points].join('. ');
    case 'meme':
      return [visual.top, visual.bottom].filter(Boolean).join('. ');
    case 'comic':
      return [visual.title, ...visual.panels.map((panel) => panel.text)].filter(Boolean).join('. ');
    case 'cover':
      return [visual.kicker, visual.title, visual.subtitle].filter(Boolean).join('. ');
    case 'bigtype':
      return [visual.kicker, visual.text, visual.sub].filter(Boolean).join('. ');
    case 'illustration':
      return [visual.title, visual.caption].filter(Boolean).join('. ');
    case 'photo':
      return [visual.alt, visual.overlayText].filter(Boolean).join('. ');
  }
}

interface VisualViewProps {
  visual: Visual;
  /** Palet topik, dipakai jika visual tidak menentukan palet sendiri. */
  topicPalette: PaletteId;
  frame?: FrameName;
  className?: string;
}

export function VisualView({ visual, topicPalette, frame = 'square', className }: VisualViewProps) {
  const size = FRAMES[frame];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size.w} ${size.h}`}
      width={size.w}
      height={size.h}
      className={className}
      role="img"
      aria-label={visualAltText(visual)}
    >
      {renderTemplate(visual, paletteOf(visual.palette, topicPalette), size)}
    </svg>
  );
}
