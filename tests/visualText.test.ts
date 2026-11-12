import { describe, expect, it } from 'vitest';
import { library } from '@/content';
import type { VisualOf } from '@/content/schema';
import { FRAMES } from '@/visuals/frame';
import { bubbleLayout, comicLayout } from '@/visuals/templates/ComicTemplate';
import { memeTextLayouts } from '@/visuals/templates/MemeTemplate';

/** Kumpulkan semua objek visual bertemplate tertentu di mana pun letaknya dalam kartu (post, slide, story). */
function collect(node: unknown, template: string, found: unknown[]): unknown[] {
  if (Array.isArray(node)) node.forEach((child) => collect(child, template, found));
  else if (node && typeof node === 'object') {
    if ((node as { template?: unknown }).template === template) found.push(node);
    Object.values(node).forEach((child) => collect(child, template, found));
  }
  return found;
}

function visualsOf<T extends 'meme' | 'comic'>(template: T): { id: string; visual: VisualOf<T> }[] {
  return library.cards.flatMap((card) => collect(card, template, []).map((visual) => ({ id: card.id, visual: visual as VisualOf<T> })));
}

// Skema hanya membatasi jumlah karakter; teks yang tetap tidak muat dipotong "…" saat dirender,
// sehingga punchline atau isi hukumnya hilang. Tes ini menangkapnya sebelum sampai ke pengguna.
describe('teks visual tidak terpotong saat dirender', () => {
  const frames = Object.entries(FRAMES);

  it('meme: teks atas dan bawah muat', () => {
    const cut = visualsOf('meme').flatMap(({ id, visual }) =>
      frames.flatMap(([name, frame]) => {
        const { top, bottom } = memeTextLayouts(visual, frame);
        return [top.truncated ? `${id} (${name}, atas)` : null, bottom?.truncated ? `${id} (${name}, bawah)` : null];
      }),
    );
    expect(cut.filter(Boolean)).toEqual([]);
  });

  it('komik: judul dan balon ucapan muat', () => {
    const cut = visualsOf('comic').flatMap(({ id, visual }) =>
      frames.flatMap(([name, frame]) => {
        const { title, boxes } = comicLayout(visual, frame);
        const panels = visual.panels.map((panel, index) => {
          const box = boxes[index];
          return box && bubbleLayout(panel.text, box).truncated ? `${id} (${name}, panel ${index + 1})` : null;
        });
        return [title?.truncated ? `${id} (${name}, judul)` : null, ...panels];
      }),
    );
    expect(cut.filter(Boolean)).toEqual([]);
  });
});
