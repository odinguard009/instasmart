/** Wajah ekspresif yang dipakai bersama semua maskot: mata, alis, dan mulut berubah menurut ekspresi. */
import type { Expression } from '@/content/schema';

export interface FaceSpec {
  leftEye: readonly [number, number];
  rightEye: readonly [number, number];
  eyeRadius: number;
  /** Titik tengah mulut. `null` = maskot punya mulut sendiri (mis. paruh). */
  mouth: readonly [number, number] | null;
  mouthWidth: number;
  ink: string;
  /** Warna kelopak mata (biasanya warna kepala). */
  lid: string;
}

interface EyeLook {
  whiteScale: number;
  pupilScale: number;
  pupilDx: number;
  pupilDy: number;
  /** Porsi mata yang tertutup kelopak dari atas (0..1). */
  lidCover: number;
}

const LOOKS: Record<Expression, EyeLook> = {
  happy: { whiteScale: 1, pupilScale: 0.5, pupilDx: 0, pupilDy: 0, lidCover: 0 },
  shock: { whiteScale: 1.18, pupilScale: 0.28, pupilDx: 0, pupilDy: 0, lidCover: 0 },
  think: { whiteScale: 1, pupilScale: 0.45, pupilDx: 0.35, pupilDy: -0.35, lidCover: 0.15 },
  smug: { whiteScale: 1, pupilScale: 0.45, pupilDx: 0.4, pupilDy: 0.1, lidCover: 0.5 },
  sad: { whiteScale: 1, pupilScale: 0.5, pupilDx: 0, pupilDy: 0.35, lidCover: 0.25 },
};

/** Kemiringan alis [kiri, kanan] dalam satuan radius mata (positif = ujung luar turun), dan tinggi tambahan. */
const BROWS: Record<Expression, { tilt: readonly [number, number]; lift: readonly [number, number] } | null> = {
  happy: null,
  shock: { tilt: [0, 0], lift: [0.3, 0.3] },
  think: { tilt: [0.1, -0.35], lift: [0, 0.45] },
  smug: { tilt: [-0.25, -0.25], lift: [-0.1, 0.2] },
  sad: { tilt: [0.45, 0.45], lift: [0.1, 0.1] },
};

/** Segmen lingkaran di atas garis kelopak (tanpa clip-path, supaya aman saat SVG diekspor jadi gambar). */
function lidPath(cx: number, cy: number, r: number, lidHeight: number): string {
  const chordY = cy - r + lidHeight;
  const halfWidth = Math.sqrt(Math.max(0, r * r - (chordY - cy) ** 2));
  const largeArc = lidHeight > r ? 1 : 0;
  return `M ${cx - halfWidth} ${chordY} A ${r} ${r} 0 ${largeArc} 1 ${cx + halfWidth} ${chordY} Z`;
}

function Eye({ center, radius, look, spec }: { center: readonly [number, number]; radius: number; look: EyeLook; spec: FaceSpec }) {
  const [cx, cy] = center;
  const r = radius * look.whiteScale;
  const lidHeight = 2 * r * look.lidCover;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#FFFFFF" stroke={spec.ink} strokeWidth={2.5} />
      <circle cx={cx + look.pupilDx * r * 0.5} cy={cy + look.pupilDy * r * 0.5} r={r * look.pupilScale} fill={spec.ink} />
      <circle cx={cx + look.pupilDx * r * 0.5 - r * 0.15} cy={cy + look.pupilDy * r * 0.5 - r * 0.18} r={r * 0.13} fill="#FFFFFF" />
      {lidHeight > 0 && <path d={lidPath(cx, cy, r + 1.2, lidHeight)} fill={spec.lid} />}
      {lidHeight > 0 && (
        <line x1={cx - r * 0.95} y1={cy - r + lidHeight} x2={cx + r * 0.95} y2={cy - r + lidHeight} stroke={spec.ink} strokeWidth={2.5} strokeLinecap="round" />
      )}
    </g>
  );
}

function Mouth({ expression, spec }: { expression: Expression; spec: FaceSpec }) {
  if (!spec.mouth) return null;
  const [x, y] = spec.mouth;
  const w = spec.mouthWidth / 2;
  const stroke = { stroke: spec.ink, strokeWidth: 3.5, strokeLinecap: 'round' as const, fill: 'none' };
  switch (expression) {
    case 'happy':
      return <path d={`M ${x - w} ${y - 2} Q ${x} ${y + w * 0.95} ${x + w} ${y - 2}`} {...stroke} fill="#7A1E2B" />;
    case 'shock':
      return <ellipse cx={x} cy={y + 2} rx={w * 0.45} ry={w * 0.62} fill="#7A1E2B" stroke={spec.ink} strokeWidth={3} />;
    case 'think':
      return <path d={`M ${x - w * 0.6} ${y + 3} L ${x + w * 0.6} ${y - 3}`} {...stroke} />;
    case 'smug':
      return <path d={`M ${x - w * 0.7} ${y} Q ${x + w * 0.2} ${y + w * 0.5} ${x + w} ${y - w * 0.45}`} {...stroke} />;
    case 'sad':
      return <path d={`M ${x - w * 0.8} ${y + 5} Q ${x} ${y - w * 0.6} ${x + w * 0.8} ${y + 5}`} {...stroke} />;
  }
}

export function Face({ spec, expression }: { spec: FaceSpec; expression: Expression }) {
  const look = LOOKS[expression];
  const brows = BROWS[expression];
  const r = spec.eyeRadius;
  const eyes = [spec.leftEye, spec.rightEye] as const;
  return (
    <g>
      {eyes.map((center, index) => (
        <Eye key={index} center={center} radius={r} look={look} spec={spec} />
      ))}
      {brows &&
        eyes.map(([cx, cy], index) => {
          const outward = index === 0 ? -1 : 1;
          const tilt = (brows.tilt[index] ?? 0) * r;
          const y = cy - r * 1.3 - (brows.lift[index] ?? 0) * r;
          return (
            <line
              key={index}
              x1={cx - outward * r * 0.8}
              y1={y - tilt / 2}
              x2={cx + outward * r * 0.8}
              y2={y + tilt / 2}
              stroke={spec.ink}
              strokeWidth={4.5}
              strokeLinecap="round"
            />
          );
        })}
      <Mouth expression={expression} spec={spec} />
    </g>
  );
}
