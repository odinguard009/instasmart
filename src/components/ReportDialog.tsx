import { useState } from 'react';
import type { Card } from '@/content/schema';
import { useActions } from '@/state/store';

/** Dialog "Lapor salah": kartu yang dilaporkan langsung disembunyikan dari feed. */
export function ReportDialog({ card, onClose }: { card: Card; onClose: () => void }) {
  const [note, setNote] = useState('');
  const { reportCard } = useActions();
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/60 sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="report-title" onClick={onClose}>
      <form
        className="w-full max-w-md rounded-t-2xl bg-surface p-5 pb-8 sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          reportCard(card.id, note);
          onClose();
        }}
      >
        <h2 id="report-title" className="text-lg font-bold">
          Lapor salah
        </h2>
        <p className="mt-1 text-sm text-muted">
          Kartu ini akan disembunyikan dari feed dan masuk daftar "Dilaporkan" di halaman Review. Sumber kartu: {card.source.title}, {card.source.reference}.
        </p>
        <label className="mt-4 block text-sm font-semibold" htmlFor="report-note">
          Apa yang salah? (opsional)
        </label>
        <textarea
          id="report-note"
          className="mt-1 h-24 w-full rounded-xl border border-line bg-bg p-3 text-sm"
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Mis. nomor pasal keliru, sudah diubah UU baru, dsb."
        />
        <div className="mt-4 flex gap-3">
          <button type="button" className="h-12 flex-1 rounded-xl bg-raised font-semibold" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="h-12 flex-1 rounded-xl bg-bad font-semibold text-white">
            Laporkan
          </button>
        </div>
      </form>
    </div>
  );
}
