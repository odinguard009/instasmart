/**
 * Maskot orisinal Instasmart, digambar tangan dengan SVG (bukan karakter berhak cipta).
 * Tiap maskot digambar di kotak 200x200 dan memakai <Face> bersama untuk ekspresi.
 */
import type { ReactNode } from 'react';
import type { CharacterId, Expression } from '@/content/schema';
import { Face, type FaceSpec } from './Face';

const INK = '#2B1B12';

function Owl({ expression }: { expression: Expression }) {
  const body = '#8B5E3C';
  const face: FaceSpec = { leftEye: [74, 84], rightEye: [126, 84], eyeRadius: 17, mouth: null, mouthWidth: 0, ink: INK, lid: '#F3E3C3' };
  const beakOpen = expression === 'shock';
  return (
    <g>
      <path d="M52 52 L44 20 L78 40 Z M148 52 L156 20 L122 40 Z" fill={body} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={100} cy={112} rx={64} ry={72} fill={body} stroke={INK} strokeWidth={3} />
      <ellipse cx={38} cy={126} rx={15} ry={36} fill="#6F4A2E" stroke={INK} strokeWidth={3} transform="rotate(12 38 126)" />
      <ellipse cx={162} cy={126} rx={15} ry={36} fill="#6F4A2E" stroke={INK} strokeWidth={3} transform="rotate(-12 162 126)" />
      <ellipse cx={100} cy={140} rx={40} ry={40} fill="#F3E3C3" />
      {/* toga hakim + bef putih */}
      <path d="M48 150 Q100 122 152 150 Q150 178 132 184 L68 184 Q50 178 48 150 Z" fill="#1E1E24" stroke={INK} strokeWidth={3} />
      <path d="M90 136 L98 168 L84 168 Z M110 136 L116 168 L102 168 Z" fill="#FFFFFF" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <circle cx={74} cy={84} r={27} fill="#F3E3C3" stroke={INK} strokeWidth={3} />
      <circle cx={126} cy={84} r={27} fill="#F3E3C3" stroke={INK} strokeWidth={3} />
      <Face spec={face} expression={expression} />
      {beakOpen ? (
        <path d="M90 104 L110 104 L100 112 Z M92 116 L108 116 L100 126 Z" fill="#F2A33A" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      ) : (
        <path d="M90 104 L110 104 L100 120 Z" fill="#F2A33A" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      )}
      <path d="M78 186 l-8 8 M78 186 l0 9 M78 186 l8 8 M122 186 l-8 8 M122 186 l0 9 M122 186 l8 8" stroke="#F2A33A" strokeWidth={5} strokeLinecap="round" />
    </g>
  );
}

function Cat({ expression }: { expression: Expression }) {
  const fur = '#F2994A';
  const face: FaceSpec = { leftEye: [80, 78], rightEye: [120, 78], eyeRadius: 12, mouth: [100, 106], mouthWidth: 22, ink: INK, lid: fur };
  return (
    <g>
      <path d="M150 170 Q186 164 176 128" fill="none" stroke={INK} strokeWidth={18} strokeLinecap="round" />
      <path d="M150 170 Q186 164 176 128" fill="none" stroke={fur} strokeWidth={12} strokeLinecap="round" />
      <ellipse cx={100} cy={158} rx={44} ry={36} fill={fur} stroke={INK} strokeWidth={3} />
      <ellipse cx={100} cy={166} rx={24} ry={24} fill="#FFF3E0" />
      <path d="M58 60 L52 18 L88 44 Z M142 60 L148 18 L112 44 Z" fill={fur} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M62 44 L60 28 L74 40 Z M138 44 L140 28 L126 40 Z" fill="#FFC9A8" />
      <ellipse cx={100} cy={82} rx={52} ry={46} fill={fur} stroke={INK} strokeWidth={3} />
      <path d="M86 44 l4 14 M100 40 l0 16 M114 44 l-4 14" stroke="#C96F22" strokeWidth={4} strokeLinecap="round" />
      <ellipse cx={100} cy={102} rx={22} ry={15} fill="#FFF3E0" />
      <Face spec={face} expression={expression} />
      {/* kacamata panitera */}
      <circle cx={80} cy={78} r={17} fill="none" stroke="#1E1E24" strokeWidth={3.5} />
      <circle cx={120} cy={78} r={17} fill="none" stroke="#1E1E24" strokeWidth={3.5} />
      <path d="M97 78 H103" stroke="#1E1E24" strokeWidth={3.5} />
      <path d="M96 94 L104 94 L100 99 Z" fill="#E86A6A" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <path d="M72 100 H46 M72 106 L48 112 M128 100 H154 M128 106 L152 112" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      <path d="M68 128 Q100 142 132 128" fill="none" stroke="#2D6CDF" strokeWidth={7} strokeLinecap="round" />
      <circle cx={100} cy={139} r={6} fill="#FFD166" stroke={INK} strokeWidth={2} />
    </g>
  );
}

/** [x, y, arah] tiap kaki cicak: arah -1 = kiri, 1 = kanan. */
const GECKO_LIMBS: readonly (readonly [number, number, -1 | 1])[] = [
  [58, 138, -1],
  [142, 138, 1],
  [66, 182, -1],
  [134, 182, 1],
];

function Gecko({ expression }: { expression: Expression }) {
  const skin = '#6CCB5F';
  const face: FaceSpec = { leftEye: [70, 62], rightEye: [130, 62], eyeRadius: 17, mouth: [100, 104], mouthWidth: 34, ink: '#17361A', lid: skin };
  const ink = face.ink;
  return (
    <g>
      <path d="M118 168 Q176 190 178 150 Q180 126 160 132" fill="none" stroke={ink} strokeWidth={17} strokeLinecap="round" />
      <path d="M118 168 Q176 190 178 150 Q180 126 160 132" fill="none" stroke={skin} strokeWidth={12} strokeLinecap="round" />
      <ellipse cx={100} cy={150} rx={36} ry={40} fill={skin} stroke={ink} strokeWidth={3} />
      <ellipse cx={100} cy={156} rx={20} ry={26} fill="#E6F7C8" />
      {GECKO_LIMBS.map(([x, y, dir], index) => (
        <g key={index}>
          <path d={`M ${x - dir * 14} ${y - 6} L ${x} ${y}`} stroke={ink} strokeWidth={12} strokeLinecap="round" />
          <path d={`M ${x - dir * 14} ${y - 6} L ${x} ${y}`} stroke={skin} strokeWidth={7} strokeLinecap="round" />
          <circle cx={x + dir * 5} cy={y - 5} r={5} fill={skin} stroke={ink} strokeWidth={2.5} />
          <circle cx={x + dir * 7} cy={y + 4} r={5} fill={skin} stroke={ink} strokeWidth={2.5} />
        </g>
      ))}
      <ellipse cx={100} cy={86} rx={58} ry={40} fill={skin} stroke={ink} strokeWidth={3} />
      <circle cx={70} cy={62} r={24} fill={skin} stroke={ink} strokeWidth={3} />
      <circle cx={130} cy={62} r={24} fill={skin} stroke={ink} strokeWidth={3} />
      <circle cx={84} cy={110} r={4} fill="#3F9A3A" />
      <circle cx={120} cy={114} r={3} fill="#3F9A3A" />
      <circle cx={146} cy={92} r={4} fill="#3F9A3A" />
      <Face spec={face} expression={expression} />
      <path d="M94 90 l-2 3 M106 90 l2 3" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

function Kancil({ expression }: { expression: Expression }) {
  const fur = '#C8925A';
  const face: FaceSpec = { leftEye: [80, 78], rightEye: [120, 78], eyeRadius: 12, mouth: [100, 116], mouthWidth: 20, ink: INK, lid: fur };
  return (
    <g>
      <path d="M62 62 Q22 40 30 12 Q62 22 76 52 Z M138 62 Q178 40 170 12 Q138 22 124 52 Z" fill={fur} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M58 52 Q38 38 38 22 Q56 30 66 48 Z M142 52 Q162 38 162 22 Q144 30 134 48 Z" fill="#F2C9A0" />
      <path d="M70 136 Q100 122 130 136 L138 190 L62 190 Z" fill={fur} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M84 140 Q100 132 116 140 L114 176 Q100 184 86 176 Z" fill="#FFF3E0" />
      {/* dasi advokat */}
      <path d="M100 136 L108 146 L104 176 L100 182 L96 176 L92 146 Z" fill="#C0362C" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M86 132 L100 140 L114 132" fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={100} cy={84} rx={42} ry={46} fill={fur} stroke={INK} strokeWidth={3} />
      <ellipse cx={100} cy={108} rx={24} ry={20} fill="#F2DDC0" />
      <circle cx={70} cy={98} r={3} fill="#FFF3E0" />
      <circle cx={62} cy={88} r={2.5} fill="#FFF3E0" />
      <circle cx={132} cy={98} r={3} fill="#FFF3E0" />
      <circle cx={139} cy={88} r={2.5} fill="#FFF3E0" />
      <Face spec={face} expression={expression} />
      <ellipse cx={100} cy={101} rx={8} ry={5.5} fill={INK} />
    </g>
  );
}

export interface Mascot {
  /** Nama panggung maskot. */
  name: string;
  role: string;
  render: (expression: Expression) => ReactNode;
}

/** Registry maskot. Menambah maskot: tambah id di schema.ts (CHARACTER_IDS), lalu satu entri di sini. */
export const MASCOTS: Record<CharacterId, Mascot> = {
  owl: { name: 'Pak Hoot', role: 'Burung hantu hakim', render: (expression) => <Owl expression={expression} /> },
  cat: { name: 'Mpus', role: 'Kucing panitera', render: (expression) => <Cat expression={expression} /> },
  gecko: { name: 'Cika', role: 'Cicak saksi di dinding', render: (expression) => <Gecko expression={expression} /> },
  kancil: { name: 'Bang Kancil', role: 'Kancil advokat', render: (expression) => <Kancil expression={expression} /> },
};

interface CharacterProps {
  id: CharacterId;
  expression?: Expression;
  /** Posisi kiri-atas dan ukuran sisi di dalam SVG induk. */
  x: number;
  y: number;
  size: number;
  flip?: boolean;
}

/** Menempatkan maskot di dalam SVG lain (template visual). */
export function Character({ id, expression = 'happy', x, y, size, flip = false }: CharacterProps) {
  const scale = size / 200;
  const transform = flip ? `translate(${x + size} ${y}) scale(${-scale} ${scale})` : `translate(${x} ${y}) scale(${scale})`;
  return <g transform={transform}>{MASCOTS[id].render(expression)}</g>;
}

/** Maskot sebagai elemen mandiri (avatar, scene reel). */
export function CharacterSvg({ id, expression = 'happy', className }: { id: CharacterId; expression?: Expression; className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={`${MASCOTS[id].name}, ${MASCOTS[id].role}`}>
      {MASCOTS[id].render(expression)}
    </svg>
  );
}
