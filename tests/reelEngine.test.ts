import { describe, expect, it } from 'vitest';
import { library } from '@/content';
import { CONFETTI_COUNT, confettiAt, effectTransform, IDENTITY, revealedLength, revealedText, textTransform, TRANSITION_MS, transitionIn } from '@/reels/engine/motion';
import { INITIAL_PLAYER, MAX_TICK_MS, playerReducer, type PlayerState } from '@/reels/engine/player';
import { buildTimeline, locate } from '@/reels/engine/timeline';

const scenes = [{ durationMs: 2000 }, { durationMs: 3000 }, { durationMs: 1500 }];
const timeline = buildTimeline(scenes);

describe('timeline', () => {
  it('menyusun scene berurutan tanpa celah', () => {
    expect(timeline.totalMs).toBe(6500);
    expect(timeline.entries).toEqual([
      { index: 0, startMs: 0, endMs: 2000 },
      { index: 1, startMs: 2000, endMs: 5000 },
      { index: 2, startMs: 5000, endMs: 6500 },
    ]);
  });

  it('locate menemukan scene dan waktu lokal yang tepat', () => {
    expect(locate(timeline, 0)).toMatchObject({ sceneIndex: 0, localMs: 0, sceneProgress: 0, totalProgress: 0 });
    expect(locate(timeline, 1999)).toMatchObject({ sceneIndex: 0, localMs: 1999 });
    expect(locate(timeline, 2000)).toMatchObject({ sceneIndex: 1, localMs: 0 });
    expect(locate(timeline, 3500)).toMatchObject({ sceneIndex: 1, localMs: 1500, sceneProgress: 0.5 });
    expect(locate(timeline, 5750).sceneIndex).toBe(2);
    expect(locate(timeline, 3250).totalProgress).toBeCloseTo(0.5);
  });

  it('locate menjepit waktu di luar rentang', () => {
    expect(locate(timeline, -500)).toMatchObject({ sceneIndex: 0, localMs: 0 });
    expect(locate(timeline, 99_999)).toMatchObject({ sceneIndex: 2, sceneProgress: 1, totalProgress: 1 });
  });

  it('reel kosong tidak membuat error', () => {
    expect(locate(buildTimeline([]), 100)).toEqual({ sceneIndex: 0, localMs: 0, sceneProgress: 0, totalProgress: 0 });
  });

  it('urutan scene saat diputar dari awal sampai akhir selalu naik', () => {
    const visited: number[] = [];
    for (let t = 0; t < timeline.totalMs; t += 100) visited.push(locate(timeline, t).sceneIndex);
    expect([...new Set(visited)]).toEqual([0, 1, 2]);
    expect(visited).toEqual([...visited].sort((a, b) => a - b));
  });
});

describe('player', () => {
  const playing: PlayerState = { ...INITIAL_PLAYER, playing: true };
  const run = (state: PlayerState, ...actions: Parameters<typeof playerReducer>[1][]) => actions.reduce((s, a) => playerReducer(s, a, timeline.totalMs), state);

  it('tick memajukan waktu hanya saat sedang diputar', () => {
    expect(run(playing, { type: 'tick', deltaMs: 16 }).timeMs).toBe(16);
    expect(run(INITIAL_PLAYER, { type: 'tick', deltaMs: 16 })).toBe(INITIAL_PLAYER);
  });

  it('toggle, play, pause', () => {
    expect(run(playing, { type: 'toggle' }).playing).toBe(false);
    expect(run(INITIAL_PLAYER, { type: 'play' }).playing).toBe(true);
    expect(run(playing, { type: 'pause' }, { type: 'tick', deltaMs: 100 }).timeMs).toBe(0);
  });

  it('mengulang dari awal saat tamat dan menghitung putaran', () => {
    const nearEnd = run(playing, { type: 'seek', timeMs: 6450 });
    const looped = run(nearEnd, { type: 'tick', deltaMs: 100 });
    expect(looped.loops).toBe(1);
    expect(looped.timeMs).toBe(50);
  });

  it('lompatan frame besar dibatasi', () => {
    expect(run(playing, { type: 'tick', deltaMs: 60_000 }).timeMs).toBe(MAX_TICK_MS);
    expect(run(playing, { type: 'tick', deltaMs: -50 }).timeMs).toBe(0);
  });

  it('seek dijepit ke durasi; restart kembali ke nol', () => {
    expect(run(playing, { type: 'seek', timeMs: 999_999 }).timeMs).toBe(timeline.totalMs);
    expect(run(playing, { type: 'seek', timeMs: 3000 }, { type: 'restart' }).timeMs).toBe(0);
  });
});

describe('motion', () => {
  it('transisi berakhir pada keadaan netral', () => {
    for (const transition of ['cut', 'fade', 'slide', 'zoom'] as const) {
      const end = transitionIn(transition, TRANSITION_MS);
      expect(end.opacity).toBeCloseTo(1);
      expect(end.translateX).toBeCloseTo(0);
      expect(end.scale).toBeCloseTo(1);
    }
    expect(transitionIn('fade', 0).opacity).toBe(0);
    expect(transitionIn('slide', 0).translateX).toBe(100);
    expect(transitionIn('cut', 0)).toEqual(IDENTITY);
  });

  it('teks `words` muncul kata demi kata dan lengkap sebelum scene selesai', () => {
    const text = 'satu dua tiga empat lima';
    expect(revealedText('words', text, 0)).toBe('satu');
    const counts = [0, 0.1, 0.2, 0.3, 0.4, 0.55, 1].map((p) => revealedLength('words', text, p));
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    expect(revealedText('words', text, 0.55)).toBe(text);
    expect(revealedText('words', text, 1)).toBe(text);
  });

  it('teks `type` muncul per karakter; `pop` dan `slide-up` langsung utuh', () => {
    expect(revealedText('type', 'Halo', 0)).toBe('');
    expect(revealedText('type', 'Halo dunia', 0.275)).toBe('Halo ');
    expect(revealedText('type', 'Halo', 1)).toBe('Halo');
    expect(revealedText('pop', 'Halo', 0)).toBe('Halo');
    expect(textTransform('pop', 5000).scale).toBeCloseTo(1);
    expect(textTransform('slide-up', 5000).translateY).toBeCloseTo(0);
  });

  it('efek zoom membesar perlahan; shake mereda', () => {
    expect(effectTransform('zoom', 0, 4000).scale).toBe(1);
    expect(effectTransform('zoom', 4000, 4000).scale).toBeCloseTo(1.08);
    const settled = effectTransform('shake', 5000, 6000);
    expect(settled.translateX).toBeCloseTo(0);
    expect(settled.rotate).toBeCloseTo(0);
    expect(Math.abs(effectTransform('shake', 30, 6000).translateX)).toBeGreaterThan(0);
    expect(effectTransform(undefined, 100, 1000)).toEqual(IDENTITY);
  });

  it('konfeti deterministik dan jatuh ke bawah seiring waktu', () => {
    const early = confettiAt('a', 500);
    expect(early).toHaveLength(CONFETTI_COUNT);
    expect(confettiAt('a', 500)).toEqual(early);
    expect(confettiAt('b', 500)).not.toEqual(early);
    const late = confettiAt('a', 2500);
    late.forEach((piece, index) => expect(piece.y).toBeGreaterThanOrEqual((early[index] as (typeof early)[number]).y));
  });
});

describe('reel di konten asli', () => {
  const reels = library.cards.filter((card) => card.type === 'reel');

  it('setiap reel berdurasi wajar (8-60 detik) dan tiap scene bisa ditemukan di timeline', () => {
    expect(reels.length).toBeGreaterThan(0);
    for (const reel of reels) {
      const reelTimeline = buildTimeline(reel.scenes);
      expect(reelTimeline.totalMs, reel.id).toBeGreaterThanOrEqual(8000);
      expect(reelTimeline.totalMs, reel.id).toBeLessThanOrEqual(60_000);
      reelTimeline.entries.forEach((entry) => expect(locate(reelTimeline, entry.startMs).sceneIndex).toBe(entry.index));
    }
  });
});
