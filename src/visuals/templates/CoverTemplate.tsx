import type { VisualOf } from '@/content/schema';
import { Character } from '../characters/mascots';
import { MARGIN } from '../frame';
import { SvgText } from '../SvgText';
import { layoutText } from '../text';
import { Backdrop, Pill, Watermark, type TemplateProps } from './shared';

/** Sampul (carousel, story, reel): kicker + judul besar + maskot opsional. */
export function CoverTemplate({ visual, palette, frame }: TemplateProps<VisualOf<'cover'>>) {
  const characterSize = visual.character ? Math.min(430, frame.h * 0.38) : 0;
  const width = frame.w - MARGIN * 2;
  const title = layoutText(visual.title, { maxWidth: width, maxLines: 5, sizes: [112, 98, 86, 76, 66, 58], lineHeight: 1.08, maxHeight: frame.h - characterSize * 0.75 - 420 });
  const subtitle = visual.subtitle ? layoutText(visual.subtitle, { maxWidth: width - (characterSize ? 240 : 0), maxLines: 4, sizes: [46, 40, 36] }) : null;
  const blockHeight = title.height + (subtitle ? subtitle.height + 36 : 0);
  const top = Math.max(visual.kicker ? 210 : 120, (frame.h - characterSize * 0.55 - blockHeight) / 2);
  return (
    <g>
      <Backdrop palette={palette} frame={frame} />
      {visual.kicker && <Pill text={visual.kicker} x={MARGIN} y={top - 104} palette={palette} />}
      <SvgText layout={title} x={MARGIN} y={top} fill={palette.ink} weight={900} />
      <rect x={MARGIN} y={top + title.height + 8} width={160} height={12} rx={6} fill={palette.accent} />
      {subtitle && <SvgText layout={subtitle} x={MARGIN} y={top + title.height + 50} fill={palette.ink} weight={600} opacity={0.92} />}
      {visual.character && (
        <Character id={visual.character} expression={visual.expression} x={frame.w - characterSize - 40} y={frame.h - characterSize - 30} size={characterSize} />
      )}
      {!visual.character && <Watermark palette={palette} frame={frame} />}
    </g>
  );
}
