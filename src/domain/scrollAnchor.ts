/**
 * Jangkar posisi gulir: mengingat item teratas yang terlihat beserta selisihnya, bukan jumlah piksel.
 * Feed memakai content-visibility (tinggi post di luar layar hanya perkiraan), jadi piksel scrollTop
 * akan meleset setelah layar dirakit ulang; posisi relatif terhadap item tertentu tetap tepat.
 */
export interface AnchorRect {
  key: string;
  top: number;
  bottom: number;
}

export interface ScrollAnchor {
  key: string;
  /** Jarak tepi atas item ke tepi atas area gulir (negatif bila item sudah terpotong di atas). */
  offset: number;
}

/** Item pertama (urutan dokumen) yang bagian bawahnya masih di bawah tepi atas area pandang. */
export function pickAnchor(rects: Iterable<AnchorRect>, viewTop: number): ScrollAnchor | null {
  for (const rect of rects) {
    if (rect.bottom > viewTop) return { key: rect.key, offset: rect.top - viewTop };
  }
  return null;
}

/** Perubahan scrollTop yang membuat item jangkar kembali berada `anchor.offset` dari tepi atas. */
export function anchorDelta(anchor: ScrollAnchor, currentTop: number, viewTop: number): number {
  return currentTop - viewTop - anchor.offset;
}
