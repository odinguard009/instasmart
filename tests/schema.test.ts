import { describe, expect, it } from 'vitest';
import accounts from '../content/accounts.json';
import topics from '../content/topics.json';
import { library } from '@/content';
import { ContentError, parseLibrary } from '@/content/library';
import { CARD_TYPES, cardSchema } from '@/content/schema';
import { gradeChoice } from '@/domain/grading';
import { rawCard } from './fixtures';

describe('skema kartu', () => {
  it.each(CARD_TYPES)('kartu contoh bertipe %s lolos', (type) => {
    expect(cardSchema.safeParse(rawCard(type, 'kartu-uji')).success).toBe(true);
  });

  it('kartu tanpa sumber ditolak', () => {
    const { source: _source, ...withoutSource } = rawCard('fact', 'tanpa-sumber');
    expect(cardSchema.safeParse(withoutSource).success).toBe(false);
  });

  it('sumber kosong atau tanpa rujukan ditolak', () => {
    expect(cardSchema.safeParse(rawCard('fact', 'x', { source: { title: 'KUHPerdata' } })).success).toBe(false);
    expect(cardSchema.safeParse(rawCard('fact', 'x', { source: { title: '', reference: '' } })).success).toBe(false);
    expect(cardSchema.safeParse(rawCard('fact', 'x', { source: { title: 'KUHPerdata', reference: 'Pasal 1', url: 'bukan-url' } })).success).toBe(false);
  });

  it('humor wajib punya `teaches`', () => {
    expect(cardSchema.safeParse(rawCard('humor', 'x', { teaches: undefined })).success).toBe(false);
    expect(cardSchema.safeParse(rawCard('humor', 'x', { teaches: '  ' })).success).toBe(false);
  });

  it('answerIndex di luar pilihan ditolak (kuis, polling, slide carousel)', () => {
    expect(cardSchema.safeParse(rawCard('quiz', 'x', { answerIndex: 3 })).success).toBe(false);
    expect(cardSchema.safeParse(rawCard('poll', 'x', { answerIndex: 9 })).success).toBe(false);
    const slides = [{ kind: 'visual', visual: { template: 'bigtype', text: 'a' } }, { kind: 'quiz', question: 'q', options: ['a', 'b'], answerIndex: 2, explanation: 'e' }];
    expect(cardSchema.safeParse(rawCard('carousel', 'x', { slides })).success).toBe(false);
  });

  it('status hanya draft/approved; field tak dikenal ditolak; id harus slug', () => {
    expect(cardSchema.safeParse(rawCard('fact', 'x', { status: 'published' })).success).toBe(false);
    expect(cardSchema.safeParse(rawCard('fact', 'x', { imageUrl: 'https://example.com/a.png' })).success).toBe(false);
    expect(cardSchema.safeParse(rawCard('fact', 'ID Tidak Valid')).success).toBe(false);
  });

  it('story butuh 4-8 slide; reel butuh minimal 2 scene; video hanya dari videos/', () => {
    const slide = { visual: { template: 'bigtype', text: 'a' } };
    expect(cardSchema.safeParse(rawCard('story', 'x', { slides: [slide, slide, slide] })).success).toBe(false);
    expect(cardSchema.safeParse(rawCard('story', 'x', { slides: Array(9).fill(slide) })).success).toBe(false);
    expect(cardSchema.safeParse(rawCard('reel', 'x', { scenes: [{ durationMs: 2000, text: 'a', caption: 'a' }] })).success).toBe(false);
    expect(cardSchema.safeParse(rawCard('video', 'x', { src: 'https://youtube.com/watch?v=1' })).success).toBe(false);
    expect(cardSchema.safeParse(rawCard('video', 'x', { src: 'videos/buatan-sendiri.webm' })).success).toBe(true);
  });

  it('scene reel mendapat nilai default', () => {
    const parsed = cardSchema.parse(rawCard('reel', 'x'));
    expect(parsed.type === 'reel' && parsed.scenes[0]).toMatchObject({ background: 'gradient', textMotion: 'words', transition: 'fade', characterMotion: 'idle' });
  });

  it('visual foto wajib menyertakan kredit fotografer', () => {
    const photo = { template: 'photo', src: 'photos/a.jpg', alt: 'Gedung' };
    expect(cardSchema.safeParse(rawCard('fact', 'x', { visual: photo })).success).toBe(false);
    expect(cardSchema.safeParse(rawCard('fact', 'x', { visual: { ...photo, credit: { photographer: 'A', url: 'https://www.pexels.com/@a' } } })).success).toBe(true);
  });
});

describe('pemeriksaan lintas kartu (parseLibrary)', () => {
  const base = { topics, accounts };
  const good = rawCard('fact', 'kartu-baik', { topicId: 'perdata', subTopicId: 'pmh', account: 'bw.receh' });
  const problemsOf = (cards: unknown[]): string[] => {
    try {
      parseLibrary({ ...base, cardFiles: { 'uji.json': cards } });
      return [];
    } catch (error) {
      if (error instanceof ContentError) return error.problems;
      throw error;
    }
  };

  it('pustaka yang benar diterima', () => {
    expect(problemsOf([good])).toEqual([]);
  });

  it('id ganda, topik/sub-topik asing, dan akun tak terdaftar dilaporkan', () => {
    expect(problemsOf([good, good]).join()).toContain('id kartu ganda');
    expect(problemsOf([{ ...good, topicId: 'astronomi' }]).join()).toContain('topicId');
    expect(problemsOf([{ ...good, subTopicId: 'kuhap-baru' }]).join()).toContain('subTopicId');
    expect(problemsOf([{ ...good, account: 'akun.hantu' }]).join()).toContain('account');
  });

  it('pesan error menyebut file dan id kartu yang bermasalah', () => {
    const { source: _source, ...broken } = good;
    expect(problemsOf([broken])[0]).toMatch(/uji\.json \(id: kartu-baik\).*source/);
  });
});

describe('konten asli (content/cards/*.json)', () => {
  const count = (type: string) => library.cards.filter((card) => card.type === type).length;

  it('semua file kartu lolos skema dan pemeriksaan lintas kartu', () => {
    expect(library.cards.length).toBeGreaterThanOrEqual(80);
  });

  it('memenuhi jumlah minimum per tipe', () => {
    const minimum = { humor: 15, reel: 12, carousel: 10, story: 8, poll: 6, quiz: 20 };
    for (const [type, min] of Object.entries(minimum)) expect(count(type), type).toBeGreaterThanOrEqual(min);
  });

  it('setiap topik dan sub-topik punya kartu; setiap topik punya story', () => {
    for (const topic of library.topics) {
      expect(library.cards.some((card) => card.topicId === topic.id && card.type === 'story'), topic.id).toBe(true);
      for (const sub of topic.subTopics) expect(library.cards.some((card) => card.topicId === topic.id && card.subTopicId === sub.id), `${topic.id}/${sub.id}`).toBe(true);
    }
  });

  it('kartu hukum acara pidana semuanya diberi needsVerification kecuali yang bersumber UU Kekuasaan Kehakiman', () => {
    for (const card of library.cards.filter((c) => c.topicId === 'acara-pidana')) {
      if (!card.source.title.includes('UU No. 48 Tahun 2009')) expect(card.needsVerification, card.id).toBe(true);
    }
  });
});

describe('soal TKP bertingkat', () => {
  const tkp = (overrides: Record<string, unknown>) => cardSchema.safeParse(rawCard('quiz', 'tkp-1', { options: ['A', 'B', 'C', 'D'], answerIndex: 2, scores: [3, 1, 5, 4], ...overrides }));

  it('lolos bila skor lengkap dan answerIndex menunjuk skor tertinggi', () => {
    expect(tkp({}).success).toBe(true);
  });

  it('ditolak bila jumlah skor tidak sama dengan jumlah pilihan', () => {
    expect(tkp({ scores: [3, 1, 5] }).success).toBe(false);
  });

  it('ditolak bila answerIndex bukan skor tertinggi', () => {
    expect(tkp({ answerIndex: 3 }).success).toBe(false);
  });

  it('gradeChoice: skor >= 4 dihitung benar, kualitas SM-2 mengikuti skor', () => {
    const question = { question: 'Q', options: ['A', 'B', 'C', 'D'], answerIndex: 2, explanation: 'E', scores: [3, 1, 5, 4] };
    expect(gradeChoice(question, 2)).toEqual({ correct: true, quality: 4, score: 5 });
    expect(gradeChoice(question, 3)).toEqual({ correct: true, quality: 3, score: 4 });
    expect(gradeChoice(question, 0)).toEqual({ correct: false, quality: 2, score: 3 });
    expect(gradeChoice(question, 1)).toEqual({ correct: false, quality: 0, score: 1 });
  });

  it('gradeChoice tanpa skor: satu jawaban benar', () => {
    const question = { question: 'Q', options: ['A', 'B'], answerIndex: 1, explanation: 'E' };
    expect(gradeChoice(question, 1).correct).toBe(true);
    expect(gradeChoice(question, 0).correct).toBe(false);
  });
});
