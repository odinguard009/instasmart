import { useEffect } from 'react';

/** Ketersediaan suara bergantung perangkat; karena itu caption selalu tampil sebagai cadangan. */
export function narrationSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

/** Membacakan `text` (Web Speech API, id-ID) setiap kali teks berganti, selama `enabled`. */
export function useNarration(text: string, enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !narrationSupported()) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 1.05;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [text, enabled]);
}
