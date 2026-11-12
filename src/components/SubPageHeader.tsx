/** Header layar turunan: tombol kembali + judul. Bila tidak ada riwayat (dibuka langsung), kembali ke `fallback`. */
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

export function SubPageHeader({ title, fallback = '/' }: { title: string; fallback?: string }) {
  const navigate = useNavigate();
  const back = () => {
    // history.state.idx diisi React Router; 0 berarti layar ini halaman pertama dalam sesi.
    const index = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (index > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  };
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-1 border-b border-line bg-bg/95 px-1 backdrop-blur">
      <button type="button" className="grid h-11 w-11 place-items-center" onClick={back} aria-label="Kembali">
        <Icon name="back" />
      </button>
      <h1 className="truncate text-base font-bold">{title}</h1>
    </header>
  );
}
