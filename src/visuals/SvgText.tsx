import type { TextLayout } from './text';

export const FONT_STACK = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif";

interface SvgTextProps {
  layout: TextLayout;
  /** Titik jangkar horizontal. */
  x: number;
  /** Tepi atas blok teks. */
  y: number;
  fill: string;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  opacity?: number;
  letterSpacing?: number;
}

/** Merender hasil layoutText sebagai <text> multi-baris. */
export function SvgText({ layout, x, y, fill, anchor = 'start', weight = 800, opacity, letterSpacing }: SvgTextProps) {
  const step = layout.fontSize * layout.lineHeight;
  return (
    <text
      x={x}
      y={y + layout.fontSize * 0.82}
      fill={fill}
      fontFamily={FONT_STACK}
      fontSize={layout.fontSize}
      fontWeight={weight}
      textAnchor={anchor}
      opacity={opacity}
      letterSpacing={letterSpacing}
    >
      {layout.lines.map((line, index) => (
        <tspan key={index} x={x} dy={index === 0 ? 0 : step}>
          {line}
        </tspan>
      ))}
    </text>
  );
}
