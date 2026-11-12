/**
 * Tata letak teks untuk SVG (SVG tidak punya pemenggalan baris otomatis).
 * Lebar huruf diperkirakan dari jumlah karakter; cukup akurat untuk font sistem tebal.
 */

/** Perkiraan lebar rata-rata satu karakter relatif terhadap ukuran font. */
export const CHAR_WIDTH = 0.56;
export const CHAR_WIDTH_CAPS = 0.66;

/** Memenggal teks per kata agar tiap baris <= maxChars. Kata yang terlalu panjang dipotong paksa. */
export function wrapText(text: string, maxChars: number): string[] {
  const limit = Math.max(1, Math.floor(maxChars));
  const lines: string[] = [];
  let line = '';
  for (const rawWord of text.split(/\s+/).filter(Boolean)) {
    let word = rawWord;
    while (word.length > limit) {
      if (line) {
        lines.push(line);
        line = '';
      }
      lines.push(word.slice(0, limit));
      word = word.slice(limit);
    }
    if (!line) line = word;
    else if (line.length + 1 + word.length <= limit) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export interface TextLayoutOptions {
  maxWidth: number;
  maxLines: number;
  /** Kandidat ukuran font dari terbesar ke terkecil; dipilih yang terbesar yang muat. */
  sizes: readonly number[];
  lineHeight?: number;
  caps?: boolean;
  /** Batas tinggi blok; ukuran font diturunkan sampai muat. */
  maxHeight?: number;
}

export interface TextLayout {
  fontSize: number;
  lines: string[];
  lineHeight: number;
  /** Tinggi blok teks. */
  height: number;
  /** True bila teks tidak muat dan dipotong dengan elipsis. */
  truncated: boolean;
}

export function layoutText(rawText: string, options: TextLayoutOptions): TextLayout {
  const text = options.caps ? rawText.toUpperCase() : rawText;
  const charWidth = options.caps ? CHAR_WIDTH_CAPS : CHAR_WIDTH;
  const lineHeight = options.lineHeight ?? 1.18;
  const smallest = options.sizes[options.sizes.length - 1] ?? 32;
  const wrapAt = (size: number) => wrapText(text, options.maxWidth / (size * charWidth));

  const maxHeight = options.maxHeight ?? Infinity;
  const longestWord = Math.max(0, ...text.split(/\s+/).map((word) => word.length));
  const fits = (size: number, allowSplitWords: boolean) => {
    const count = wrapAt(size).length;
    const wordsIntact = longestWord <= Math.floor(options.maxWidth / (size * charWidth));
    return count <= options.maxLines && count * size * lineHeight <= maxHeight && (allowSplitWords || wordsIntact);
  };
  // Utamakan ukuran yang tidak memotong kata di tengah; baru longgarkan jika tidak ada yang muat.
  const fontSize = options.sizes.find((size) => fits(size, false)) ?? options.sizes.find((size) => fits(size, true)) ?? smallest;
  let lines = wrapAt(fontSize);
  const truncated = lines.length > options.maxLines;
  if (truncated) {
    lines = lines.slice(0, options.maxLines);
    const last = lines[lines.length - 1] ?? '';
    lines[lines.length - 1] = `${last.replace(/[\s.,;:]+$/, '')}…`;
  }
  return { fontSize, lines, lineHeight, height: lines.length * fontSize * lineHeight, truncated };
}
