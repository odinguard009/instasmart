import type { Card } from '@/content/schema';
import { accountOf, topicPaletteOf } from '@/content/lookup';
import { CharacterSvg } from '@/visuals/characters/mascots';
import { PALETTES } from '@/visuals/palettes';

/** Avatar akun fiktif: maskot akun di atas warna palet topik. */
export function AccountAvatar({ card, className = 'h-9 w-9' }: { card: Card; className?: string }) {
  const palette = PALETTES[topicPaletteOf(card)];
  return (
    <span className={`block shrink-0 overflow-hidden rounded-full ${className}`} style={{ background: palette.bg }}>
      <CharacterSvg id={accountOf(card)?.character ?? 'owl'} className="h-full w-full translate-y-[8%] scale-110" />
    </span>
  );
}
