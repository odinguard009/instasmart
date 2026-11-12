import { describe, expect, it } from 'vitest';
import { anchorDelta, pickAnchor } from '@/domain/scrollAnchor';

describe('pickAnchor', () => {
  const rects = [
    { key: 'a', top: -900, bottom: -300 },
    { key: 'b', top: -300, bottom: 200 },
    { key: 'c', top: 200, bottom: 800 },
  ];
  it('memilih item pertama yang masih terlihat di bawah tepi atas', () => {
    expect(pickAnchor(rects, 0)).toEqual({ key: 'b', offset: -300 });
  });
  it('memperhitungkan posisi tepi atas area gulir', () => {
    expect(pickAnchor(rects, 250)).toEqual({ key: 'c', offset: -50 });
  });
  it('null bila tidak ada item di area pandang', () => {
    expect(pickAnchor(rects, 900)).toBeNull();
    expect(pickAnchor([], 0)).toBeNull();
  });
});

describe('anchorDelta', () => {
  it('menggeser sehingga item kembali di selisih semula', () => {
    // Item sekarang 1200px di bawah tepi atas; sebelumnya terpotong 300px di atas.
    expect(anchorDelta({ key: 'b', offset: -300 }, 1200 + 50, 50)).toBe(1500);
  });
  it('nol bila posisi sudah sama', () => {
    expect(anchorDelta({ key: 'b', offset: 20 }, 70, 50)).toBe(0);
  });
});
