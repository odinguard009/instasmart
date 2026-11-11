/** Pabrik data uji: kartu sintetis minimal yang lolos skema. */
import { cardSchema, type Card, type CardType } from '@/content/schema';

const SOURCE = { title: 'Peraturan Uji', reference: 'Pasal 1' };
const BASE = { topicId: 'topik-a', subTopicId: 'sub-a', account: 'akun.uji', source: SOURCE, status: 'draft', createdAt: '2026-01-01' } as const;
const VISUAL = { template: 'bigtype', text: 'Teks uji' } as const;
const QUESTION = { question: 'Pertanyaan?', options: ['A', 'B', 'C'], answerIndex: 1, explanation: 'Karena B.' };
const SCENE = { durationMs: 2000, text: 'Halo', caption: 'Halo dunia' };

const BODIES: Record<CardType, Record<string, unknown>> = {
  fact: { visual: VISUAL, caption: 'Fakta' },
  humor: { visual: VISUAL, caption: 'Lucu', teaches: 'Konsep uji' },
  mnemonic: { visual: VISUAL, caption: 'Hafalan', phrase: 'ABC', expansion: ['A', 'B'] },
  quiz: QUESTION,
  poll: QUESTION,
  carousel: { caption: 'Geser', slides: [{ kind: 'visual', visual: VISUAL }, { kind: 'quiz', ...QUESTION }] },
  reel: { caption: 'Reel', scenes: [SCENE, SCENE] },
  video: { caption: 'Video', src: 'videos/uji.mp4' },
  story: { title: 'Story', slides: [{ visual: VISUAL }, { visual: VISUAL }, { visual: VISUAL }, { visual: VISUAL }] },
  review: { front: 'Depan', back: 'Belakang' },
};

export function rawCard(type: CardType, id: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...BASE, id, type, ...BODIES[type], ...overrides };
}

export function makeCard(type: CardType, id: string, overrides: Record<string, unknown> = {}): Card {
  return cardSchema.parse(rawCard(type, id, overrides));
}

/** Pustaka sintetis yang cukup besar dan beragam untuk menguji aturan feed. */
export function makeLibrary(): Card[] {
  const counts: Partial<Record<CardType, number>> = { fact: 14, quiz: 16, humor: 10, mnemonic: 5, carousel: 6, poll: 5, reel: 8, review: 5, story: 6, video: 1 };
  const topics = ['topik-a', 'topik-b', 'topik-c', 'topik-d'];
  const cards: Card[] = [];
  for (const [type, count] of Object.entries(counts) as [CardType, number][]) {
    for (let i = 0; i < count; i++) {
      cards.push(makeCard(type, `${type}-${i}`, { topicId: topics[i % topics.length], tags: type === 'fact' && i < 2 ? ['kejutan'] : undefined }));
    }
  }
  return cards;
}
