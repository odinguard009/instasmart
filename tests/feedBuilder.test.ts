import { describe, expect, it } from 'vitest';
import { FEED_CONFIG } from '@/config/feed';
import { library } from '@/content';
import type { Card } from '@/content/schema';
import { arrangeForVariety, buildDailyPlan, canExtend, extendPlan, formatLookup, interleaveEvenly, longestRun, planCardIds, type ItemFormat } from '@/domain/feedBuilder';
import { addDays } from '@/lib/date';
import { createRng } from '@/lib/rng';
import type { DailyPlan, ProgressMap } from '@/state/schema';
import { makeCard, makeLibrary } from './fixtures';

const TODAY = '2026-03-10';
const cards = makeLibrary();

function formats(plan: DailyPlan, source: readonly Card[]): ItemFormat[] {
  return plan.items.map(formatLookup(source));
}

/** Menjalankan rencana untuk banyak tanggal supaya aturan teruji pada banyak seed. */
function manyPlans(source: readonly Card[], quota = FEED_CONFIG.defaultQuota, progress: ProgressMap = {}): DailyPlan[] {
  return Array.from({ length: 40 }, (_, day) => buildDailyPlan({ cards: source, progress, today: addDays(TODAY, day), quota }));
}

describe('kuota', () => {
  it.each([5, 8, 20, 33, 40])('panjang feed persis sama dengan kuota %i', (quota) => {
    for (const plan of manyPlans(cards, quota)) expect(plan.items).toHaveLength(quota);
  });

  it('pustaka lebih kecil dari kuota: feed berisi semua yang ada, tidak pernah mengulang kartu', () => {
    const small = [makeCard('fact', 'f1'), makeCard('quiz', 'q1'), makeCard('humor', 'h1')];
    const plan = buildDailyPlan({ cards: small, progress: {}, today: TODAY, quota: 20 });
    expect(plan.items).toHaveLength(3);
  });

  it('tidak ada kartu yang muncul dua kali dalam satu hari (termasuk kejutan, story, penutup)', () => {
    for (const plan of manyPlans(cards)) {
      const ids = plan.items.flatMap((item) => (item.kind === 'card' ? [item.cardId] : item.surprise.type === 'unique-card' ? [item.surprise.cardId] : item.surprise.cardIds));
      const all = [...ids, ...plan.storyIds, ...(plan.closingCardId ? [plan.closingCardId] : [])];
      expect(new Set(all).size).toBe(all.length);
      expect(planCardIds(plan).size).toBe(all.length);
    }
  });

  it('story tidak pernah masuk feed; jumlah story harian sesuai konfigurasi', () => {
    for (const plan of manyPlans(cards)) {
      expect(formats(plan, cards)).not.toContain('story');
      expect(plan.storyIds).toHaveLength(FEED_CONFIG.storiesPerDay);
    }
  });

  it('deterministik: tanggal dan data yang sama menghasilkan rencana yang sama', () => {
    const input = { cards, progress: {}, today: TODAY, quota: 20 };
    expect(buildDailyPlan(input)).toEqual(buildDailyPlan(input));
    expect(buildDailyPlan({ ...input, today: addDays(TODAY, 1) }).items).not.toEqual(buildDailyPlan(input).items);
  });
});

describe('aturan variasi (anti-bosan)', () => {
  it(`tidak ada format yang sama lebih dari ${FEED_CONFIG.maxSameTypeRun} kali berturut-turut`, () => {
    for (const plan of manyPlans(cards)) expect(longestRun(formats(plan, cards))).toBeLessThanOrEqual(FEED_CONFIG.maxSameTypeRun);
  });

  it('rasio humor sekitar 1 dari tiap 4 item (1 humor per 3-4 item belajar)', () => {
    for (const plan of manyPlans(cards)) {
      const humor = formats(plan, cards).filter((format) => format === 'humor').length;
      expect(humor).toBe(Math.round(FEED_CONFIG.defaultQuota / FEED_CONFIG.humorEvery));
    }
  });

  it('humor tersebar, tidak pernah bersebelahan', () => {
    for (const plan of manyPlans(cards)) {
      const list = formats(plan, cards);
      list.forEach((format, index) => expect(format === 'humor' && list[index + 1] === 'humor').toBe(false));
    }
  });

  it('reel, carousel, dan polling selalu hadir sesuai minimum harian', () => {
    for (const plan of manyPlans(cards)) {
      const list = formats(plan, cards);
      for (const [type, minimum] of Object.entries(FEED_CONFIG.minPerDay)) {
        expect(list.filter((format) => format === type).length).toBeGreaterThanOrEqual(minimum);
      }
    }
  });

  it('ada tepat satu kejutan harian; keduanya (kartu unik dan tantangan cepat) bisa muncul', () => {
    const kinds = new Set<string>();
    for (const plan of manyPlans(cards)) {
      const surprises = plan.items.filter((item) => item.kind === 'surprise');
      expect(surprises).toHaveLength(1);
      const [surprise] = surprises;
      if (surprise?.kind === 'surprise') {
        kinds.add(surprise.surprise.type);
        if (surprise.surprise.type === 'rapid-quiz') expect(surprise.surprise.cardIds).toHaveLength(FEED_CONFIG.rapidQuizSize);
      }
    }
    expect(kinds).toEqual(new Set(['unique-card', 'rapid-quiz']));
  });

  it('kuota kecil tidak mendapat kejutan', () => {
    const plan = buildDailyPlan({ cards, progress: {}, today: TODAY, quota: FEED_CONFIG.surpriseMinQuota - 1 });
    expect(plan.items.every((item) => item.kind === 'card')).toBe(true);
  });

  it('kejutan penutup disediakan dan bukan bagian dari feed', () => {
    const plan = buildDailyPlan({ cards, progress: {}, today: TODAY, quota: 20 });
    expect(plan.closingCardId).not.toBeNull();
    expect(plan.items.some((item) => item.kind === 'card' && item.cardId === plan.closingCardId)).toBe(false);
  });
});

describe('kartu ulang (review SM-2)', () => {
  const dueProgress = (ids: string[], dueDate: string): ProgressMap =>
    Object.fromEntries(ids.map((id) => [id, { seenCount: 1, lastSeen: '2026-03-01', correct: 0, wrong: 1, sm2: { repetitions: 0, intervalDays: 1, easeFactor: 2.5, dueDate } }]));

  it('kartu yang jatuh tempo masuk feed dan ditandai isReview', () => {
    const plan = buildDailyPlan({ cards, progress: dueProgress(['quiz-0', 'poll-1', 'review-2'], '2026-03-09'), today: TODAY, quota: 20 });
    const reviews = plan.items.flatMap((item) => (item.kind === 'card' && item.isReview ? [item.cardId] : []));
    expect(reviews.sort()).toEqual(['poll-1', 'quiz-0', 'review-2']);
  });

  it('kartu yang belum jatuh tempo tidak ditandai review', () => {
    const plan = buildDailyPlan({ cards, progress: dueProgress(['quiz-0'], '2026-03-20'), today: TODAY, quota: 20 });
    expect(plan.items.some((item) => item.kind === 'card' && item.isReview)).toBe(false);
  });

  it('porsi review dibatasi maxReviewShare, yang paling lama menunggu didahulukan', () => {
    const ids = cards.filter((card) => card.type === 'quiz').map((card) => card.id);
    const progress = dueProgress(ids, '2026-03-09');
    const oldest = ids[5] as string;
    progress[oldest] = { ...(progress[oldest] as ProgressMap[string]), sm2: { repetitions: 0, intervalDays: 1, easeFactor: 2.5, dueDate: '2026-01-01' } };
    const plan = buildDailyPlan({ cards, progress, today: TODAY, quota: 20 });
    const reviews = plan.items.flatMap((item) => (item.kind === 'card' && item.isReview ? [item.cardId] : []));
    expect(reviews).toHaveLength(Math.floor(20 * FEED_CONFIG.maxReviewShare));
    expect(reviews).toContain(oldest);
  });

  it('kartu baru didahulukan daripada kartu yang sudah pernah dilihat', () => {
    const seen: ProgressMap = Object.fromEntries(
      cards.filter((card) => card.type === 'fact').slice(0, 10).map((card) => [card.id, { seenCount: 3, lastSeen: '2026-03-09', correct: 0, wrong: 0 }]),
    );
    const plan = buildDailyPlan({ cards, progress: seen, today: TODAY, quota: 20 });
    const shownFacts = plan.items.flatMap((item) => (item.kind === 'card' && item.cardId.startsWith('fact-') ? [item.cardId] : []));
    expect(shownFacts.length).toBeGreaterThan(0);
    for (const id of shownFacts) expect(seen[id]).toBeUndefined();
  });
});

describe('tambah item (extendPlan)', () => {
  const base = buildDailyPlan({ cards, progress: {}, today: TODAY, quota: 20 });
  const input = { cards, progress: {}, today: TODAY, quota: 20 };

  it('menambah tepat satu paket tanpa mengulang kartu hari ini dan tanpa kejutan baru', () => {
    const extended = extendPlan(base, input);
    expect(extended.items).toHaveLength(20 + FEED_CONFIG.extraBatchSize);
    expect(extended.items.slice(0, 20)).toEqual(base.items);
    expect(extended.items.filter((item) => item.kind === 'surprise')).toHaveLength(1);
    expect(new Set(extended.items.map((item) => item.key)).size).toBe(extended.items.length);
    const before = planCardIds(base);
    for (const item of extended.items.slice(20)) expect(item.kind === 'card' && before.has(item.cardId)).toBe(false);
  });

  it('sambungan tetap mematuhi aturan variasi', () => {
    const extended = extendPlan(extendPlan(base, input), input);
    expect(longestRun(formats(extended, cards))).toBeLessThanOrEqual(FEED_CONFIG.maxSameTypeRun);
  });

  it('dibatasi maxExtraBatchesPerDay sehingga feed tetap punya akhir', () => {
    let plan = base;
    for (let i = 0; i < FEED_CONFIG.maxExtraBatchesPerDay + 3; i++) plan = extendPlan(plan, input);
    expect(plan.extraBatches).toBe(FEED_CONFIG.maxExtraBatchesPerDay);
    expect(plan.items).toHaveLength(20 + FEED_CONFIG.maxExtraBatchesPerDay * FEED_CONFIG.extraBatchSize);
    expect(canExtend(plan)).toBe(false);
  });
});

describe('fungsi penyusun', () => {
  it('arrangeForVariety menyelingi format dominan bila masih mungkin', () => {
    const items: ItemFormat[] = [...Array<ItemFormat>(8).fill('quiz'), 'fact', 'reel', 'poll', 'carousel'];
    for (let seed = 0; seed < 30; seed++) {
      const arranged = arrangeForVariety(items, (format) => format, createRng(`s${seed}`), 2);
      expect(arranged).toHaveLength(items.length);
      expect(longestRun(arranged)).toBeLessThanOrEqual(2);
    }
  });

  it('arrangeForVariety tetap mengembalikan semua item walau aturan mustahil dipenuhi', () => {
    const arranged = arrangeForVariety(Array<ItemFormat>(5).fill('quiz'), (format) => format, createRng('x'), 2);
    expect(arranged).toHaveLength(5);
  });

  it('interleaveEvenly menyebar sisipan dan menjaga urutan dasar', () => {
    const result = interleaveEvenly(['a', 'b', 'c', 'd', 'e', 'f'], ['X', 'Y']);
    expect(result.filter((x) => x !== 'X' && x !== 'Y')).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(Math.abs(result.indexOf('X') - result.indexOf('Y'))).toBeGreaterThan(1);
  });
});

describe('dengan konten asli di content/cards', () => {
  it('40 hari berturut-turut: kuota terpenuhi dan aturan variasi dipatuhi', () => {
    for (const plan of manyPlans(library.cards)) {
      expect(plan.items).toHaveLength(FEED_CONFIG.defaultQuota);
      expect(longestRun(formats(plan, library.cards))).toBeLessThanOrEqual(FEED_CONFIG.maxSameTypeRun);
      expect(plan.storyIds).toHaveLength(FEED_CONFIG.storiesPerDay);
    }
  });
});

describe('kejutan harian tidak mengulang kartu yang sama terus-menerus', () => {
  it('kartu kejutan yang belum dilihat didahulukan daripada yang sudah', () => {
    const seenFirst: ProgressMap = { 'fact-0': { seenCount: 4, lastSeen: '2026-03-09', correct: 0, wrong: 0 } };
    const picked = new Set<string>();
    for (const plan of manyPlans(cards, 20, seenFirst)) {
      for (const item of plan.items) if (item.kind === 'surprise' && item.surprise.type === 'unique-card') picked.add(item.surprise.cardId);
    }
    expect(picked).toEqual(new Set(['fact-1']));
  });
});
