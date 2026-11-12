import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { library } from '@/content';
import type { Visual } from '@/content/schema';
import { FRAMES, type FrameName } from '@/visuals/frame';
import { visualAltText, VisualView } from '@/visuals/VisualView';

/** Kumpulkan semua objek visual di mana pun letaknya dalam kartu (post, slide carousel, story, scene). */
function collect(node: unknown, found: Visual[]): Visual[] {
  if (Array.isArray(node)) node.forEach((child) => collect(child, found));
  else if (node && typeof node === 'object') {
    if (typeof (node as { template?: unknown }).template === 'string') found.push(node as Visual);
    Object.values(node).forEach((child) => collect(child, found));
  }
  return found;
}

const ellipses = (text: string) => text.split('…').length - 1;

// Skema hanya membatasi jumlah karakter; teks yang tetap tidak muat dipotong "…" oleh layoutText
// tanpa peringatan, sehingga punchline atau isi hukumnya hilang. Tes ini merender setiap visual di
// semua ukuran bingkai dan membandingkan jumlah elipsis dengan teks aslinya.
describe('teks visual tidak terpotong saat dirender', () => {
  it('semua visual di content/cards muat di setiap bingkai', () => {
    const cut: string[] = [];
    for (const card of library.cards) {
      for (const visual of collect(card, [])) {
        for (const frame of Object.keys(FRAMES) as FrameName[]) {
          const markup = renderToStaticMarkup(<VisualView visual={visual} topicPalette="laut" frame={frame} />).replace(/aria-label="[^"]*"/, '');
          if (ellipses(markup) > ellipses(visualAltText(visual))) cut.push(`${card.id} (${visual.template}, ${frame})`);
        }
      }
    }
    expect(cut).toEqual([]);
  });
});
