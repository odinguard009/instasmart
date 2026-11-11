/**
 * Gerak scene sebagai fungsi murni dari waktu: (jenis gerak, waktu lokal) -> angka gaya.
 * Karena deterministik, frame apa pun bisa dirender ulang persis (dipakai juga oleh scripts/render-reels.ts).
 */
import type { Scene } from '@/content/schema';
import { createRng } from '@/lib/rng';

export interface Transform {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  rotate: number;
}

export const IDENTITY: Transform = { opacity: 1, translateX: 0, translateY: 0, scale: 1, rotate: 0 };

export const TRANSITION_MS = 380;
export const TEXT_INTRO_MS = 450;
/** Teks kinetik selesai muncul pada porsi durasi scene ini, sisanya waktu membaca. */
export const TEXT_REVEAL_PORTION = 0.55;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const easeOutCubic = (x: number) => 1 - (1 - clamp01(x)) ** 3;
export function easeOutBack(x: number): number {
  const t = clamp01(x) - 1;
  return 1 + 2.70158 * t ** 3 + 1.70158 * t ** 2;
}

/** Transisi masuk scene (unit translate: persen lebar/tinggi kanvas). */
export function transitionIn(transition: Scene['transition'], localMs: number): Transform {
  const p = easeOutCubic(localMs / TRANSITION_MS);
  switch (transition) {
    case 'cut':
      return IDENTITY;
    case 'fade':
      return { ...IDENTITY, opacity: p };
    case 'slide':
      return { ...IDENTITY, opacity: p, translateX: (1 - p) * 100 };
    case 'zoom':
      return { ...IDENTITY, opacity: p, scale: 1.25 - 0.25 * p };
  }
}

/** Gerak blok teks (untuk `pop` dan `slide-up`; `words`/`type` memakai revealedLength). */
export function textTransform(motion: Scene['textMotion'], localMs: number): Transform {
  const p = localMs / TEXT_INTRO_MS;
  switch (motion) {
    case 'pop':
      return { ...IDENTITY, opacity: clamp01(p * 2), scale: 0.4 + 0.6 * easeOutBack(p) };
    case 'slide-up':
      return { ...IDENTITY, opacity: easeOutCubic(p), translateY: (1 - easeOutCubic(p)) * 30 };
    case 'words':
    case 'type':
      return IDENTITY;
  }
}

/** Jumlah unit teks (kata untuk `words`, karakter untuk `type`) yang sudah tampil. Gerak lain: semua tampil. */
export function revealedLength(motion: Scene['textMotion'], text: string, sceneProgress: number): number {
  const p = clamp01(sceneProgress / TEXT_REVEAL_PORTION);
  if (motion === 'words') {
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.min(words, Math.floor(p * words) + 1);
  }
  if (motion === 'type') return Math.min(text.length, Math.ceil(p * text.length));
  return text.length;
}

/** Potongan teks yang tampil saat ini. */
export function revealedText(motion: Scene['textMotion'], text: string, sceneProgress: number): string {
  const count = revealedLength(motion, text, sceneProgress);
  if (motion === 'words') return text.split(/\s+/).filter(Boolean).slice(0, count).join(' ');
  if (motion === 'type') return text.slice(0, count);
  return text;
}

export function characterTransform(motion: Scene['characterMotion'], localMs: number): Transform {
  const enter = easeOutBack(localMs / 600);
  switch (motion) {
    case 'idle':
      return { ...IDENTITY, translateY: Math.sin(localMs / 700) * 1.2 };
    case 'bounce':
      return { ...IDENTITY, translateY: -Math.abs(Math.sin(localMs / 260)) * 7 };
    case 'nod':
      return { ...IDENTITY, rotate: Math.sin(localMs / 240) * 5 };
    case 'enter-left':
      return { ...IDENTITY, translateX: (enter - 1) * 120 };
    case 'enter-right':
      return { ...IDENTITY, translateX: (1 - enter) * 120 };
  }
}

/** Efek seluruh scene: zoom pelan sepanjang scene, atau goyang singkat di awal. */
export function effectTransform(effect: Scene['effect'], localMs: number, durationMs: number): Transform {
  if (effect === 'zoom') return { ...IDENTITY, scale: 1 + 0.08 * clamp01(localMs / durationMs) };
  if (effect === 'shake') {
    const decay = 1 - clamp01(localMs / 700);
    return { ...IDENTITY, translateX: Math.sin(localMs / 22) * 2.2 * decay, rotate: Math.sin(localMs / 31) * 1.2 * decay };
  }
  return IDENTITY;
}

export interface ConfettiPiece {
  /** Posisi dalam persen kanvas. */
  x: number;
  y: number;
  rotate: number;
  colorIndex: number;
  size: number;
}

export const CONFETTI_COUNT = 28;

/** Konfeti deterministik: posisi tiap keping murni fungsi (seed, waktu). */
export function confettiAt(seed: string, localMs: number): ConfettiPiece[] {
  const rng = createRng(`confetti:${seed}`);
  const t = localMs / 1000;
  return Array.from({ length: CONFETTI_COUNT }, () => {
    const startX = rng() * 100;
    const drift = (rng() - 0.5) * 30;
    const speed = 35 + rng() * 45;
    const delay = rng() * 0.6;
    const spin = (rng() - 0.5) * 720;
    const colorIndex = Math.floor(rng() * 5);
    const size = 1.6 + rng() * 1.8;
    const life = Math.max(0, t - delay);
    return { x: startX + drift * life, y: -8 + speed * life, rotate: spin * life, colorIndex, size };
  });
}

export function toCssTransform(...transforms: Transform[]): { opacity: number; transform: string } {
  const merged = transforms.reduce(
    (acc, t) => ({
      opacity: acc.opacity * t.opacity,
      translateX: acc.translateX + t.translateX,
      translateY: acc.translateY + t.translateY,
      scale: acc.scale * t.scale,
      rotate: acc.rotate + t.rotate,
    }),
    IDENTITY,
  );
  return {
    opacity: merged.opacity,
    transform: `translate(${merged.translateX.toFixed(2)}%, ${merged.translateY.toFixed(2)}%) scale(${merged.scale.toFixed(4)}) rotate(${merged.rotate.toFixed(2)}deg)`,
  };
}
