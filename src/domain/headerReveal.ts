/**
 * Header yang menyingkir saat menggulir ke bawah dan muncul lagi saat menggulir ke atas,
 * supaya layar ponsel lebih banyak dipakai konten. Ambang kecil mencegah header berkedip karena getaran jari.
 */
export const HEADER_REVEAL_THRESHOLD_PX = 8;

export function nextHeaderVisible(visible: boolean, previousTop: number, top: number, headerHeight: number): boolean {
  if (top <= headerHeight) return true;
  const delta = top - previousTop;
  if (delta > HEADER_REVEAL_THRESHOLD_PX) return false;
  if (delta < -HEADER_REVEAL_THRESHOLD_PX) return true;
  return visible;
}
