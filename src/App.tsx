import { useEffect } from 'react';
import { HashRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { CardDetailPage } from '@/features/explore/CardDetailPage';
import { ExplorePage } from '@/features/explore/ExplorePage';
import { FavoritesPage } from '@/features/favorites/FavoritesPage';
import { HomePage } from '@/features/home/HomePage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { ReelsPage } from '@/features/reels/ReelsPage';
import { RenderPage } from '@/features/reels/RenderPage';
import { ReviewPage } from '@/features/review/ReviewPage';
import { useActions, useStore } from '@/state/store';

/** Menerapkan tema ke <html> dan mengikuti preferensi sistem bila dipilih. */
function useTheme(): void {
  const theme = useStore((s) => s.settings.theme);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b0b0f' : '#fafafa');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}

/** Menyiapkan rencana hari ini saat aplikasi dibuka dan saat kembali ke aplikasi di hari yang baru. */
function useDailyPlan(): void {
  const { startDay } = useActions();
  useEffect(() => {
    startDay();
    const onVisible = () => {
      if (document.visibilityState === 'visible') startDay();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [startDay]);
}

function Shell() {
  const { pathname } = useLocation();
  // Reels mengatur gulirannya sendiri (snap layar penuh); halaman lain bergulir biasa.
  const fullBleed = pathname === '/reels';
  return (
    <div className="mx-auto flex h-full max-w-[480px] flex-col bg-bg">
      <main key={pathname} className={`min-h-0 flex-1 ${fullBleed ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

export function App() {
  useTheme();
  useDailyPlan();
  return (
    <HashRouter>
      <Routes>
        <Route path="/render/:id" element={<RenderPage />} />
        <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route path="jelajah" element={<ExplorePage />} />
          <Route path="reels" element={<ReelsPage />} />
          <Route path="favorit" element={<FavoritesPage />} />
          <Route path="profil" element={<ProfilePage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="kartu/:id" element={<CardDetailPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
