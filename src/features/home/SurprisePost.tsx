/** Kejutan harian di feed: kartu unik, atau tantangan cepat beberapa soal. */
import { useState } from 'react';
import { CardView } from '@/cards/CardView';
import { QuestionBlock } from '@/cards/media/QuestionBlock';
import { Icon } from '@/components/Icon';
import type { CardOf } from '@/content/schema';
import { topicPaletteOf } from '@/content/lookup';
import type { Surprise } from '@/state/schema';
import { cardsByIds } from '@/state/selectors';
import { useStore } from '@/state/store';

function RapidQuiz({ quizzes }: { quizzes: CardOf<'quiz'>[] }) {
  const answers = useStore((s) => s.day?.answers);
  const [step, setStep] = useState(0);
  const quiz = quizzes[step];
  const answeredCount = quizzes.filter((q) => answers?.[q.id] !== undefined).length;
  const score = quizzes.filter((q) => answers?.[q.id] === q.answerIndex).length;
  if (!quiz) return null;
  const currentAnswered = answers?.[quiz.id] !== undefined;

  return (
    <article className="border-b border-line pb-4" aria-label="Kejutan hari ini: tantangan cepat">
      <header className="flex items-center gap-2 bg-brand/15 px-3 py-2.5 text-brand">
        <Icon name="gift" className="h-5 w-5" />
        <p className="flex-1 text-sm font-extrabold uppercase tracking-wide">Kejutan hari ini: tantangan {quizzes.length} soal cepat</p>
        <span className="text-sm font-bold">
          {step + 1}/{quizzes.length}
        </span>
      </header>
      <QuestionBlock key={quiz.id} question={quiz} cardId={quiz.id} answerKey={quiz.id} topicPalette={topicPaletteOf(quiz)} variant="quiz" compact />
      <div className="flex items-center justify-between px-3 pt-3 text-sm">
        <p className="text-muted">
          Sumber: {quiz.source.title}, {quiz.source.reference}
        </p>
        {currentAnswered && step + 1 < quizzes.length && (
          <button type="button" className="h-11 shrink-0 rounded-xl bg-brand px-4 font-bold text-white" onClick={() => setStep(step + 1)}>
            Soal berikutnya
          </button>
        )}
      </div>
      {answeredCount === quizzes.length && (
        <p className="px-3 pt-2 text-sm font-bold" role="status">
          Skor tantangan: {score}/{quizzes.length}. {score === quizzes.length ? 'Sempurna!' : 'Yang salah akan muncul lagi sesuai jadwal ulang.'}
        </p>
      )}
    </article>
  );
}

export function SurprisePost({ surprise }: { surprise: Surprise }) {
  if (surprise.type === 'unique-card') {
    const [card] = cardsByIds([surprise.cardId]);
    return card ? <CardView card={card} ribbon="Kejutan hari ini" /> : null;
  }
  const quizzes = cardsByIds(surprise.cardIds).filter((card): card is CardOf<'quiz'> => card.type === 'quiz');
  return <RapidQuiz quizzes={quizzes} />;
}
