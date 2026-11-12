/** Caption panjang dipotong (3 baris + "lainnya") supaya feed tetap bisa dipindai; sumber dan lencana draf tidak ikut terpotong. */
export const CAPTION_COLLAPSE_CHARS = 150;

export function shouldCollapseCaption(caption: string): boolean {
  return caption.length > CAPTION_COLLAPSE_CHARS;
}
