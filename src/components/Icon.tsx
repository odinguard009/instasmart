/** Ikon garis buatan sendiri (24x24). Tambah ikon baru cukup dengan menambah entri PATHS. */
const PATHS = {
  home: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm5.2 12.2L21 21',
  reels: 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm-1 5h18M8 4l3 5m3-5 3 5m-6.5 3.5v5l4.5-2.5z',
  heart: 'M12 20.5s-8-4.9-8-10.6A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 8 2.6c0 5.7-8 10.6-8 10.6z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0',
  bookmark: 'M6 3h12a1 1 0 0 1 1 1v17l-7-5-7 5V4a1 1 0 0 1 1-1z',
  share: 'M21 3 10 14m11-11-7 18-4-7-7-4z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  volume: 'M4 9v6h4l5 4V5L8 9zm12.5-.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
  mute: 'M4 9v6h4l5 4V5L8 9zm13 0 4 6m0-6-4 6',
  play: 'M7 4.5v15l13-7.5z',
  close: 'M5 5l14 14M19 5 5 19',
  check: 'M4 12.5 9.5 18 20 6.5',
  flag: 'M5 21V4m0 0h11l-2 4 2 4H5',
  back: 'M15 5l-7 7 7 7',
  flame: 'M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-1.800.7-3 1.500-4 .5 1.500 1.500 2 2 2-.5-3 .5-5.500 1.500-8z',
  gift: 'M4 11h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm-1-4h18v4H3zm9 0v14m0-14S10.500 3 8.500 3a2 2 0 0 0 0 4zm0 0s1.500-4 3.500-4a2 2 0 0 1 0 4z',
  layers: 'M12 3 3 8l9 5 9-5zm-9 9 9 5 9-5m-18 4 9 5 9-5',
  shield: 'M12 3 4.5 6v6c0 4.500 3.200 7.800 7.500 9 4.300-1.200 7.500-4.500 7.500-9V6z',
  refresh: 'M4 12a8 8 0 0 1 14-5.300L20 9m0-5v5h-5m5 3a8 8 0 0 1-14 5.300L4 15m0 5v-5h5',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  className?: string;
  filled?: boolean;
}

export function Icon({ name, className = 'h-6 w-6', filled = false }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}
