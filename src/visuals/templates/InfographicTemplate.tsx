import type { VisualOf } from '@/content/schema';
import { MARGIN } from '../frame';
import { FONT_STACK, SvgText } from '../SvgText';
import { layoutText } from '../text';
import { Backdrop, Watermark, type TemplateProps } from './shared';

/** Infografis: judul + 2-5 poin bernomor. */
export function InfographicTemplate({ visual, palette, frame }: TemplateProps<VisualOf<'infographic'>>) {
  const width = frame.w - MARGIN * 2;
  const title = layoutText(visual.title, { maxWidth: width, maxLines: 3, sizes: [82, 72, 62, 54] });
  const rowGap = 22;
  const listHeight = Math.min(frame.h - title.height - 330, visual.points.length * 190);
  const rowHeight = (listHeight - rowGap * (visual.points.length - 1)) / visual.points.length;
  const top = (frame.h - (title.height + 60 + listHeight)) / 2;
  const listTop = top + title.height + 60;
  return (
    <g>
      <Backdrop palette={palette} frame={frame} />
      <SvgText layout={title} x={MARGIN} y={top} fill={palette.ink} weight={900} />
      {visual.points.map((point, index) => {
        const y = listTop + index * (rowHeight + rowGap);
        const text = layoutText(point, { maxWidth: width - 190, maxLines: rowHeight > 150 ? 3 : 2, sizes: [46, 40, 35, 31] });
        return (
          <g key={index}>
            <rect x={MARGIN} y={y} width={width} height={rowHeight} rx={28} fill={palette.panel} />
            <circle cx={MARGIN + 74} cy={y + rowHeight / 2} r={44} fill={palette.accent} />
            <text x={MARGIN + 74} y={y + rowHeight / 2 + 18} textAnchor="middle" fontFamily={FONT_STACK} fontSize={52} fontWeight={900} fill={palette.accentInk}>
              {index + 1}
            </text>
            <SvgText layout={text} x={MARGIN + 150} y={y + (rowHeight - text.height) / 2} fill={palette.panelInk} weight={700} />
          </g>
        );
      })}
      <Watermark palette={palette} frame={frame} />
    </g>
  );
}
