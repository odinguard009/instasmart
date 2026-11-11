/**
 * SATU-SATUNYA sumber kontrak data konten Instasmart.
 * Semua tipe (kartu, scene, visual, topik, akun) diturunkan dari skema zod di sini.
 * Jangan mendefinisikan ulang bentuk data ini di tempat lain: impor tipenya dari file ini.
 */
import { z } from 'zod';

/* ---------------------------------- dasar ---------------------------------- */

export const CARD_TYPES = [
  'fact',
  'quiz',
  'humor',
  'mnemonic',
  'carousel',
  'poll',
  'reel',
  'video',
  'story',
  'review',
] as const;
export const cardTypeSchema = z.enum(CARD_TYPES);
export type CardType = z.infer<typeof cardTypeSchema>;

export const CHARACTER_IDS = ['owl', 'cat', 'gecko', 'kancil'] as const;
export const characterIdSchema = z.enum(CHARACTER_IDS);
export type CharacterId = z.infer<typeof characterIdSchema>;

export const EXPRESSIONS = ['happy', 'shock', 'think', 'smug', 'sad'] as const;
export const expressionSchema = z.enum(EXPRESSIONS);
export type Expression = z.infer<typeof expressionSchema>;

export const PALETTE_IDS = ['bata', 'laut', 'hutan', 'anggur', 'senja', 'toska', 'emas', 'arang', 'nila', 'mawar', 'zaitun', 'kopi'] as const;
export const paletteIdSchema = z.enum(PALETTE_IDS);
export type PaletteId = z.infer<typeof paletteIdSchema>;

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'harus slug huruf kecil-dengan-tanda-hubung');
const text = (max: number) => z.string().trim().min(1).max(max);

/** Sumber wajib ada di setiap kartu. Kartu tanpa sumber ditolak validasi. */
export const sourceSchema = z.strictObject({
  /** Nama peraturan/dokumen, mis. "KUHPerdata (Burgerlijk Wetboek)". */
  title: text(200).min(3),
  /** Rujukan spesifik, mis. "Pasal 1320". Jika tidak yakin nomor pasal: tulis nama peraturannya saja. */
  reference: text(300).min(3),
  url: z.url().optional(),
  /** Kutipan persis dari teks sumber yang mendasari kartu (wajib untuk kartu buatan generator). */
  quote: text(800).optional(),
});
export type Source = z.infer<typeof sourceSchema>;

/** Komentar "netizen" fiktif, ditulis bersama kartu. Tidak ada input pengguna. */
export const commentSchema = z.strictObject({ user: text(30), text: text(200) });
export type CardComment = z.infer<typeof commentSchema>;

/* --------------------------------- visual ---------------------------------- */

const visualBase = { palette: paletteIdSchema.optional() };

const quoteVisual = z.strictObject({
  ...visualBase,
  template: z.literal('quote'),
  /** Label kecil di atas, mis. "Pasal 1320 KUHPerdata". */
  label: text(60).optional(),
  text: text(320),
  footer: text(80).optional(),
});

const infographicVisual = z.strictObject({
  ...visualBase,
  template: z.literal('infographic'),
  title: text(70),
  points: z.array(text(90)).min(2).max(5),
});

const memeVisual = z.strictObject({
  ...visualBase,
  template: z.literal('meme'),
  top: text(90),
  bottom: text(90).optional(),
  character: characterIdSchema,
  expression: expressionSchema,
});

const comicVisual = z.strictObject({
  ...visualBase,
  template: z.literal('comic'),
  title: text(50).optional(),
  panels: z
    .array(z.strictObject({ character: characterIdSchema, expression: expressionSchema, text: text(80) }))
    .min(3)
    .max(4),
});

const coverVisual = z.strictObject({
  ...visualBase,
  template: z.literal('cover'),
  kicker: text(30).optional(),
  title: text(80),
  subtitle: text(90).optional(),
  character: characterIdSchema.optional(),
  expression: expressionSchema.optional(),
});

const bigtypeVisual = z.strictObject({
  ...visualBase,
  template: z.literal('bigtype'),
  kicker: text(30).optional(),
  text: text(140),
  sub: text(170).optional(),
});

export const ILLUSTRATION_SCENES = ['timbangan', 'palu', 'gedung', 'dokumen', 'bendera'] as const;
const illustrationVisual = z.strictObject({
  ...visualBase,
  template: z.literal('illustration'),
  scene: z.enum(ILLUSTRATION_SCENES),
  title: text(70),
  caption: text(120).optional(),
});

/** Foto bebas-lisensi (mis. dari Pexels lewat scripts/fetch-photos.ts). Kredit fotografer wajib. */
const photoVisual = z.strictObject({
  ...visualBase,
  template: z.literal('photo'),
  src: text(300),
  alt: text(200),
  overlayText: text(140).optional(),
  credit: z.strictObject({ photographer: text(80), url: z.url() }),
});

export const visualSchema = z.discriminatedUnion('template', [
  quoteVisual,
  infographicVisual,
  memeVisual,
  comicVisual,
  coverVisual,
  bigtypeVisual,
  illustrationVisual,
  photoVisual,
]);
export type Visual = z.infer<typeof visualSchema>;
export type VisualTemplate = Visual['template'];
export type VisualOf<T extends VisualTemplate> = Extract<Visual, { template: T }>;

/* ------------------------------- scene reel -------------------------------- */

export const SCENE_BACKGROUNDS = ['gradient', 'solid', 'spotlight', 'stripes'] as const;
export const TEXT_MOTIONS = ['words', 'pop', 'slide-up', 'type'] as const;
export const CHARACTER_MOTIONS = ['idle', 'bounce', 'enter-left', 'enter-right', 'nod'] as const;
export const SCENE_TRANSITIONS = ['cut', 'fade', 'slide', 'zoom'] as const;
export const SCENE_EFFECTS = ['zoom', 'shake', 'confetti'] as const;

export const sceneSchema = z.strictObject({
  durationMs: z.number().int().min(1200).max(10000),
  background: z.enum(SCENE_BACKGROUNDS).default('gradient'),
  palette: paletteIdSchema.optional(),
  character: characterIdSchema.optional(),
  expression: expressionSchema.optional(),
  characterMotion: z.enum(CHARACTER_MOTIONS).default('idle'),
  kicker: text(30).optional(),
  /** Teks kinetik besar di layar. */
  text: text(110),
  textMotion: z.enum(TEXT_MOTIONS).default('words'),
  transition: z.enum(SCENE_TRANSITIONS).default('fade'),
  effect: z.enum(SCENE_EFFECTS).optional(),
  /** Caption berjalan + naskah narasi (Web Speech). Selalu tampil sebagai cadangan suara. */
  caption: text(200),
});
export type Scene = z.infer<typeof sceneSchema>;

/* ---------------------------------- kartu ---------------------------------- */

export const CARD_TAGS = ['kejutan'] as const;

const cardBase = {
  id: slug,
  topicId: slug,
  subTopicId: slug,
  /** Username akun fiktif (harus terdaftar di content/accounts.json). */
  account: text(30),
  comments: z.array(commentSchema).max(5).optional(),
  source: sourceSchema,
  /** true = pembuat kartu tidak yakin penuh (nomor pasal, versi peraturan). Tampil sebagai peringatan. */
  needsVerification: z.boolean().optional(),
  /** `approved` hanya boleh diset manusia setelah memeriksa sumber. Generator selalu menulis `draft`. */
  status: z.enum(['draft', 'approved']),
  createdAt: z.iso.date(),
  /** `kejutan` = kandidat "kejutan harian" (kasus unik / fakta aneh-tapi-benar). */
  tags: z.array(z.enum(CARD_TAGS)).optional(),
};

const question = {
  question: text(260),
  options: z.array(text(140)).min(2).max(5),
  answerIndex: z.number().int().min(0),
  explanation: text(500),
};

const factCard = z.strictObject({
  ...cardBase,
  type: z.literal('fact'),
  visual: visualSchema,
  caption: text(600),
});

const humorCard = z.strictObject({
  ...cardBase,
  type: z.literal('humor'),
  visual: visualSchema,
  caption: text(600),
  /** Wajib: konsep/pasal yang diajarkan lelucon ini. Humor tanpa muatan belajar ditolak. */
  teaches: text(300),
});

const mnemonicCard = z.strictObject({
  ...cardBase,
  type: z.literal('mnemonic'),
  visual: visualSchema,
  caption: text(600),
  /** Jembatan keledai, mis. "SEKOCAH". */
  phrase: text(60),
  /** Uraian tiap bagian jembatan keledai. */
  expansion: z.array(text(120)).min(2).max(10),
});

const quizCard = z.strictObject({
  ...cardBase,
  type: z.literal('quiz'),
  ...question,
  /**
   * Skor bertingkat per pilihan (1-5), untuk soal TKP CPNS yang tidak punya satu jawaban benar.
   * Panjang = jumlah options; answerIndex harus menunjuk skor tertinggi.
   */
  scores: z.array(z.number().int().min(1).max(5)).optional(),
  caption: text(600).optional(),
});

const pollCard = z.strictObject({
  ...cardBase,
  type: z.literal('poll'),
  ...question,
  options: z.array(text(140)).min(2).max(4),
  caption: text(600).optional(),
});

export const carouselSlideSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('visual'), visual: visualSchema }),
  z.strictObject({ kind: z.literal('quiz'), ...question }),
]);
export type CarouselSlide = z.infer<typeof carouselSlideSchema>;

const carouselCard = z.strictObject({
  ...cardBase,
  type: z.literal('carousel'),
  slides: z.array(carouselSlideSchema).min(2).max(10),
  caption: text(600),
});

const reelCard = z.strictObject({
  ...cardBase,
  type: z.literal('reel'),
  scenes: z.array(sceneSchema).min(2).max(12),
  caption: text(600),
});

/** Video file lokal (MP4/WebM) di public/videos/, mis. buatan sendiri. */
const videoCard = z.strictObject({
  ...cardBase,
  type: z.literal('video'),
  /** Path relatif terhadap public/, mis. "videos/asas-legalitas.mp4". */
  src: z.string().regex(/^videos\/[\w.-]+\.(mp4|webm)$/, 'harus berupa videos/<nama>.mp4 atau .webm'),
  poster: z.string().regex(/^videos\/[\w.-]+\.(png|jpg|jpeg|webp)$/).optional(),
  caption: text(600),
});

export const storySlideSchema = z.strictObject({
  visual: visualSchema,
  durationMs: z.number().int().min(2000).max(15000).optional(),
});

const storyCard = z.strictObject({
  ...cardBase,
  type: z.literal('story'),
  title: text(40),
  slides: z.array(storySlideSchema).min(4).max(8),
});

/** Kartu ingat-kembali (flashcard): depan = pertanyaan, belakang = jawaban, dinilai sendiri. */
const reviewCard = z.strictObject({
  ...cardBase,
  type: z.literal('review'),
  front: text(260),
  back: text(500),
  caption: text(600).optional(),
});

const answerInRange = (card: { options: string[]; answerIndex: number }) => card.answerIndex < card.options.length;
const answerMessage = { message: 'answerIndex di luar jumlah options', path: ['answerIndex'] };

export const cardSchema = z
  .discriminatedUnion('type', [
    factCard,
    humorCard,
    mnemonicCard,
    quizCard,
    pollCard,
    carouselCard,
    reelCard,
    videoCard,
    storyCard,
    reviewCard,
  ])
  .refine((card) => (card.type === 'quiz' || card.type === 'poll' ? answerInRange(card) : true), answerMessage)
  .refine(
    (card) => card.type !== 'carousel' || card.slides.every((s) => s.kind !== 'quiz' || answerInRange(s)),
    { message: 'answerIndex slide kuis di luar jumlah options', path: ['slides'] },
  )
  .refine((card) => card.type !== 'quiz' || !card.scores || card.scores.length === card.options.length, {
    message: 'jumlah scores harus sama dengan jumlah options',
    path: ['scores'],
  })
  .refine((card) => card.type !== 'quiz' || !card.scores || card.scores[card.answerIndex] === Math.max(...card.scores), {
    message: 'answerIndex harus menunjuk pilihan dengan skor tertinggi',
    path: ['answerIndex'],
  });

export type Card = z.infer<typeof cardSchema>;
export type CardOf<T extends CardType> = Extract<Card, { type: T }>;
/** Bentuk soal pilihan ganda yang dipakai kuis, polling, dan slide kuis carousel. */
export interface ChoiceQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  /** Skor bertingkat per pilihan (soal TKP). */
  scores?: number[];
}

export const cardFileSchema = z.array(cardSchema);

/* ------------------------------ topik dan akun ------------------------------ */

export const subTopicSchema = z.strictObject({ id: slug, name: text(60) });
export type SubTopic = z.infer<typeof subTopicSchema>;

/** Kelompok besar materi: ilmu hukum (seleksi hakim) atau SKD CPNS. */
export const TOPIC_GROUPS = ['hukum', 'cpns'] as const;
export const topicGroupSchema = z.enum(TOPIC_GROUPS);
export type TopicGroup = z.infer<typeof topicGroupSchema>;
export const TOPIC_GROUP_LABELS: Record<TopicGroup, string> = { hukum: 'Ilmu Hukum', cpns: 'CPNS (SKD)' };

export const topicSchema = z.strictObject({
  id: slug,
  group: topicGroupSchema,
  name: text(80),
  shortName: text(24),
  palette: paletteIdSchema,
  subTopics: z.array(subTopicSchema).min(1),
});
export type Topic = z.infer<typeof topicSchema>;
export const topicFileSchema = z.array(topicSchema).min(1);

export const accountSchema = z.strictObject({
  username: z.string().regex(/^[a-z0-9._]{3,30}$/),
  displayName: text(40),
  character: characterIdSchema,
  bio: text(120),
});
export type Account = z.infer<typeof accountSchema>;
export const accountFileSchema = z.array(accountSchema).min(1);
