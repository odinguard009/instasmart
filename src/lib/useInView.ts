import { useCallback, useRef, useState } from 'react';

/** true selama elemen terlihat minimal `threshold` bagiannya. Kembalikan ref callback untuk dipasang ke elemen. */
export function useInView<T extends Element>(threshold = 0.6): [(node: T | null) => void, boolean] {
  const [inView, setInView] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: T | null) => {
      observer.current?.disconnect();
      observer.current = null;
      if (!node || typeof IntersectionObserver === 'undefined') return;
      observer.current = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false), { threshold });
      observer.current.observe(node);
    },
    [threshold],
  );
  return [ref, inView];
}
