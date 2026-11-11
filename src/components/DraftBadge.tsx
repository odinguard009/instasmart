import type { Card } from '@/content/schema';
import { effectiveStatus } from '@/domain/moderation';
import { useStore } from '@/state/store';
import { Icon } from './Icon';

/** Lencana verifikasi. Kartu draft SELALU menampilkan peringatan; jangan disembunyikan. */
export function DraftBadge({ card }: { card: Card }) {
  const status = useStore((s) => effectiveStatus(card, s.moderation));
  if (status === 'approved') {
    return (
      <p className="flex items-center gap-1.5 text-xs font-semibold text-good">
        <Icon name="check" className="h-3.5 w-3.5" /> Sudah diverifikasi
      </p>
    );
  }
  return (
    <p className="flex items-start gap-1.5 rounded-lg bg-warn/15 px-2.5 py-1.5 text-xs font-semibold text-warn">
      <Icon name="shield" className="mt-px h-3.5 w-3.5 shrink-0" />
      <span>
        Belum diverifikasi: cek sumbernya sebelum dihafal.
        {card.needsVerification && ' Pembuat kartu ragu pada detail/versi peraturan di kartu ini.'}
      </span>
    </p>
  );
}
