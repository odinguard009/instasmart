import { describe, expect, it } from 'vitest';
import { isDue, SM2_INITIAL_EASE, SM2_MIN_EASE, sm2Next } from '@/domain/sm2';

const TODAY = '2026-03-10';

describe('sm2Next', () => {
  it('jawaban benar pertama: ulang besok', () => {
    const next = sm2Next(undefined, 4, TODAY);
    expect(next).toMatchObject({ repetitions: 1, intervalDays: 1, dueDate: '2026-03-11' });
    expect(next.easeFactor).toBeCloseTo(SM2_INITIAL_EASE);
  });

  it('benar kedua: 6 hari; benar ketiga: interval x ease factor', () => {
    const first = sm2Next(undefined, 5, TODAY);
    const second = sm2Next(first, 5, '2026-03-11');
    expect(second).toMatchObject({ repetitions: 2, intervalDays: 6, dueDate: '2026-03-17' });
    const third = sm2Next(second, 5, '2026-03-17');
    expect(third.repetitions).toBe(3);
    expect(third.intervalDays).toBe(Math.round(6 * third.easeFactor));
    expect(third.intervalDays).toBeGreaterThan(6);
  });

  it('jawaban salah mengulang dari awal dan menurunkan ease factor', () => {
    const learned = sm2Next(sm2Next(sm2Next(undefined, 5, TODAY), 5, TODAY), 5, TODAY);
    const lapsed = sm2Next(learned, 1, '2026-04-01');
    expect(lapsed).toMatchObject({ repetitions: 0, intervalDays: 1, dueDate: '2026-04-02' });
    expect(lapsed.easeFactor).toBeLessThan(learned.easeFactor);
  });

  it('ease factor tidak pernah di bawah batas minimum', () => {
    let state = sm2Next(undefined, 0, TODAY);
    for (let i = 0; i < 20; i++) state = sm2Next(state, 0, TODAY);
    expect(state.easeFactor).toBe(SM2_MIN_EASE);
  });

  it('kualitas 5 menaikkan ease, kualitas 3 menurunkannya', () => {
    expect(sm2Next(undefined, 5, TODAY).easeFactor).toBeGreaterThan(SM2_INITIAL_EASE);
    expect(sm2Next(undefined, 3, TODAY).easeFactor).toBeLessThan(SM2_INITIAL_EASE);
  });

  it('kualitas di luar 0-5 dijepit', () => {
    expect(sm2Next(undefined, 99, TODAY)).toEqual(sm2Next(undefined, 5, TODAY));
    expect(sm2Next(undefined, -3, TODAY)).toEqual(sm2Next(undefined, 0, TODAY));
  });

  it('melewati pergantian bulan dan tahun dengan benar', () => {
    expect(sm2Next(undefined, 4, '2026-12-31').dueDate).toBe('2027-01-01');
  });
});

describe('isDue', () => {
  it('jatuh tempo bila dueDate <= hari ini', () => {
    const sm2 = sm2Next(undefined, 4, TODAY);
    expect(isDue(sm2, TODAY)).toBe(false);
    expect(isDue(sm2, '2026-03-11')).toBe(true);
    expect(isDue(sm2, '2026-05-01')).toBe(true);
    expect(isDue(undefined, TODAY)).toBe(false);
  });
});
