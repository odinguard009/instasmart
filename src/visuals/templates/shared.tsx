/** Potongan yang dipakai bersama oleh template visual. */
import { useId } from 'react';
import type { Visual } from '@/content/schema';
import type { Frame } from '../frame';
import type { Palette } from '../palettes';
import { FONT_STACK } from '../SvgText';
import { CHAR_WIDTH_CAPS } from '../text';

export interface TemplateProps<V extends Visual = Visual> {
  visual: V;
  palette: Palette;
  frame: Frame;
}

/** Latar gradien + bentuk dekoratif lembut. */
export function Backdrop({ palette, frame, rays = false }: { palette: Palette; frame: Frame; rays?: boolean }) {
  const id = useId();
  const cx = frame.w / 2;
  const cy = frame.h / 2;
  const reach = Math.hypot(frame.w, frame.h);
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={palette.bg} />
          <stop offset="1" stopColor={palette.bgDeep} />
        </linearGradient>
      </defs>
      <rect width={frame.w} height={frame.h} fill={`url(#${id})`} />
      {rays ? (
        Array.from({ length: 12 }, (_, i) => {
          const a1 = (i * 30 * Math.PI) / 180;
          const a2 = ((i * 30 + 15) * Math.PI) / 180;
          return (
            <path
              key={i}
              d={`M ${cx} ${cy} L ${cx + Math.cos(a1) * reach} ${cy + Math.sin(a1) * reach} L ${cx + Math.cos(a2) * reach} ${cy + Math.sin(a2) * reach} Z`}
              fill={palette.ink}
              opacity={0.06}
            />
          );
        })
      ) : (
        <g fill={palette.ink} opacity={0.07}>
          <circle cx={frame.w - 60} cy={90} r={230} />
          <circle cx={70} cy={frame.h - 40} r={300} />
        </g>
      )}
    </g>
  );
}

/** Label kecil berbentuk pil dengan warna aksen. */
export function Pill({ text, x, y, palette, anchor = 'start' }: { text: string; x: number; y: number; palette: Palette; anchor?: 'start' | 'middle' }) {
  const fontSize = 34;
  const label = text.toUpperCase();
  const width = label.length * fontSize * CHAR_WIDTH_CAPS + 56;
  const left = anchor === 'middle' ? x - width / 2 : x;
  return (
    <g>
      <rect x={left} y={y} width={width} height={62} rx={31} fill={palette.accent} />
      <text x={left + width / 2} y={y + 43} textAnchor="middle" fontFamily={FONT_STACK} fontSize={fontSize} fontWeight={800} fill={palette.accentInk} letterSpacing={1.5}>
        {label}
      </text>
    </g>
  );
}

/** Tanda air kecil di pojok bawah. */
export function Watermark({ palette, frame }: { palette: Palette; frame: Frame }) {
  return (
    <text x={frame.w - 48} y={frame.h - 40} textAnchor="end" fontFamily={FONT_STACK} fontSize={26} fontWeight={700} fill={palette.ink} opacity={0.45} letterSpacing={3}>
      INSTASMART
    </text>
  );
}
