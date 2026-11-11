/** "Bagikan sebagai gambar": visual sampul kartu (SVG) -> PNG -> Web Share API, atau unduh jika tidak didukung. */
import { renderToStaticMarkup } from 'react-dom/server';
import { coverVisual } from '@/cards/coverVisual';
import type { Card } from '@/content/schema';
import { topicPaletteOf } from '@/content/lookup';
import { FRAMES } from '@/visuals/frame';
import { VisualView } from '@/visuals/VisualView';

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Gagal memuat gambar SVG'));
    image.src = url;
  });
}

export async function cardToPng(card: Card): Promise<Blob> {
  const svg = renderToStaticMarkup(<VisualView visual={coverVisual(card)} topicPalette={topicPaletteOf(card)} />);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = FRAMES.square.w;
    canvas.height = FRAMES.square.h;
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Gagal membuat PNG'))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled';

export async function shareCardImage(card: Card): Promise<ShareOutcome> {
  const file = new File([await cardToPng(card)], `instasmart-${card.id}.png`, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Instasmart', text: `${card.source.title}, ${card.source.reference}` });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    }
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(link.href);
  return 'downloaded';
}
