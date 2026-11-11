import type { VisualOf } from '@/content/schema';
import { Character } from '../characters/mascots';
import { SvgText } from '../SvgText';
import { layoutText, type TextLayout } from '../text';
import { Backdrop, Watermark, type TemplateProps } from './shared';

function MemeText({ layout, x, y }: { layout: TextLayout; x: number; y: number }) {
  return (
    <g stroke="#111111" strokeWidth={14} strokeLinejoin="round" paintOrder="stroke">
      <SvgText layout={layout} x={x} y={y} fill="#FFFFFF" anchor="middle" weight={900} />
    </g>
  );
}

/** "Meme" dengan maskot: teks atas, karakter, teks bawah (punchline). */
export function MemeTemplate({ visual, palette, frame }: TemplateProps<VisualOf<'meme'>>) {
  const options = { maxWidth: frame.w - 110, maxLines: 3, sizes: [78, 68, 58, 50], caps: true, lineHeight: 1.12 };
  const top = layoutText(visual.top, options);
  const bottom = visual.bottom ? layoutText(visual.bottom, options) : null;
  const bottomHeight = bottom ? bottom.height + 70 : 60;
  const size = Math.min(frame.w - 280, frame.h - top.height - bottomHeight - 150);
  const characterTop = 70 + top.height + (frame.h - 70 - top.height - bottomHeight - size) / 2;
  return (
    <g>
      <Backdrop palette={palette} frame={frame} rays />
      <ellipse cx={frame.w / 2} cy={characterTop + size * 0.97} rx={size * 0.36} ry={size * 0.05} fill="#000000" opacity={0.25} />
      <Character id={visual.character} expression={visual.expression} x={(frame.w - size) / 2} y={characterTop} size={size} />
      <MemeText layout={top} x={frame.w / 2} y={64} />
      {bottom && <MemeText layout={bottom} x={frame.w / 2} y={frame.h - bottom.height - 76} />}
      <Watermark palette={palette} frame={frame} />
    </g>
  );
}
