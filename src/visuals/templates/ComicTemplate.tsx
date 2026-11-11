import type { VisualOf } from '@/content/schema';
import { Character } from '../characters/mascots';
import { SvgText } from '../SvgText';
import { layoutText } from '../text';
import { Backdrop, type TemplateProps } from './shared';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const GAP = 22;
const EDGE = 44;

/** Persegi: grid 2 kolom (panel ganjil terakhir melebar). Potret: panel ditumpuk. */
function panelBoxes(count: number, area: Box, stacked: boolean): Box[] {
  if (stacked) {
    const h = (area.h - GAP * (count - 1)) / count;
    return Array.from({ length: count }, (_, i) => ({ x: area.x, y: area.y + i * (h + GAP), w: area.w, h }));
  }
  const rows = Math.ceil(count / 2);
  const h = (area.h - GAP * (rows - 1)) / rows;
  const half = (area.w - GAP) / 2;
  return Array.from({ length: count }, (_, i) => {
    const wide = i === count - 1 && count % 2 === 1;
    return { x: area.x + (i % 2) * (half + GAP), y: area.y + Math.floor(i / 2) * (h + GAP), w: wide ? area.w : half, h };
  });
}

/** Panel komik 3-4 kotak: maskot + balon ucapan per panel. */
export function ComicTemplate({ visual, palette, frame }: TemplateProps<VisualOf<'comic'>>) {
  const title = visual.title ? layoutText(visual.title, { maxWidth: frame.w - EDGE * 2, maxLines: 1, sizes: [56, 48, 40], caps: true }) : null;
  const top = title ? EDGE + title.height + 24 : EDGE;
  const boxes = panelBoxes(visual.panels.length, { x: EDGE, y: top, w: frame.w - EDGE * 2, h: frame.h - top - EDGE }, frame.h > frame.w);
  return (
    <g>
      <Backdrop palette={palette} frame={frame} />
      {title && <SvgText layout={title} x={EDGE} y={EDGE} fill={palette.ink} weight={900} />}
      {visual.panels.map((panel, index) => {
        const box = boxes[index];
        if (!box) return null;
        const bubble = layoutText(panel.text, { maxWidth: box.w - 100, maxLines: 4, sizes: [44, 38, 33, 29] });
        const bubbleHeight = bubble.height + 44;
        const size = Math.min(box.h - bubbleHeight - 60, box.w * 0.6);
        const characterX = index % 2 === 0 ? box.x + 30 : box.x + box.w - size - 30;
        const tailX = characterX + size / 2;
        return (
          <g key={index}>
            <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={22} fill={palette.panel} stroke="#111111" strokeWidth={7} />
            <rect x={box.x + 3.5} y={box.y + box.h * 0.72} width={box.w - 7} height={box.h * 0.28 - 3.5} fill={palette.bg} opacity={0.22} />
            <Character id={panel.character} expression={panel.expression} x={characterX} y={box.y + box.h - size - 14} size={size} flip={index % 2 === 1} />
            <path d={`M ${tailX - 22} ${box.y + 22 + bubbleHeight - 4} L ${tailX} ${box.y + 22 + bubbleHeight + 34} L ${tailX + 22} ${box.y + 22 + bubbleHeight - 4} Z`} fill="#FFFFFF" stroke="#111111" strokeWidth={5} strokeLinejoin="round" />
            <rect x={box.x + 24} y={box.y + 22} width={box.w - 48} height={bubbleHeight} rx={30} fill="#FFFFFF" stroke="#111111" strokeWidth={5} />
            <rect x={tailX - 19} y={box.y + 22 + bubbleHeight - 9} width={38} height={10} fill="#FFFFFF" />
            <SvgText layout={bubble} x={box.x + box.w / 2} y={box.y + 44} fill="#111111" anchor="middle" weight={700} />
          </g>
        );
      })}
    </g>
  );
}
