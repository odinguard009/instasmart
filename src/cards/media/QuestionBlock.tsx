/** Soal pilihan ganda interaktif: dipakai kuis, polling, slide kuis carousel, dan tantangan cepat. */
import { SM2_QUALITY } from '@/config/feed';
import type { ChoiceQuestion, PaletteId } from '@/content/schema';
import { Icon } from '@/components/Icon';
import { useActions, useStore } from '@/state/store';
import { PALETTES } from '@/visuals/palettes';

interface QuestionBlockProps {
  question: ChoiceQuestion;
  cardId: string;
  /** Kunci jawaban unik (lihat AnswerInput.answerKey). */
  answerKey: string;
  topicPalette: PaletteId;
  variant: 'quiz' | 'poll';
  /** false = jawaban tidak dijadwalkan ulang SM-2 (slide kuis carousel). */
  schedule?: boolean;
  /** Tinggi mengikuti isi (untuk daftar), bukan kotak persegi. */
  compact?: boolean;
}

export function QuestionBlock({ question, cardId, answerKey, topicPalette, variant, schedule = true, compact = false }: QuestionBlockProps) {
  const selected = useStore((s) => s.day?.answers[answerKey]);
  const { recordAnswer } = useActions();
  const palette = PALETTES[topicPalette];
  const answered = selected !== undefined;
  const isCorrect = selected === question.answerIndex;

  const choose = (index: number) => {
    if (answered) return;
    const correct = index === question.answerIndex;
    recordAnswer({
      answerKey,
      cardId,
      selected: index,
      correct,
      quality: schedule ? (correct ? SM2_QUALITY.quizCorrect : SM2_QUALITY.quizWrong) : undefined,
    });
  };

  return (
    <div
      className={`flex w-full flex-col justify-center gap-3 px-5 py-7 ${compact ? '' : 'min-h-[min(100vw,480px)]'}`}
      style={{ background: `linear-gradient(160deg, ${palette.bg}, ${palette.bgDeep})`, color: palette.ink }}
    >
      <p className="w-fit rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider" style={{ background: palette.accent, color: palette.accentInk }}>
        {variant === 'poll' ? 'Kamu pilih mana?' : 'Kuis'}
      </p>
      <h3 className="text-xl font-extrabold leading-snug">{question.question}</h3>
      <div className="mt-1 space-y-2.5">
        {question.options.map((option, index) => {
          const right = answered && index === question.answerIndex;
          const wrong = answered && index === selected && !isCorrect;
          return (
            <button
              key={index}
              type="button"
              disabled={answered}
              onClick={() => choose(index)}
              className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-[15px] font-semibold transition-transform active:scale-[0.98] ${
                right ? 'bg-emerald-500 text-white' : wrong ? 'bg-red-500 text-white' : 'bg-white/95 text-neutral-900'
              } ${answered && !right && !wrong ? 'opacity-60' : ''}`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black/10 text-sm font-bold">
                {right ? <Icon name="check" className="h-4 w-4" /> : wrong ? <Icon name="close" className="h-4 w-4" /> : String.fromCharCode(65 + index)}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="animate-fade-up rounded-xl bg-black/35 p-3.5 text-sm leading-relaxed" role="status">
          <p className="font-bold">{isCorrect ? 'Tepat!' : variant === 'poll' ? 'Jawaban yang tepat berbeda:' : 'Belum tepat.'}</p>
          <p className="mt-1">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
