/**
 * Merakit dan memvalidasi pustaka konten (topik + akun + kartu) dari data mentah.
 * Fungsi murni: dipakai aplikasi (src/content/index.ts), tes, dan skrip Node.
 */
import type { z } from 'zod';
import {
  accountFileSchema,
  cardFileSchema,
  topicFileSchema,
  type Account,
  type Card,
  type Topic,
} from './schema';

export interface Library {
  topics: Topic[];
  accounts: Account[];
  cards: Card[];
  cardById: ReadonlyMap<string, Card>;
  topicById: ReadonlyMap<string, Topic>;
  accountByUsername: ReadonlyMap<string, Account>;
}

export interface RawLibrary {
  topics: unknown;
  accounts: unknown;
  /** nama file -> isi JSON (array kartu) */
  cardFiles: Record<string, unknown>;
}

export class ContentError extends Error {
  readonly problems: string[];

  constructor(problems: string[]) {
    super(`Konten tidak valid:\n- ${problems.join('\n- ')}`);
    this.name = 'ContentError';
    this.problems = problems;
  }
}

function describeIssues(file: string, raw: unknown, error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const [index] = issue.path;
    const item = Array.isArray(raw) && typeof index === 'number' ? (raw[index] as { id?: unknown } | undefined) : undefined;
    const id = typeof item?.id === 'string' ? ` (id: ${item.id})` : '';
    return `${file}${id} @ ${issue.path.join('.')}: ${issue.message}`;
  });
}

/** Aturan lintas-kartu yang tidak bisa diekspresikan di skema per kartu. */
function crossCheck(topics: Topic[], accounts: Account[], cards: Card[]): string[] {
  const problems: string[] = [];
  const subTopicsByTopic = new Map(topics.map((t) => [t.id, new Set(t.subTopics.map((s) => s.id))]));
  const usernames = new Set(accounts.map((a) => a.username));
  const seen = new Set<string>();

  for (const card of cards) {
    if (seen.has(card.id)) problems.push(`id kartu ganda: ${card.id}`);
    seen.add(card.id);
    const subTopics = subTopicsByTopic.get(card.topicId);
    if (!subTopics) problems.push(`${card.id}: topicId "${card.topicId}" tidak ada di topics.json`);
    else if (!subTopics.has(card.subTopicId))
      problems.push(`${card.id}: subTopicId "${card.subTopicId}" bukan bagian dari topik "${card.topicId}"`);
    if (!usernames.has(card.account)) problems.push(`${card.id}: account "${card.account}" tidak ada di accounts.json`);
  }
  return problems;
}

/** Melempar ContentError berisi SEMUA masalah sekaligus, supaya mudah diperbaiki dalam satu putaran. */
export function parseLibrary(raw: RawLibrary): Library {
  const problems: string[] = [];

  const topics = topicFileSchema.safeParse(raw.topics);
  if (!topics.success) problems.push(...describeIssues('topics.json', raw.topics, topics.error));
  const accounts = accountFileSchema.safeParse(raw.accounts);
  if (!accounts.success) problems.push(...describeIssues('accounts.json', raw.accounts, accounts.error));

  const cards: Card[] = [];
  for (const [file, content] of Object.entries(raw.cardFiles).sort(([a], [b]) => a.localeCompare(b))) {
    const parsed = cardFileSchema.safeParse(content);
    if (parsed.success) cards.push(...parsed.data);
    else problems.push(...describeIssues(file, content, parsed.error));
  }

  if (topics.success && accounts.success) problems.push(...crossCheck(topics.data, accounts.data, cards));
  if (problems.length > 0 || !topics.success || !accounts.success) throw new ContentError(problems);

  return {
    topics: topics.data,
    accounts: accounts.data,
    cards,
    cardById: new Map(cards.map((c) => [c.id, c])),
    topicById: new Map(topics.data.map((t) => [t.id, t])),
    accountByUsername: new Map(accounts.data.map((a) => [a.username, a])),
  };
}
