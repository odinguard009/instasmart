import { MARGIN } from '../frame';
import { SvgText, FONT_STACK } from '../SvgText';
import { layoutText } from '../text';
import { Backdrop, Pill, Watermark, type TemplateProps } from './shared';
import type { VisualOf } from '@/content/schema';

/** Poster kutipan pasal: label + kutipan besar + kaki sumber. */
export function QuoteTemplate({ visual, palette, frame }: TemplateProps<VisualOf<'quote'>>) {
  const width = frame.w - MARGIN * 2;
  const body = layoutText(visual.text, { maxWidth: width, maxLines: frame.h > 1200 ? 14 : 9, sizes: [86, 76, 66, 58, 52, 46, 40], maxHeight: frame.h - 560 });
  const top = Math.max(300, (frame.h - body.height) / 2);
  return (
    <g>
      <Backdrop palette={palette} frame={frame} />
      {visual.label && <Pill text={visual.label} x={MARGIN} y={top - 190} palette={palette} />}
      <text x={MARGIN - 14} y={top - 6} fontFamily={FONT_STACK} fontSize={220} fontWeight={900} fill={palette.accent} opacity={0.9}>
        “
      </text>
      <SvgText layout={body} x={MARGIN} y={top + 30} fill={palette.ink} />
      {visual.footer && (
        <g>
          <rect x={MARGIN} y={top + body.height + 80} width={120} height={8} rx={4} fill={palette.accent} />
          <SvgText
            layout={layoutText(visual.footer, { maxWidth: width, maxLines: 2, sizes: [38, 32] })}
            x={MARGIN}
            y={top + body.height + 112}
            fill={palette.ink}
            weight={600}
            opacity={0.9}
          />
        </g>
      )}
      <Watermark palette={palette} frame={frame} />
    </g>
  );
}
