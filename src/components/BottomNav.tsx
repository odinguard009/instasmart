import { NavLink, useLocation } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Beranda', icon: 'home' },
  { to: '/jelajah', label: 'Jelajah', icon: 'search' },
  { to: '/reels', label: 'Reels', icon: 'reels' },
  { to: '/profil', label: 'Profil', icon: 'user' },
];

export function BottomNav() {
  const { pathname } = useLocation();
  // Seperti aplikasi media sosial pada umumnya: mengetuk tab yang sedang aktif membawa layar kembali ke atas.
  const scrollTopIfActive = (to: string) => {
    if (pathname === to) document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <nav aria-label="Navigasi utama" className="pb-safe z-40 shrink-0 border-t border-line bg-bg">
      <ul className="flex h-14">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink to={tab.to} end={tab.to === '/'} onClick={() => scrollTopIfActive(tab.to)} className={({ isActive }) => `flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${isActive ? 'text-ink' : 'text-muted'}`}>
              {({ isActive }) => (
                <>
                  <Icon name={tab.icon} className="h-6 w-6" filled={isActive && tab.icon !== 'search' && tab.icon !== 'reels'} />
                  {tab.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
