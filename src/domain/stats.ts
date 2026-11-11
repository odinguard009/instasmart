/** Statistik progres (fungsi murni) untuk Profil, layar Selesai, dan pembobotan topik lemah. */
import type { Card, Topic } from '@/content/schema';
import type { ProgressMap } from '@/state/schema';

export interface Accuracy {
  correct: number;
  wrong: number;
  /** 0..1, atau null jika belum ada jawaban. */
  ratio: number | null;
}

export interface SubTopicAccuracy extends Accuracy {
  topicId: string;
  subTopicId: string;
}

function toAccuracy(correct: number, wrong: number): Accuracy {
  const total = correct + wrong;
  return { correct, wrong, ratio: total === 0 ? null : correct / total };
}

function tally(cards: readonly Card[], progress: ProgressMap, keyOf: (card: Card) => string): Map<string, Accuracy> {
  const sums = new Map<string, { correct: number; wrong: number }>();
  for (const card of cards) {
    const p = progress[card.id];
    if (!p) continue;
    const sum = sums.get(keyOf(card)) ?? { correct: 0, wrong: 0 };
    sum.correct += p.correct;
    sum.wrong += p.wrong;
    sums.set(keyOf(card), sum);
  }
  return new Map([...sums].map(([key, s]) => [key, toAccuracy(s.correct, s.wrong)]));
}

export function accuracyByTopic(cards: readonly Card[], progress: ProgressMap): Map<string, Accuracy> {
  return tally(cards, progress, (card) => card.topicId);
}

export function accuracyBySubTopic(topics: readonly Topic[], cards: readonly Card[], progress: ProgressMap): SubTopicAccuracy[] {
  const bySub = tally(cards, progress, (card) => `${card.topicId}/${card.subTopicId}`);
  return topics.flatMap((topic) =>
    topic.subTopics.map((sub) => ({
      topicId: topic.id,
      subTopicId: sub.id,
      ...(bySub.get(`${topic.id}/${sub.id}`) ?? toAccuracy(0, 0)),
    })),
  );
}

/** Minimal jawaban agar akurasi topik dianggap bermakna. */
export const MIN_ANSWERS_FOR_WEAKNESS = 3;

/** Topik diurutkan dari akurasi terendah; hanya yang sudah punya cukup jawaban. */
export function weakestTopics(cards: readonly Card[], progress: ProgressMap): { topicId: string; ratio: number }[] {
  return [...accuracyByTopic(cards, progress)]
    .filter(([, a]) => a.ratio !== null && a.correct + a.wrong >= MIN_ANSWERS_FOR_WEAKNESS)
    .map(([topicId, a]) => ({ topicId, ratio: a.ratio ?? 0 }))
    .sort((a, b) => a.ratio - b.ratio);
}

export interface Totals {
  cardsSeen: number;
  cardsTotal: number;
  answers: Accuracy;
}

export function totals(cards: readonly Card[], progress: ProgressMap): Totals {
  let seen = 0;
  let correct = 0;
  let wrong = 0;
  for (const card of cards) {
    const p = progress[card.id];
    if (!p) continue;
    if (p.seenCount > 0) seen += 1;
    correct += p.correct;
    wrong += p.wrong;
  }
  return { cardsSeen: seen, cardsTotal: cards.length, answers: toAccuracy(correct, wrong) };
}
