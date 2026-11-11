/** Kartu ingat-kembali: lihat pertanyaan, buka jawaban, nilai sendiri (menggerakkan jadwal SM-2). */
import { useState } from 'react';
import { SM2_QUALITY } from '@/config/feed';
import type { CardOf, PaletteId } from '@/content/schema';
import { useActions, useStore } from '@/state/store';
import { PALETTES } from '@/visuals/palettes';

const GRADES = [
  { label: 'Lupa', quality: SM2_QUALITY.recallForgot },
  { label: 'Ragu', quality: SM2_QUALITY.recallHard },
  { label: 'Ingat', quality: SM2_QUALITY.recallEasy },
] as const;

export function FlashcardMedia({ card, topicPalette }: { card: CardOf<'review'>; topicPalette: PaletteId }) {
  const graded = useStore((s) => s.day?.answers[card.id]);
  const { recordAnswer } = useActions();
  const [revealed, setRevealed] = useState(false);
  const palette = PALETTES[topicPalette];
  const open = revealed || graded !== undefined;

  return (
    <div className="flex min-h-[100vw] flex-col justify-center gap-4 px-5 py-7 sm:min-h-[430px]" style={{ background: `linear-gradient(160deg, ${palette.bg}, ${palette.bgDeep})`, color: palette.ink }}>
      <p className="w-fit rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider" style={{ background: palette.accent, color: palette.accentInk }}>
        Ingat lagi
      </p>
      <h3 className="text-2xl font-extrabold leading-snug">{card.front}</h3>
      {open ? (
        <div className="animate-fade-up rounded-xl p-4 text-[15px] font-medium leading-relaxed" style={{ background: palette.panel, color: palette.panelInk }}>
          {card.back}
        </div>
      ) : (
        <button type="button" className="h-12 rounded-xl bg-white/95 font-bold text-neutral-900" onClick={() => setRevealed(true)}>
          Lihat jawaban
        </button>
      )}
      {open && graded === undefined && (
        <div>
          <p className="mb-2 text-sm font-semibold">Seberapa ingat kamu?</p>
          <div className="flex gap-2">
            {GRADES.map((grade) => (
              <button
                key={grade.label}
                type="button"
                className="h-12 flex-1 rounded-xl bg-black/35 font-bold"
                onClick={() => recordAnswer({ answerKey: card.id, cardId: card.id, selected: grade.quality, correct: grade.quality >= 3, quality: grade.quality })}
              >
                {grade.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {graded !== undefined && (
        <p className="text-sm font-semibold" role="status">
          Tercatat. Kartu ini akan muncul lagi sesuai jadwal ulang.
        </p>
      )}
    </div>
  );
}
