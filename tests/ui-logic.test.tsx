import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { cardSearchText, coverVisual } from '@/cards/coverVisual';
import { library } from '@/content';
import type { Scene, Visual } from '@/content/schema';
import { filterCards } from '@/domain/explore';
import { initialStoryNav, storyNavReducer, type StoryNavAction } from '@/features/stories/storyNav';
import { addDays, diffDays, toDateKey } from '@/lib/date';
import { createRng, shuffle, weightedPick } from '@/lib/rng';
import { ReelStage } from '@/reels/ReelStage';
import { layoutText, wrapText } from '@/visuals/text';
import { visualAltText, VisualView } from '@/visuals/VisualView';

describe('navigasi story', () => {
  const counts = [3, 2];
  const run = (...actions: StoryNavAction[]) => actions.reduce((state, action) => storyNavReducer(state, action, counts), initialStoryNav(0));
  const tick = (deltaMs: number): StoryNavAction => ({ type: 'tick', deltaMs, slideDurationMs: 5000 });

  it('auto-lanjut setelah durasi slide habis', () => {
    expect(run(tick(4999)).position).toEqual({ story: 0, slide: 0, elapsedMs: 4999 });
    expect(run(tick(4999), tick(1)).position).toEqual({ story: 0, slide: 1, elapsedMs: 0 });
  });

  it('tap maju pindah slide, lalu story berikutnya, lalu selesai', () => {
    const next: StoryNavAction = { type: 'next' };
    expect(run(next, next, next).position).toMatchObject({ story: 1, slide: 0 });
    expect(run(next, next, next, next).done).toBe(false);
    expect(run(next, next, next, next, next).done).toBe(true);
  });

  it('tap mundur kembali ke slide/story sebelumnya dan berhenti di awal', () => {
    const next: StoryNavAction = { type: 'next' };
    const prev: StoryNavAction = { type: 'prev' };
    expect(run(next, next, next, prev).position).toMatchObject({ story: 0, slide: 2 });
    expect(run(tick(3000), prev).position).toEqual({ story: 0, slide: 0, elapsedMs: 0 });
  });
});

describe('tata letak teks SVG', () => {
  it('wrapText memenggal per kata dan memotong kata kepanjangan', () => {
    expect(wrapText('satu dua tiga empat', 9)).toEqual(['satu dua', 'tiga', 'empat']);
    expect(wrapText('abcdefghijkl', 5)).toEqual(['abcde', 'fghij', 'kl']);
    expect(wrapText('   ', 5)).toEqual([]);
  });

  it('layoutText memilih font terbesar yang muat, menghormati batas baris dan tinggi', () => {
    const short = layoutText('Halo', { maxWidth: 900, maxLines: 3, sizes: [100, 60, 40] });
    expect(short).toMatchObject({ fontSize: 100, lines: ['Halo'] });
    const long = layoutText('kata '.repeat(30).trim(), { maxWidth: 900, maxLines: 3, sizes: [100, 60, 40] });
    expect(long.fontSize).toBe(40);
    expect(long.lines.length).toBeLessThanOrEqual(3);
    expect(long.lines[2]?.endsWith('…')).toBe(true);
    const capped = layoutText('satu dua tiga empat lima', { maxWidth: 400, maxLines: 6, sizes: [120, 80, 50], maxHeight: 300 });
    expect(capped.height).toBeLessThanOrEqual(300);
  });
});

describe('utilitas tanggal dan acak', () => {
  it('tanggal lokal, tambah hari, selisih hari', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(addDays('2026-02-27', 3)).toBe('2026-03-02');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(diffDays('2026-12-30', '2027-01-02')).toBe(3);
  });

  it('RNG deterministik per seed; shuffle tidak menghilangkan item', () => {
    expect([createRng('a')(), createRng('a')()]).toEqual([createRng('a')(), createRng('a')()]);
    expect(createRng('a')()).not.toBe(createRng('b')());
    expect(shuffle([1, 2, 3, 4, 5], createRng('s')).sort()).toEqual([1, 2, 3, 4, 5]);
    expect(weightedPick([['x', 0], ['y', 3]], createRng('s'))).toBe('y');
    expect(weightedPick([], createRng('s'))).toBeUndefined();
  });
});

describe('Jelajah', () => {
  it('filter format, topik, dan teks bisa digabung', () => {
    const all = library.cards;
    expect(filterCards(all, { text: '', topicId: null, format: 'semua' })).toHaveLength(all.length);
    expect(filterCards(all, { text: '', topicId: null, format: 'reel' }).every((card) => card.type === 'reel' || card.type === 'video')).toBe(true);
    expect(filterCards(all, { text: '', topicId: 'pidana', format: 'kuis' }).every((card) => card.topicId === 'pidana')).toBe(true);
    const found = filterCards(all, { text: 'PASAL 1320', topicId: null, format: 'semua' });
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((card) => cardSearchText(card).includes('1320'))).toBe(true);
    expect(filterCards(all, { text: 'zzzxqy', topicId: null, format: 'semua' })).toEqual([]);
  });
});

describe('render seluruh konten (tanpa peramban)', () => {
  const palette = 'bata';
  const visuals: { id: string; visual: Visual }[] = library.cards.flatMap((card) => {
    const own: Visual[] =
      card.type === 'carousel'
        ? card.slides.flatMap((slide) => (slide.kind === 'visual' ? [slide.visual] : []))
        : card.type === 'story'
          ? card.slides.map((slide) => slide.visual)
          : [];
    return [coverVisual(card), ...own].map((visual) => ({ id: card.id, visual }));
  });

  it('setiap visual di semua kartu dirender jadi SVG di kedua ukuran kanvas, dengan teks alternatif', () => {
    expect(visuals.length).toBeGreaterThan(library.cards.length);
    for (const { id, visual } of visuals) {
      for (const frame of ['square', 'story'] as const) {
        const svg = renderToStaticMarkup(<VisualView visual={visual} topicPalette={palette} frame={frame} />);
        expect(svg.startsWith('<svg'), id).toBe(true);
        expect(svg, id).not.toContain('NaN');
      }
      expect(visualAltText(visual).length, id).toBeGreaterThan(0);
    }
  });

  it('setiap scene reel dirender di awal, tengah, dan akhir tanpa error', () => {
    for (const card of library.cards) {
      if (card.type !== 'reel') continue;
      const total = card.scenes.reduce((sum: number, scene: Scene) => sum + scene.durationMs, 0);
      for (const timeMs of [0, total / 2, total]) {
        const html = renderToStaticMarkup(<ReelStage card={card} timeMs={timeMs} topicPalette={palette} />);
        expect(html, card.id).not.toContain('NaN');
        expect(html.length, card.id).toBeGreaterThan(100);
      }
    }
  });
});

describe('layoutText dan kata panjang', () => {
  it('mengecilkan font daripada memotong kata di tengah', () => {
    const layout = layoutText('Konsensualisme', { maxWidth: 912, maxLines: 6, sizes: [150, 128, 110, 94, 80] });
    expect(layout.lines).toEqual(['Konsensualisme']);
    expect(layout.fontSize).toBeLessThan(150);
  });
});
