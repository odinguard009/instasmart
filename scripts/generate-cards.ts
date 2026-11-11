/**
 * Generator kartu (dijalankan MANUAL, tidak pernah saat build):
 *   ANTHROPIC_API_KEY=... npm run generate:cards -- --source kuhap-2025.md --topic acara-pidana --sub kuhap-baru --account saksi.cicak [--count 6]
 *
 * Membaca content/sources/<file>, meminta model membuat kartu HANYA dari teks itu, lalu:
 *   1. memvalidasi tiap kartu dengan skema zod,
 *   2. membuang kartu yang `source.quote`-nya tidak ditemukan persis di teks sumber,
 *   3. memaksa status `draft`,
 *   4. memvalidasi lintas kartu terhadap pustaka yang ada,
 *   5. menulis hasilnya ke content/cards/generated-<topik>-<waktu>.json.
 * Model: env CLAUDE_MODEL (default claude-fable-5-2).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import Anthropic from '@anthropic-ai/sdk';
import { parseLibrary } from '../src/content/library';
import { CARD_TYPES, cardSchema, type Card } from '../src/content/schema';
import { CARDS_DIR, CONTENT_DIR, loadLibraryFromDisk, readJson, SOURCES_DIR } from './content-io';
import { buildUserPrompt, GENERATOR_SYSTEM_PROMPT } from './generator-prompt';

const DEFAULT_MODEL = 'claude-fable-5-2';

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

/** Menyamakan spasi dan tanda kutip supaya pencocokan kutipan tidak gagal karena format. */
function normalizeForMatch(text: string): string {
  return text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
}

function extractJsonArray(text: string): unknown {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end <= start) throw new Error('Jawaban model tidak berisi array JSON.');
  return JSON.parse(text.slice(start, end + 1));
}

async function requestCards(client: Anthropic, model: string, userPrompt: string): Promise<string> {
  // Model Fable bisa menolak lewat pengklasifikasi keamanan; fallback sisi server melanjutkan di model lain.
  const fallback = model.startsWith('claude-fable') ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {};
  const message = await client.beta.messages
    .stream({
      model,
      max_tokens: 32000,
      system: GENERATOR_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      ...fallback,
    })
    .finalMessage();

  if (message.stop_reason === 'refusal') throw new Error('Model menolak permintaan ini (stop_reason: refusal).');
  if (message.stop_reason === 'max_tokens') throw new Error('Jawaban terpotong (max_tokens). Kurangi --count atau perpendek sumber.');
  return message.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('');
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      source: { type: 'string' },
      topic: { type: 'string' },
      sub: { type: 'string' },
      account: { type: 'string' },
      count: { type: 'string', default: '6' },
    },
  });
  if (!process.env.ANTHROPIC_API_KEY) {
    fail('ANTHROPIC_API_KEY belum diset. Generator tidak dijalankan.\nSet dulu, mis.: ANTHROPIC_API_KEY=sk-ant-... npm run generate:cards -- --source <file.md> --topic <id> --sub <id> --account <username>');
  }
  const { source, topic, sub, account } = values;
  if (!source || !topic || !sub || !account) fail('Argumen wajib: --source <file di content/sources> --topic <topicId> --sub <subTopicId> --account <username>');

  const library = loadLibraryFromDisk();
  const topicEntry = library.topicById.get(topic);
  if (!topicEntry?.subTopics.some((s) => s.id === sub)) fail(`Topik/sub-topik "${topic}/${sub}" tidak ada di content/topics.json.`);
  if (!library.accountByUsername.has(account)) fail(`Akun "${account}" tidak ada di content/accounts.json.`);

  const sourceText = readFileSync(join(SOURCES_DIR, source), 'utf8');
  const today = new Date().toISOString().slice(0, 10);
  const examples = CARD_TYPES.flatMap((type) => library.cards.find((card) => card.type === type) ?? []);
  const userPrompt = buildUserPrompt({
    sourceName: source,
    sourceText,
    topicId: topic,
    subTopicId: sub,
    account,
    count: Number(values.count),
    today,
    examples,
    existingIds: library.cards.filter((card) => card.topicId === topic).map((card) => card.id),
  });

  const model = process.env.CLAUDE_MODEL ?? DEFAULT_MODEL;
  console.log(`Meminta ${values.count} kartu dari ${source} memakai model ${model} ...`);
  const raw = extractJsonArray(await requestCards(new Anthropic(), model, userPrompt));
  if (!Array.isArray(raw)) fail('Jawaban model bukan array.');

  const haystack = normalizeForMatch(sourceText);
  const accepted: Card[] = [];
  for (const [index, item] of raw.entries()) {
    const parsed = cardSchema.safeParse(typeof item === 'object' && item !== null ? { ...item, status: 'draft' } : item);
    if (!parsed.success) {
      console.warn(`- kartu #${index + 1} dibuang: tidak lolos skema (${parsed.error.issues[0]?.path.join('.')}: ${parsed.error.issues[0]?.message})`);
      continue;
    }
    const quote = parsed.data.source.quote;
    if (!quote || !haystack.includes(normalizeForMatch(quote))) {
      console.warn(`- kartu ${parsed.data.id} dibuang: kutipan sumber tidak ada atau tidak ditemukan persis di ${source}`);
      continue;
    }
    accepted.push(parsed.data);
  }
  if (accepted.length === 0) fail('Tidak ada kartu yang lolos validasi. Tidak ada file yang ditulis.');

  const fileName = `generated-${topic}-${Date.now()}.json`;
  // Validasi lintas kartu (id unik, topik, akun) terhadap pustaka yang ada sebelum menulis.
  parseLibrary({
    topics: readJson(join(CONTENT_DIR, 'topics.json')),
    accounts: readJson(join(CONTENT_DIR, 'accounts.json')),
    cardFiles: { 'pustaka-lama.json': library.cards, [fileName]: accepted },
  });
  writeFileSync(join(CARDS_DIR, fileName), `${JSON.stringify(accepted, null, 2)}\n`);
  console.log(`\n${accepted.length} kartu ditulis ke content/cards/${fileName} (status: draft).`);
  console.log('Langkah berikutnya: baca tiap kartu, cocokkan dengan sumber, lalu setujui lewat halaman Review di aplikasi.');
}

try {
  await main();
} catch (error) {
  if (error instanceof Anthropic.AuthenticationError) fail('API key ditolak (AuthenticationError). Periksa ANTHROPIC_API_KEY.');
  if (error instanceof Anthropic.RateLimitError) fail('Terkena batas laju (RateLimitError). Coba lagi beberapa saat.');
  if (error instanceof Anthropic.APIError) fail(`Error API ${error.status ?? ''}: ${error.message}`);
  fail(error instanceof Error ? error.message : String(error));
}
