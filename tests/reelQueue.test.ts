import { describe, expect, it } from 'vitest';
import { REEL_REPEAT_GAP, reelQueue } from '@/domain/reelQueue';

const library = Array.from({ length: 10 }, (_, i) => `r${i}`);

describe('reelQueue', () => {
  it('reel rencana hari ini tampil lebih dulu dan ditandai fromPlan', () => {
    const queue = reelQueue([{ key: 'c:r3', cardId: 'r3' }], library, 5, 'seed');
    expect(queue[0]).toEqual({ key: 'c:r3', cardId: 'r3', fromPlan: true });
    expect(queue.slice(1).every((item) => !item.fromPlan)).toBe(true);
  });

  it('tanpa batas: panjang sesuai permintaan walau melebihi pustaka, kunci unik', () => {
    const queue = reelQueue([], library, 95, 'seed');
    expect(queue).toHaveLength(95);
    expect(new Set(queue.map((item) => item.key)).size).toBe(95);
  });

  it('reel yang sama tidak muncul lagi dalam jarak dekat', () => {
    const queue = reelQueue([{ key: 'c:r0', cardId: 'r0' }], library, 60, 'seed');
    queue.forEach((item, index) => {
      const window = queue.slice(Math.max(0, index - REEL_REPEAT_GAP), index).map((other) => other.cardId);
      expect(window).not.toContain(item.cardId);
    });
  });

  it('deterministik untuk seed yang sama dan aman untuk pustaka kecil', () => {
    expect(reelQueue([], library, 20, 'a')).toEqual(reelQueue([], library, 20, 'a'));
    expect(reelQueue([], ['solo'], 3, 'a').map((item) => item.cardId)).toEqual(['solo', 'solo', 'solo']);
    expect(reelQueue([], [], 3, 'a')).toEqual([]);
  });
});
