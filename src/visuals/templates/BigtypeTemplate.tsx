import type { VisualOf } from '@/content/schema';
import { MARGIN } from '../frame';
import { SvgText } from '../SvgText';
import { layoutText } from '../text';
import { Backdrop, Pill, Watermark, type TemplateProps } from './shared';

/** Tipografi besar: satu kalimat kuat di tengah, dengan keterangan kecil. */
export function BigtypeTemplate({ visual, palette, frame }: TemplateProps<VisualOf<'bigtype'>>) {
  const width = frame.w - MARGIN * 2;
  const sub = visual.sub ? layoutText(visual.sub, { maxWidth: width - 60, maxLines: 5, sizes: [44, 38, 34] }) : null;
  const main = layoutText(visual.text, {
    maxWidth: width,
    maxLines: 6,
    sizes: [150, 128, 110, 94, 80, 68, 58],
    lineHeight: 1.05,
    maxHeight: frame.h - 330 - (sub ? sub.height + 70 : 0),
  });
  const blockHeight = main.height + (sub ? sub.height + 70 : 0);
  const top = (frame.h - blockHeight) / 2 + (visual.kicker ? 30 : 0);
  const cx = frame.w / 2;
  return (
    <g>
      <Backdrop palette={palette} frame={frame} />
      {visual.kicker && <Pill text={visual.kicker} x={cx} y={top - 112} palette={palette} anchor="middle" />}
      <SvgText layout={main} x={cx} y={top} fill={palette.ink} anchor="middle" weight={900} />
      {sub && (
        <g>
          <rect x={cx - 70} y={top + main.height + 22} width={140} height={10} rx={5} fill={palette.accent} />
          <SvgText layout={sub} x={cx} y={top + main.height + 70} fill={palette.ink} anchor="middle" weight={600} opacity={0.92} />
        </g>
      )}
      <Watermark palette={palette} frame={frame} />
    </g>
  );
}
