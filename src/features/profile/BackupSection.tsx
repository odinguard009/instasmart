/** Export/import progres sebagai file JSON, dan hapus semua data lokal. */
import { useRef, useState } from 'react';
import { todayKey } from '@/lib/date';
import { parseImportedState } from '@/state/reducers';
import { snapshot, useActions, useStore } from '@/state/store';

export function BackupSection() {
  const { replaceState, resetAll } = useActions();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const exportJson = () => {
    const json = JSON.stringify(snapshot(useStore.getState()), null, 2);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    link.download = `instasmart-progres-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setMessage('Progres diekspor.');
  };

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    const result = parseImportedState(await file.text());
    if (result.ok) {
      replaceState(result.state);
      setMessage('Progres berhasil diimpor.');
    } else {
      setMessage(`Impor gagal: ${result.error}`);
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <section aria-labelledby="backup-title" className="rounded-2xl bg-surface p-4">
      <h2 id="backup-title" className="text-sm font-bold">
        Cadangan progres
      </h2>
      <p className="mt-1 text-xs text-muted">Semua data tersimpan hanya di perangkat ini. Ekspor secara berkala, terutama sebelum ganti HP atau menghapus data peramban.</p>
      <div className="relative mt-3 flex gap-2">
        <button type="button" className="h-12 flex-1 rounded-xl bg-raised text-sm font-bold" onClick={exportJson}>
          Export JSON
        </button>
        <button type="button" className="h-12 flex-1 rounded-xl bg-raised text-sm font-bold" onClick={() => fileInput.current?.click()}>
          Import JSON
        </button>
        <input ref={fileInput} type="file" accept="application/json,.json" className="sr-only" aria-label="Pilih file cadangan JSON" onChange={(event) => void importJson(event.target.files?.[0])} />
      </div>
      {message && (
        <p className="mt-2 text-sm" role="status">
          {message}
        </p>
      )}
      <div className="mt-4 border-t border-line pt-3">
        {confirmReset ? (
          <div className="flex gap-2">
            <button type="button" className="h-12 flex-1 rounded-xl bg-raised text-sm font-bold" onClick={() => setConfirmReset(false)}>
              Batal
            </button>
            <button
              type="button"
              className="h-12 flex-1 rounded-xl bg-bad text-sm font-bold text-white"
              onClick={() => {
                resetAll();
                setConfirmReset(false);
                setMessage('Semua data lokal dihapus.');
              }}
            >
              Ya, hapus semua
            </button>
          </div>
        ) : (
          <button type="button" className="h-11 text-sm font-semibold text-bad" onClick={() => setConfirmReset(true)}>
            Hapus semua data lokal
          </button>
        )}
      </div>
    </section>
  );
}
