import { describe, expect, it } from 'vitest';
import { FEED_CONFIG, SM2_QUALITY } from '@/config/feed';
import { planCardIds } from '@/domain/feedBuilder';
import { effectiveStatus, eligibleCards } from '@/domain/moderation';
import { bumpStreak, visibleStreak } from '@/domain/streak';
import { accuracyBySubTopic, totals, weakestTopics } from '@/domain/stats';
import { loadState, saveState, STORAGE_KEY, type KeyValueStorage } from '@/state/persistence';
import * as r from '@/state/reducers';
import { createInitialState, userStateSchema, type UserState } from '@/state/schema';
import { makeCard, makeLibrary } from './fixtures';

const TODAY = '2026-03-10';
const cards = makeLibrary();
const started = (): UserState => r.startDay(createInitialState(), cards, TODAY);
const firstItem = (state: UserState) => {
  const item = state.day?.plan.items.find((i) => i.kind === 'card');
  if (item?.kind !== 'card') throw new Error('rencana kosong');
  return item;
};

describe('hari dan kuota', () => {
  it('startDay membuat rencana sesuai kuota dan tidak mengubahnya di hari yang sama', () => {
    const state = started();
    expect(state.day?.plan.items).toHaveLength(FEED_CONFIG.defaultQuota);
    expect(r.startDay(state, cards, TODAY)).toBe(state);
  });

  it('hari baru = rencana baru dan hitungan harian kembali nol', () => {
    const item = firstItem(started());
    const used = r.consumeItem(started(), item.key, [item.cardId], TODAY);
    const next = r.startDay(used, cards, '2026-03-11');
    expect(next.day?.plan.date).toBe('2026-03-11');
    expect(next.day?.consumed).toEqual([]);
    expect(next.progress[item.cardId]?.seenCount).toBe(1);
  });

  it('consumeItem dihitung sekali per item dan menaikkan streak serta riwayat', () => {
    const state = started();
    const item = firstItem(state);
    const once = r.consumeItem(state, item.key, [item.cardId], TODAY);
    const twice = r.consumeItem(once, item.key, [item.cardId], TODAY);
    expect(twice).toBe(once);
    expect(once.day?.consumed).toEqual([item.key]);
    expect(once.progress[item.cardId]).toMatchObject({ seenCount: 1, lastSeen: TODAY });
    expect(once.streak.current).toBe(1);
    expect(once.history[TODAY]?.items).toBe(1);
  });

  it('key yang bukan bagian rencana diabaikan', () => {
    const state = started();
    expect(r.consumeItem(state, 'c:tidak-ada', ['x'], TODAY)).toBe(state);
  });

  it('viewCard (Jelajah) tidak memakan kuota', () => {
    const state = r.viewCard(started(), 'fact-0', TODAY);
    expect(state.day?.consumed).toEqual([]);
    expect(state.progress['fact-0']?.seenCount).toBe(1);
  });

  it('extendDay menambah paket dan berhenti di batas', () => {
    let state = started();
    for (let i = 0; i < 5; i++) state = r.extendDay(state, cards, TODAY);
    expect(state.day?.plan.items).toHaveLength(FEED_CONFIG.defaultQuota + FEED_CONFIG.maxExtraBatchesPerDay * FEED_CONFIG.extraBatchSize);
  });

  it('markStorySeen mencatat sekali', () => {
    const state = started();
    const storyId = state.day?.plan.storyIds[0] as string;
    const seen = r.markStorySeen(r.markStorySeen(state, storyId, TODAY), storyId, TODAY);
    expect(seen.day?.storiesSeen).toEqual([storyId]);
  });
});

describe('jawaban', () => {
  it('jawaban benar menjadwalkan ulang dan dihitung', () => {
    const state = r.recordAnswer(started(), { answerKey: 'quiz-0', cardId: 'quiz-0', selected: 1, correct: true, quality: SM2_QUALITY.quizCorrect }, TODAY);
    expect(state.progress['quiz-0']).toMatchObject({ correct: 1, wrong: 0, sm2: { repetitions: 1, dueDate: '2026-03-11' } });
    expect(state.day).toMatchObject({ correct: 1, wrong: 0, answers: { 'quiz-0': 1 } });
    expect(state.history[TODAY]).toMatchObject({ correct: 1 });
  });

  it('jawaban kedua untuk kunci yang sama di hari itu diabaikan', () => {
    const input = { answerKey: 'quiz-0', cardId: 'quiz-0', selected: 0, correct: false, quality: SM2_QUALITY.quizWrong };
    const once = r.recordAnswer(started(), input, TODAY);
    expect(r.recordAnswer(once, { ...input, selected: 1, correct: true }, TODAY)).toBe(once);
  });

  it('slide kuis carousel (tanpa quality) tidak membuat jadwal SM-2', () => {
    const state = r.recordAnswer(started(), { answerKey: 'carousel-0#1', cardId: 'carousel-0', selected: 0, correct: false }, TODAY);
    expect(state.progress['carousel-0']).toMatchObject({ wrong: 1 });
    expect(state.progress['carousel-0']?.sm2).toBeUndefined();
  });

  it('kartu yang dijawab salah muncul lagi sebagai kartu ulang esok hari', () => {
    const answered = r.recordAnswer(started(), { answerKey: 'quiz-3', cardId: 'quiz-3', selected: 0, correct: false, quality: SM2_QUALITY.quizWrong }, TODAY);
    const tomorrow = r.startDay(answered, cards, '2026-03-11');
    expect(tomorrow.day?.plan.items).toContainEqual({ kind: 'card', key: 'c:quiz-3', cardId: 'quiz-3', isReview: true });
  });
});

describe('favorit dan moderasi', () => {
  it('suka dan simpan terpisah; entri dihapus bila keduanya mati', () => {
    let state = r.toggleFavorite(createInitialState(), 'a', 'liked', 't1');
    state = r.toggleFavorite(state, 'a', 'saved', 't2');
    expect(state.favorites['a']).toEqual({ liked: true, saved: true, updatedAt: 't2' });
    state = r.toggleFavorite(r.toggleFavorite(state, 'a', 'liked', 't3'), 'a', 'saved', 't4');
    expect(state.favorites).toEqual({});
  });

  it('status efektif: draft -> approved -> reported -> laporan dicabut', () => {
    const card = makeCard('fact', 'f');
    let state = createInitialState();
    expect(effectiveStatus(card, state.moderation)).toBe('draft');
    state = r.setApproved(state, 'f', true);
    expect(effectiveStatus(card, state.moderation)).toBe('approved');
    state = r.reportCard(state, 'f', '  nomor pasal salah ', 'now');
    expect(effectiveStatus(card, state.moderation)).toBe('reported');
    expect(state.moderation['f']?.reportNote).toBe('nomor pasal salah');
    state = r.clearReport(state, 'f');
    expect(effectiveStatus(card, state.moderation)).toBe('draft');
  });

  it('kartu approved di file bisa dibatalkan secara lokal', () => {
    const card = makeCard('fact', 'f', { status: 'approved' });
    expect(effectiveStatus(card, {})).toBe('approved');
    expect(effectiveStatus(card, { f: { approved: false } })).toBe('draft');
  });

  it('kartu dilaporkan selalu disembunyikan; draft mengikuti pengaturan', () => {
    const a = makeCard('fact', 'a');
    const b = makeCard('fact', 'b');
    const c = makeCard('fact', 'c');
    const moderation = { a: { reportedAt: 'now' }, b: { approved: true } };
    expect(eligibleCards([a, b, c], moderation, true).map((x) => x.id)).toEqual(['b', 'c']);
    expect(eligibleCards([a, b, c], moderation, false).map((x) => x.id)).toEqual(['b']);
  });

  it('"tampilkan belum diverifikasi" mati: rencana hanya berisi kartu yang disetujui', () => {
    let state = r.updateSettings(createInitialState(), { showUnverified: false });
    state = r.setApproved(r.setApproved(state, 'fact-0', true), 'quiz-0', true);
    const plan = r.startDay(state, cards, TODAY).day?.plan;
    // fact-0 bertanda `kejutan`, jadi bisa muncul sebagai item biasa atau sebagai kejutan harian.
    expect(plan && [...planCardIds(plan)].sort()).toEqual(['fact-0', 'quiz-0']);
  });
});

describe('pengaturan, streak, statistik', () => {
  it('kuota dijepit ke rentang konfigurasi', () => {
    expect(r.updateSettings(createInitialState(), { dailyQuota: 999 }).settings.dailyQuota).toBe(FEED_CONFIG.maxQuota);
    expect(r.updateSettings(createInitialState(), { dailyQuota: 1 }).settings.dailyQuota).toBe(FEED_CONFIG.minQuota);
  });

  it('streak: lanjut jika berurutan, mulai lagi jika bolong', () => {
    let streak = bumpStreak({ current: 0, best: 0, lastActiveDate: null }, '2026-03-01');
    streak = bumpStreak(streak, '2026-03-01');
    streak = bumpStreak(streak, '2026-03-02');
    expect(streak).toEqual({ current: 2, best: 2, lastActiveDate: '2026-03-02' });
    expect(visibleStreak(streak, '2026-03-03')).toBe(2);
    expect(visibleStreak(streak, '2026-03-04')).toBe(0);
    streak = bumpStreak(streak, '2026-03-05');
    expect(streak).toEqual({ current: 1, best: 2, lastActiveDate: '2026-03-05' });
  });

  it('akurasi per sub-topik dan topik terlemah', () => {
    const a = makeCard('quiz', 'a', { topicId: 't1', subTopicId: 's1' });
    const b = makeCard('quiz', 'b', { topicId: 't2', subTopicId: 's2' });
    const progress = { a: { seenCount: 1, lastSeen: TODAY, correct: 1, wrong: 3 }, b: { seenCount: 1, lastSeen: TODAY, correct: 4, wrong: 0 } };
    const topics = [
      { id: 't1', name: 'T1', shortName: 'T1', palette: 'bata' as const, subTopics: [{ id: 's1', name: 'S1' }, { id: 's9', name: 'S9' }] },
      { id: 't2', name: 'T2', shortName: 'T2', palette: 'laut' as const, subTopics: [{ id: 's2', name: 'S2' }] },
    ];
    const rows = accuracyBySubTopic(topics, [a, b], progress);
    expect(rows.map((row) => row.ratio)).toEqual([0.25, null, 1]);
    expect(weakestTopics([a, b], progress)[0]).toEqual({ topicId: 't1', ratio: 0.25 });
    expect(totals([a, b], progress)).toMatchObject({ cardsSeen: 2, cardsTotal: 2, answers: { correct: 5, wrong: 3 } });
  });
});

describe('penyimpanan dan export/import', () => {
  const memory = (): KeyValueStorage & { data: Map<string, string> } => {
    const data = new Map<string, string>();
    return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) };
  };

  it('simpan lalu muat menghasilkan state yang sama', () => {
    const storage = memory();
    const item = firstItem(started());
    const state = r.consumeItem(started(), item.key, [item.cardId], TODAY);
    saveState(storage, state);
    expect(loadState(storage)).toEqual(state);
  });

  it('data rusak tidak membuat aplikasi gagal dan salinannya disimpan', () => {
    const storage = memory();
    storage.setItem(STORAGE_KEY, '{"version":1,"rusak":true');
    expect(loadState(storage)).toEqual(createInitialState());
    expect([...storage.data.keys()].some((key) => key.includes('rusak'))).toBe(true);
    expect(loadState(undefined)).toEqual(createInitialState());
  });

  it('export -> import bolak-balik utuh; file asing ditolak dengan pesan', () => {
    const state = r.recordAnswer(started(), { answerKey: 'quiz-0', cardId: 'quiz-0', selected: 1, correct: true, quality: 4 }, TODAY);
    const result = r.parseImportedState(JSON.stringify(state));
    expect(result).toEqual({ ok: true, state });
    expect(userStateSchema.safeParse(state).success).toBe(true);
    expect(r.parseImportedState('bukan json')).toMatchObject({ ok: false });
    expect(r.parseImportedState('{"version":99}')).toMatchObject({ ok: false });
  });
});
