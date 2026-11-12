/** Visual sampul untuk kartu apa pun: dipakai thumbnail Jelajah/Profil dan "bagikan sebagai gambar". */
import type { Card, Visual } from '@/content/schema';

export function coverVisual(card: Card): Visual {
  switch (card.type) {
    case 'fact':
    case 'humor':
    case 'mnemonic':
      return card.visual;
    case 'quiz':
      return { template: 'bigtype', kicker: 'Kuis', text: card.question };
    case 'poll':
      return { template: 'bigtype', kicker: 'Kamu pilih mana?', text: card.question };
    case 'review':
      return { template: 'bigtype', kicker: 'Ingat lagi', text: card.front };
    case 'carousel': {
      const first = card.slides.find((slide) => slide.kind === 'visual');
      return first?.kind === 'visual' ? first.visual : { template: 'cover', kicker: 'Carousel', title: card.caption };
    }
    case 'story':
      return card.slides[0]?.visual ?? { template: 'cover', kicker: 'Story', title: card.title };
    case 'reel': {
      const scene = card.scenes[0];
      return { template: 'cover', kicker: 'Reel', title: scene?.text ?? card.caption, character: scene?.character, expression: scene?.expression, palette: scene?.palette };
    }
    case 'video':
      return { template: 'cover', kicker: 'Video', title: card.caption };
  }
}

/** Seluruh teks kartu (huruf kecil) untuk pencarian di Jelajah. */
export function cardSearchText(card: Card): string {
  const parts: (string | undefined)[] = [card.account, card.source.title, card.source.reference];
  switch (card.type) {
    case 'fact':
      parts.push(card.caption, JSON.stringify(card.visual));
      break;
    case 'humor':
      parts.push(card.caption, card.teaches, JSON.stringify(card.visual));
      break;
    case 'mnemonic':
      parts.push(card.caption, card.phrase, ...card.expansion);
      break;
    case 'quiz':
    case 'poll':
      parts.push(card.caption, card.question, card.explanation, ...card.options);
      break;
    case 'review':
      parts.push(card.caption, card.front, card.back);
      break;
    case 'carousel':
      parts.push(card.caption, JSON.stringify(card.slides));
      break;
    case 'story':
      parts.push(card.title, JSON.stringify(card.slides));
      break;
    case 'reel':
      parts.push(card.caption, ...card.scenes.flatMap((scene) => [scene.text, scene.caption]));
      break;
    case 'video':
      parts.push(card.caption);
      break;
  }
  return parts.filter(Boolean).join(' ').toLowerCase();
}
