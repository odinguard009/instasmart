/** Lembar bawah (bottom sheet) bersama: menu post, laporan, dan filter Jelajah memakai pola yang sama. */
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface BottomSheetProps {
  title: string;
  /** Judul hanya untuk pembaca layar (mis. menu singkat yang tidak butuh judul terlihat). */
  hideTitle?: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ title, hideTitle = false, onClose, children }: BottomSheetProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  // Disimpan di ref: induk sering memberi fungsi baru tiap render, dan efek fokus di bawah hanya boleh jalan sekali.
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // Fokus pindah ke lembar supaya keyboard/pembaca layar langsung berada di dalamnya, lalu kembali saat ditutup.
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus({ preventScroll: true });
    };
  }, []);

  // Portal ke <body>: post memakai content-visibility (containment), yang membuat `fixed` terkurung di dalam post.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-fade-in" role="presentation" onClick={onClose}>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="pb-safe max-h-[85vh] w-full max-w-[480px] overflow-y-auto rounded-t-2xl bg-surface outline-none animate-sheet-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-surface pb-1 pt-2">
          <span aria-hidden className="mx-auto block h-1 w-10 rounded-full bg-line" />
          <h2 id={titleId} className={hideTitle ? 'sr-only' : 'px-5 pt-3 text-center text-base font-bold'}>
            {title}
          </h2>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
