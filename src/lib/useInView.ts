import { useCallback, useRef, useState } from 'react';

/**
 * true selama elemen terlihat minimal `threshold` bagiannya. Kembalikan ref callback untuk dipasang ke elemen.
 * `rootMargin` memperluas area pandang (mis. "0px 0px 2000px 0px" = terpicu 2000px sebelum elemen masuk layar).
 */
export function useInView<T extends Element>(threshold = 0.6, rootMargin = '0px'): [(node: T | null) => void, boolean] {
  const [inView, setInView] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: T | null) => {
      observer.current?.disconnect();
      observer.current = null;
      if (!node || typeof IntersectionObserver === 'undefined') return;
      observer.current = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false), { threshold, rootMargin });
      observer.current.observe(node);
    },
    [threshold, rootMargin],
  );
  return [ref, inView];
}
