/** Penilaian satu jawaban pilihan ganda: biasa (satu jawaban benar) atau bertingkat (TKP, skor 1-5). */
import { SM2_QUALITY, TKP_GRADING } from '@/config/feed';
import type { ChoiceQuestion } from '@/content/schema';

export interface Grade {
  correct: boolean;
  /** Kualitas SM-2 (0-5). */
  quality: number;
  /** Skor TKP pilihan ini, jika soalnya bertingkat. */
  score?: number;
}

export function gradeChoice(question: ChoiceQuestion, selected: number): Grade {
  const score = question.scores?.[selected];
  if (score === undefined) {
    const correct = selected === question.answerIndex;
    return { correct, quality: correct ? SM2_QUALITY.quizCorrect : SM2_QUALITY.quizWrong };
  }
  return { correct: score >= TKP_GRADING.passScore, quality: TKP_GRADING.qualityByScore[score] ?? 0, score };
}
