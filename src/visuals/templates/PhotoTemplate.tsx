import { useId } from 'react';
import type { VisualOf } from '@/content/schema';
import { MARGIN } from '../frame';
import { FONT_STACK, SvgText } from '../SvgText';
import { layoutText } from '../text';
import type { TemplateProps } from './shared';

/** Foto bebas-lisensi sebagai latar + teks + kredit fotografer (wajib tampil). */
export function PhotoTemplate({ visual, frame }: TemplateProps<VisualOf<'photo'>>) {
  const id = useId();
  const overlay = visual.overlayText ? layoutText(visual.overlayText, { maxWidth: frame.w - MARGIN * 2, maxLines: 4, sizes: [84, 72, 62, 54] }) : null;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.35" stopColor="#000000" stopOpacity={0} />
          <stop offset="1" stopColor="#000000" stopOpacity={0.82} />
        </linearGradient>
      </defs>
      <rect width={frame.w} height={frame.h} fill="#1B1D24" />
      <image href={`${import.meta.env.BASE_URL}${visual.src}`} width={frame.w} height={frame.h} preserveAspectRatio="xMidYMid slice" />
      <rect width={frame.w} height={frame.h} fill={`url(#${id})`} />
      {overlay && <SvgText layout={overlay} x={MARGIN} y={frame.h - overlay.height - 120} fill="#FFFFFF" weight={900} />}
      <text x={MARGIN} y={frame.h - 44} fontFamily={FONT_STACK} fontSize={28} fontWeight={600} fill="#FFFFFF" opacity={0.85}>
        Foto: {visual.credit.photographer} / Pexels
      </text>
    </g>
  );
}
