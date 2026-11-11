import type { ReactNode } from 'react';
import type { VisualOf } from '@/content/schema';
import { MARGIN } from '../frame';
import type { Palette } from '../palettes';
import { SvgText } from '../SvgText';
import { layoutText } from '../text';
import { Backdrop, Watermark, type TemplateProps } from './shared';

type SceneName = VisualOf<'illustration'>['scene'];
const INK = '#1B1D24';

/** Ilustrasi flat buatan sendiri, digambar di kotak 400x400. Menambah scene: tambah di schema (ILLUSTRATION_SCENES) + di sini. */
const SCENES: Record<SceneName, (palette: Palette) => ReactNode> = {
  timbangan: (p) => (
    <g stroke={INK} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round">
      <rect x={120} y={340} width={160} height={28} rx={10} fill={p.accent} />
      <rect x={188} y={90} width={24} height={250} fill={p.panel} />
      <circle cx={200} cy={70} r={26} fill={p.accent} />
      <path d="M60 120 H340" fill="none" />
      <path d="M80 120 L40 230 H120 Z M320 120 L280 230 H360 Z" fill="none" />
      <path d="M30 230 H130 Q130 280 80 280 Q30 280 30 230 Z M270 230 H370 Q370 280 320 280 Q270 280 270 230 Z" fill={p.accent} />
    </g>
  ),
  palu: (p) => (
    <g stroke={INK} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round">
      <rect x={70} y={320} width={260} height={40} rx={12} fill={p.accent} />
      <rect x={110} y={290} width={180} height={34} rx={10} fill={p.panel} />
      <g transform="rotate(-35 200 180)">
        <rect x={185} y={150} width={30} height={200} rx={12} fill={p.panel} />
        <rect x={110} y={80} width={180} height={90} rx={18} fill={p.accent} />
        <path d="M140 80 V170 M260 80 V170" />
      </g>
      <path d="M318 96 l26 -22 M336 132 l34 -6 M300 66 l8 -32" fill="none" />
    </g>
  ),
  gedung: (p) => (
    <g stroke={INK} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round">
      <path d="M40 140 L200 40 L360 140 Z" fill={p.accent} />
      <rect x={56} y={140} width={288} height={34} fill={p.panel} />
      {[84, 152, 220, 288].map((x) => (
        <rect key={x} x={x} y={174} width={30} height={140} fill={p.panel} />
      ))}
      <rect x={40} y={314} width={320} height={30} fill={p.panel} />
      <rect x={20} y={344} width={360} height={30} rx={6} fill={p.accent} />
      <circle cx={200} cy={100} r={18} fill={p.panel} />
    </g>
  ),
  dokumen: (p) => (
    <g stroke={INK} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round">
      <path d="M90 40 H260 L320 100 V360 H90 Z" fill={p.panel} />
      <path d="M260 40 V100 H320" fill={p.accent} />
      <path d="M130 150 H280 M130 195 H280 M130 240 H230" fill="none" />
      <circle cx={262} cy={300} r={36} fill={p.accent} />
      <path d="M246 300 l12 12 l22 -24" fill="none" />
    </g>
  ),
  bendera: (p) => (
    <g stroke={INK} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round">
      <rect x={84} y={40} width={18} height={330} rx={8} fill={p.panel} />
      <circle cx={93} cy={34} r={16} fill={p.accent} />
      <path d="M102 70 Q170 46 230 70 T350 70 V150 Q290 174 230 150 T102 150 Z" fill="#D62828" />
      <path d="M102 150 Q170 126 230 150 T350 150 V230 Q290 254 230 230 T102 230 Z" fill="#FFFFFF" />
      <rect x={50} y={360} width={90} height={22} rx={8} fill={p.accent} />
    </g>
  ),
};

/** Ilustrasi flat + judul + keterangan. */
export function IllustrationTemplate({ visual, palette, frame }: TemplateProps<VisualOf<'illustration'>>) {
  const width = frame.w - MARGIN * 2;
  const title = layoutText(visual.title, { maxWidth: width, maxLines: 3, sizes: [84, 72, 62, 54] });
  const caption = visual.caption ? layoutText(visual.caption, { maxWidth: width - 40, maxLines: 4, sizes: [42, 37, 33] }) : null;
  const textHeight = title.height + (caption ? caption.height + 28 : 0);
  const art = Math.min(520, frame.h - textHeight - 260);
  const top = (frame.h - (art + 60 + textHeight)) / 2;
  const cx = frame.w / 2;
  return (
    <g>
      <Backdrop palette={palette} frame={frame} />
      <circle cx={cx} cy={top + art / 2} r={art * 0.62} fill={palette.ink} opacity={0.1} />
      <g transform={`translate(${cx - art / 2} ${top}) scale(${art / 400})`}>{SCENES[visual.scene](palette)}</g>
      <SvgText layout={title} x={cx} y={top + art + 60} fill={palette.ink} anchor="middle" weight={900} />
      {caption && <SvgText layout={caption} x={cx} y={top + art + 60 + title.height + 28} fill={palette.ink} anchor="middle" weight={600} opacity={0.92} />}
      <Watermark palette={palette} frame={frame} />
    </g>
  );
}
