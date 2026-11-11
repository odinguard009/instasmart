/** Status verifikasi efektif = status di file konten + tindakan pengguna (setujui / lapor) yang disimpan lokal. */
import type { Card } from '@/content/schema';
import type { ModerationMap } from '@/state/schema';

export type EffectiveStatus = 'draft' | 'approved' | 'reported';

export function effectiveStatus(card: Card, moderation: ModerationMap): EffectiveStatus {
  const local = moderation[card.id];
  if (local?.reportedAt) return 'reported';
  if (local?.approved === true || (card.status === 'approved' && local?.approved !== false)) return 'approved';
  return 'draft';
}

/** Kartu yang boleh muncul: yang dilaporkan salah selalu disembunyikan; draft ikut pengaturan pengguna. */
export function eligibleCards(cards: readonly Card[], moderation: ModerationMap, showUnverified: boolean): Card[] {
  return cards.filter((card) => {
    const status = effectiveStatus(card, moderation);
    return status === 'approved' || (status === 'draft' && showUnverified);
  });
}
