/**
 * Pembangun feed harian. Fungsi murni dan deterministik (seed = tanggal).
 *
 * Tujuan urutan: retensi (kartu ulang SM-2 yang jatuh tempo didahulukan) dan variasi (anti-bosan),
 * BUKAN waktu di aplikasi. Feed selalu berhingga: panjangnya = kuota.
 * Semua angka aturan ada di src/config/feed.ts.
 */
import { FEED_CONFIG, REVIEWABLE_TYPES, type FeedConfig } from '@/config/feed';
import type { Card, CardType } from '@/content/schema';
import type { DateKey } from '@/lib/date';
import { createRng, shuffle, weightedPick, type Rng } from '@/lib/rng';
import type { CardProgress, DailyPlan, FeedItem, ProgressMap, Surprise } from '@/state/schema';
import { isDue } from './sm2';
import { weakestTopics } from './stats';

export interface PlanInput {
  /** Kartu yang sudah lolos moderasi (lihat eligibleCards). */
  cards: readonly Card[];
  progress: ProgressMap;
  today: DateKey;
  quota: number;
  config?: FeedConfig;
  /** Default: tanggal hari ini, sehingga rencana stabil sepanjang hari. */
  seed?: string;
}

/** "Format" untuk aturan variasi: tipe kartu, atau `surprise` untuk kejutan harian. */
export type ItemFormat = CardType | 'surprise';

/* ------------------------------ prioritas kartu ----------------------------- */

/** 0 = belum pernah dilihat, 1 = pernah dilihat, 2 = sudah terjadwal ulang di masa depan (jangan diganggu). */
function freshness(progress: CardProgress | undefined, today: DateKey): number {
  if (!progress || progress.seenCount === 0) return 0;
  if (progress.sm2 && progress.sm2.dueDate > today) return 2;
  return 1;
}

interface PoolContext {
  progress: ProgressMap;
  today: DateKey;
  weakTopics: ReadonlySet<string>;
  rng: Rng;
}

/** Stok kartu per tipe, terurut dari yang paling layak tampil. Mengambil kartu sambil menyeimbangkan topik. */
class CardPool {
  private readonly byType = new Map<CardType, Card[]>();
  private readonly topicLoad = new Map<string, number>();
  private readonly ctx: PoolContext;

  constructor(cards: readonly Card[], ctx: PoolContext) {
    this.ctx = ctx;
    const rank = (card: Card) => freshness(ctx.progress[card.id], ctx.today);
    const lastSeen = (card: Card) => ctx.progress[card.id]?.lastSeen ?? '';
    const ordered = shuffle(cards, ctx.rng).sort((a, b) => rank(a) - rank(b) || lastSeen(a).localeCompare(lastSeen(b)));
    for (const card of ordered) {
      const list = this.byType.get(card.type) ?? [];
      list.push(card);
      this.byType.set(card.type, list);
    }
  }

  remaining(type: CardType): number {
    return this.byType.get(type)?.length ?? 0;
  }

  list(type: CardType): readonly Card[] {
    return this.byType.get(type) ?? [];
  }

  /** Mengeluarkan kartu tertentu dari stok dan mencatat beban topiknya. */
  remove(card: Card): void {
    const list = this.byType.get(card.type);
    const index = list?.indexOf(card) ?? -1;
    if (!list || index < 0) return;
    list.splice(index, 1);
    this.topicLoad.set(card.topicId, (this.topicLoad.get(card.topicId) ?? 0) + 1);
  }

  /** Kartu terbaik untuk tipe ini: paling segar, lalu dari topik yang paling sedikit muncul (topik lemah diutamakan). */
  take(type: CardType): Card | undefined {
    const list = this.byType.get(type) ?? [];
    const first = list[0];
    if (!first) return undefined;
    const bestRank = freshness(this.ctx.progress[first.id], this.ctx.today);
    let best = first;
    let bestLoad = this.load(first);
    for (const card of list) {
      if (freshness(this.ctx.progress[card.id], this.ctx.today) !== bestRank) break;
      const load = this.load(card);
      if (load < bestLoad) {
        best = card;
        bestLoad = load;
      }
    }
    this.remove(best);
    return best;
  }

  /** Kartu yang paling sering dilihat (untuk tantangan cepat, supaya tidak menghabiskan kartu baru). */
  takeStalest(type: CardType): Card | undefined {
    const list = this.byType.get(type) ?? [];
    const card = list[list.length - 1];
    if (card) this.remove(card);
    return card;
  }

  private load(card: Card): number {
    return (this.topicLoad.get(card.topicId) ?? 0) - (this.ctx.weakTopics.has(card.topicId) ? 1 : 0);
  }
}

/* --------------------------------- variasi --------------------------------- */

/** Panjang deret terpanjang berisi format yang sama berturut-turut. */
export function longestRun(formats: readonly ItemFormat[]): number {
  let longest = 0;
  let run = 0;
  let previous: ItemFormat | undefined;
  for (const format of formats) {
    run = format === previous ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = format;
  }
  return longest;
}

function trailingRun(formats: readonly ItemFormat[]): { format: ItemFormat | undefined; length: number } {
  const format = formats[formats.length - 1];
  let length = 0;
  for (let i = formats.length - 1; i >= 0 && formats[i] === format; i--) length += 1;
  return { format, length };
}

/**
 * Menyusun item agar tidak ada format yang sama lebih dari `maxRun` kali berturut-turut.
 * Acak berbobot sisa stok; saat satu format mendominasi, format itu dipaksa lebih dulu agar tetap bisa diselingi.
 * Jika mustahil (stok hanya satu format), pelanggaran dibiarkan: lebih baik feed terisi daripada kosong.
 */
export function arrangeForVariety<T>(
  items: readonly T[],
  formatOf: (item: T) => ItemFormat,
  rng: Rng,
  maxRun: number,
  tail: readonly ItemFormat[] = [],
): T[] {
  const groups = new Map<ItemFormat, T[]>();
  for (const item of shuffle(items, rng)) {
    const group = groups.get(formatOf(item)) ?? [];
    group.push(item);
    groups.set(formatOf(item), group);
  }

  const out: T[] = [];
  const formats: ItemFormat[] = [...tail];
  let left = items.length;
  while (left > 0) {
    const run = trailingRun(formats);
    const stocked = [...groups].filter(([, group]) => group.length > 0);
    const allowed = stocked.filter(([format]) => format !== run.format || run.length < maxRun);
    const candidates = allowed.length > 0 ? allowed : stocked;
    const [dominant, dominantGroup] = stocked.reduce((a, b) => (b[1].length > a[1].length ? b : a));
    const others = left - dominantGroup.length;
    const mustPlaceDominant = dominantGroup.length > others * maxRun && candidates.some(([format]) => format === dominant);
    const format = mustPlaceDominant
      ? dominant
      : (weightedPick(candidates.map(([f, group]) => [f, group.length] as const), rng) ?? dominant);
    const item = groups.get(format)?.pop();
    if (item === undefined) break;
    out.push(item);
    formats.push(format);
    left -= 1;
  }
  return out;
}

/** Menyisipkan `inserts` ke `base` dengan jarak merata (dipakai untuk humor: selingan, bukan gerombolan). */
export function interleaveEvenly<T>(base: readonly T[], inserts: readonly T[]): T[] {
  if (inserts.length === 0) return [...base];
  const total = base.length + inserts.length;
  const slots = new Set(inserts.map((_, i) => Math.floor(((i + 0.5) * total) / inserts.length)));
  const out: T[] = [];
  let b = 0;
  let n = 0;
  for (let i = 0; i < total; i++) {
    const useInsert = (slots.has(i) && n < inserts.length) || b >= base.length;
    out.push((useInsert ? inserts[n++] : base[b++]) as T);
  }
  return out;
}

/* --------------------------------- seleksi --------------------------------- */

interface Selection {
  learning: { card: Card; isReview: boolean }[];
  humor: Card[];
  surprise: Surprise | null;
}

function pickSurprise(pool: CardPool, cards: readonly Card[], config: FeedConfig, rng: Rng): Surprise | null {
  const tagged = cards.filter((card) => card.type !== 'story' && card.tags?.includes('kejutan'));
  const unique = tagged.find((card) => pool.list(card.type).includes(card));
  const canRapid = pool.remaining('quiz') >= config.rapidQuizSize;
  if (unique && (!canRapid || rng() < 0.5)) {
    pool.remove(unique);
    return { type: 'unique-card', cardId: unique.id };
  }
  if (!canRapid) return null;
  const quizzes: Card[] = [];
  for (let i = 0; i < config.rapidQuizSize; i++) {
    const quiz = pool.takeStalest('quiz');
    if (quiz) quizzes.push(quiz);
  }
  return { type: 'rapid-quiz', cardIds: quizzes.map((q) => q.id) };
}

function select(input: Required<PlanInput>, exclude: ReadonlySet<string>, count: number, withSurprise: boolean, rng: Rng): Selection {
  const { cards, progress, today, config } = input;
  const available = cards.filter((card) => card.type !== 'story' && !exclude.has(card.id));
  const weakTopics = new Set(weakestTopics(cards, progress).slice(0, 2).map((t) => t.topicId));
  const pool = new CardPool(available, { progress, today, weakTopics, rng });
  const selection: Selection = { learning: [], humor: [], surprise: null };

  // 1. Kartu ulang yang jatuh tempo (retensi lebih penting daripada materi baru).
  const due = available
    .filter((card) => REVIEWABLE_TYPES.includes(card.type) && isDue(progress[card.id]?.sm2, today))
    .sort((a, b) => (progress[a.id]?.sm2?.dueDate ?? '').localeCompare(progress[b.id]?.sm2?.dueDate ?? ''))
    .slice(0, Math.floor(count * config.maxReviewShare));
  for (const card of due) {
    pool.remove(card);
    selection.learning.push({ card, isReview: true });
  }

  // 2. Kejutan harian (memakai satu slot kuota).
  if (withSurprise && count >= config.surpriseMinQuota) selection.surprise = pickSurprise(pool, available, config, rng);

  // 3. Humor: kira-kira 1 dari setiap `humorEvery` item.
  const humorTarget = Math.min(Math.round(count / config.humorEvery), pool.remaining('humor'));
  for (let i = 0; i < humorTarget; i++) {
    const card = pool.take('humor');
    if (card) selection.humor.push(card);
  }

  // 4. Slot belajar: penuhi minimum format kaya dulu, sisanya acak berbobot.
  let slots = count - selection.learning.length - selection.humor.length - (selection.surprise ? 1 : 0);
  const takeLearning = (type: CardType): boolean => {
    const card = slots > 0 ? pool.take(type) : undefined;
    if (!card) return false;
    selection.learning.push({ card, isReview: false });
    slots -= 1;
    return true;
  };
  for (const [type, minimum] of Object.entries(config.minPerDay) as [CardType, number][]) {
    const scaled = Math.round((minimum * count) / config.defaultQuota);
    for (let i = 0; i < scaled; i++) takeLearning(type);
  }
  while (slots > 0) {
    const weights = (Object.entries(config.typeWeights) as [CardType, number][]).filter(([type]) => pool.remaining(type) > 0);
    const type = weightedPick(weights, rng);
    if (!type || !takeLearning(type)) break;
  }

  // 5. Stok belajar habis (pustaka kecil): isi sisa dengan humor daripada membiarkan feed pendek.
  while (slots > 0) {
    const card = pool.take('humor');
    if (!card) break;
    selection.humor.push(card);
    slots -= 1;
  }
  return selection;
}

function toFeedItems(selection: Selection, input: Required<PlanInput>, rng: Rng, tail: readonly ItemFormat[]): FeedItem[] {
  const asItem = (card: Card, isReview: boolean): FeedItem => ({ kind: 'card', key: `c:${card.id}`, cardId: card.id, isReview });
  const typeById = new Map(input.cards.map((card) => [card.id, card.type]));
  const formatOfItem = (item: FeedItem): ItemFormat => (item.kind === 'surprise' ? 'surprise' : (typeById.get(item.cardId) ?? 'fact'));

  const learning = arrangeForVariety(
    selection.learning.map(({ card, isReview }) => asItem(card, isReview)),
    formatOfItem,
    rng,
    input.config.maxSameTypeRun,
    tail,
  );
  const items = interleaveEvenly(
    learning,
    selection.humor.map((card) => asItem(card, false)),
  );
  if (selection.surprise) {
    const position = Math.min(items.length, Math.round(items.length * input.config.surprisePosition));
    items.splice(position, 0, { kind: 'surprise', key: `s:${input.today}`, surprise: selection.surprise });
  }
  return items;
}

function pickStories(input: Required<PlanInput>, rng: Rng): string[] {
  const { progress, config } = input;
  const stories = shuffle(
    input.cards.filter((card) => card.type === 'story'),
    rng,
  ).sort(
    (a, b) =>
      (progress[a.id]?.seenCount ?? 0) - (progress[b.id]?.seenCount ?? 0) ||
      (progress[a.id]?.lastSeen ?? '').localeCompare(progress[b.id]?.lastSeen ?? ''),
  );
  const picked: Card[] = [];
  const topics = new Set<string>();
  for (const pass of ['distinct-topic', 'any'] as const) {
    for (const story of stories) {
      if (picked.length >= config.storiesPerDay) break;
      if (picked.includes(story) || (pass === 'distinct-topic' && topics.has(story.topicId))) continue;
      picked.push(story);
      topics.add(story.topicId);
    }
  }
  return picked.map((story) => story.id);
}

/** Semua id kartu yang sudah terpakai rencana (item, kejutan, story, penutup). */
export function planCardIds(plan: DailyPlan): Set<string> {
  const ids = new Set<string>(plan.storyIds);
  if (plan.closingCardId) ids.add(plan.closingCardId);
  for (const item of plan.items) {
    if (item.kind === 'card') ids.add(item.cardId);
    else if (item.surprise.type === 'unique-card') ids.add(item.surprise.cardId);
    else item.surprise.cardIds.forEach((id) => ids.add(id));
  }
  return ids;
}

function withDefaults(input: PlanInput): Required<PlanInput> {
  return { ...input, config: input.config ?? FEED_CONFIG, seed: input.seed ?? input.today };
}

/* ---------------------------------- publik --------------------------------- */

export function buildDailyPlan(rawInput: PlanInput): DailyPlan {
  const input = withDefaults(rawInput);
  const rng = createRng(`plan:${input.seed}`);
  const selection = select(input, new Set(), input.quota, true, rng);
  const plan: DailyPlan = {
    date: input.today,
    items: toFeedItems(selection, input, rng, []),
    storyIds: pickStories(input, rng),
    closingCardId: null,
    extraBatches: 0,
  };

  // Kejutan penutup: humor/kartu kejutan yang belum dipakai hari ini (bonus di layar Selesai).
  const used = planCardIds(plan);
  const closing = shuffle(input.cards, rng)
    .filter((card) => !used.has(card.id) && (card.type === 'humor' || card.tags?.includes('kejutan')) && card.type !== 'story')
    .sort((a, b) => (input.progress[a.id]?.seenCount ?? 0) - (input.progress[b.id]?.seenCount ?? 0))[0];
  return { ...plan, closingCardId: closing?.id ?? null };
}

export function canExtend(plan: DailyPlan, config: FeedConfig = FEED_CONFIG): boolean {
  return plan.extraBatches < config.maxExtraBatchesPerDay;
}

/** Paket tambahan ("tambah 5 item"): tanpa kejutan, tidak mengulang kartu hari ini, tetap patuh aturan variasi. */
export function extendPlan(plan: DailyPlan, rawInput: PlanInput): DailyPlan {
  const input = withDefaults(rawInput);
  if (!canExtend(plan, input.config)) return plan;
  const rng = createRng(`extra:${input.seed}:${plan.extraBatches}`);
  const typeById = new Map(input.cards.map((card) => [card.id, card.type]));
  const tail = plan.items
    .slice(-input.config.maxSameTypeRun)
    .map((item): ItemFormat => (item.kind === 'surprise' ? 'surprise' : (typeById.get(item.cardId) ?? 'fact')));
  const selection = select(input, planCardIds(plan), input.config.extraBatchSize, false, rng);
  const extra = toFeedItems(selection, input, rng, tail);
  return { ...plan, items: [...plan.items, ...extra], extraBatches: plan.extraBatches + 1 };
}
