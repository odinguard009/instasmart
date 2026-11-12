import { describe, expect, it } from 'vitest';
import { CAPTION_COLLAPSE_CHARS, shouldCollapseCaption } from '@/domain/caption';
import { nextHeaderVisible } from '@/domain/headerReveal';

describe('nextHeaderVisible', () => {
  it('selalu tampil di dekat puncak', () => {
    expect(nextHeaderVisible(false, 100, 30, 48)).toBe(true);
  });
  it('sembunyi saat turun, tampil saat naik', () => {
    expect(nextHeaderVisible(true, 500, 560, 48)).toBe(false);
    expect(nextHeaderVisible(false, 560, 500, 48)).toBe(true);
  });
  it('gerakan kecil tidak mengubah keadaan', () => {
    expect(nextHeaderVisible(true, 500, 505, 48)).toBe(true);
    expect(nextHeaderVisible(false, 500, 495, 48)).toBe(false);
  });
});

describe('shouldCollapseCaption', () => {
  it('hanya caption panjang yang dipotong', () => {
    expect(shouldCollapseCaption('a'.repeat(CAPTION_COLLAPSE_CHARS))).toBe(false);
    expect(shouldCollapseCaption('a'.repeat(CAPTION_COLLAPSE_CHARS + 1))).toBe(true);
  });
});
