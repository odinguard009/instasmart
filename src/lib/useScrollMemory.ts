/**
 * Mengingat posisi gulir per rute selama aplikasi terbuka (tidak disimpan ke localStorage).
 * Elemen bertanda data-anchor dipakai sebagai jangkar; layar tanpa jangkar jatuh ke piksel scrollTop.
 */
import { useLayoutEffect, type RefObject } from 'react';
import { anchorDelta, pickAnchor, type AnchorRect, type ScrollAnchor } from '@/domain/scrollAnchor';

interface Memory {
  anchor: ScrollAnchor | null;
  scrollTop: number;
}

const memory = new Map<string, Memory>();

function* anchorRects(root: HTMLElement): Generator<AnchorRect> {
  for (const node of root.querySelectorAll<HTMLElement>('[data-anchor]')) {
    const rect = node.getBoundingClientRect();
    yield { key: node.dataset.anchor ?? '', top: rect.top, bottom: rect.bottom };
  }
}

export function useScrollMemory(ref: RefObject<HTMLElement | null>, routeKey: string): void {
  useLayoutEffect(() => {
    const root = ref.current;
    const saved = memory.get(routeKey);
    if (root && saved) {
      const target = saved.anchor ? root.querySelector<HTMLElement>(`[data-anchor="${CSS.escape(saved.anchor.key)}"]`) : null;
      if (target && saved.anchor) {
        root.scrollTop += anchorDelta(saved.anchor, target.getBoundingClientRect().top, root.getBoundingClientRect().top);
      } else {
        root.scrollTop = saved.scrollTop;
      }
    }
    return () => {
      if (!root) return;
      memory.set(routeKey, { anchor: pickAnchor(anchorRects(root), root.getBoundingClientRect().top), scrollTop: root.scrollTop });
    };
  }, [ref, routeKey]);
}
