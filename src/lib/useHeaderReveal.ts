/** Menghubungkan header lengket dengan area gulir induknya: true = header ditampilkan. */
import { useEffect, useRef, useState, type RefObject } from 'react';
import { nextHeaderVisible } from '@/domain/headerReveal';

/** `ready` harus berubah menjadi true saat header benar-benar dirender (layar bisa merender null dulu). */
export function useHeaderReveal(header: RefObject<HTMLElement | null>, ready: boolean): boolean {
  const [visible, setVisible] = useState(true);
  const state = useRef({ visible: true, top: 0, frame: 0 });

  useEffect(() => {
    const node = header.current;
    const scroller = node?.closest('main');
    if (!node || !scroller) return;
    const current = state.current;
    current.top = scroller.scrollTop;
    const onScroll = () => {
      if (current.frame) return;
      current.frame = requestAnimationFrame(() => {
        current.frame = 0;
        const top = scroller.scrollTop;
        const next = nextHeaderVisible(current.visible, current.top, top, node.offsetHeight);
        current.top = top;
        if (next !== current.visible) {
          current.visible = next;
          setVisible(next);
        }
      });
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(current.frame);
      current.frame = 0;
    };
  }, [header, ready]);

  return visible;
}
