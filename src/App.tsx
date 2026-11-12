import { lazy, Suspense, useEffect, useRef } from 'react';
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { CardDetailPage } from '@/features/explore/CardDetailPage';
import { ExplorePage } from '@/features/explore/ExplorePage';
import { HomePage } from '@/features/home/HomePage';
import { ReelsPage } from '@/features/reels/ReelsPage';
import { useScrollMemory } from '@/lib/useScrollMemory';
import { useActions, useStore } from '@/state/store';

// Layar yang jarang dibuka dimuat saat dibutuhkan, supaya pembukaan awal (Beranda) lebih ringan.
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('@/features/profile/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const ReviewPage = lazy(() => import('@/features/review/ReviewPage').then((m) => ({ default: m.ReviewPage })));
const RenderPage = lazy(() => import('@/features/reels/RenderPage').then((m) => ({ default: m.RenderPage })));

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

/** Area gulir satu rute. Di-remount per rute (key) supaya tiap layar mulai bersih, lalu posisi lamanya dipulihkan. */
function RouteScroller({ pathname }: { pathname: string }) {
  const ref = useRef<HTMLElement>(null);
  useScrollMemory(ref, pathname);
  // Reels mengatur gulirannya sendiri (snap layar penuh); halaman lain bergulir biasa.
  const fullBleed = pathname === '/reels';
  return (
    <main ref={ref} className={`min-h-0 flex-1 ${fullBleed ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      <Suspense fallback={<p className="p-6 text-center text-sm text-muted">Memuat…</p>}>
        <Outlet />
      </Suspense>
    </main>
  );
}

function Shell() {
  const { pathname } = useLocation();
  return (
    <div className="mx-auto flex h-full max-w-[480px] flex-col bg-bg">
      <RouteScroller key={pathname} pathname={pathname} />
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
        <Route
          path="/render/:id"
          element={
            <Suspense fallback={null}>
              <RenderPage />
            </Suspense>
          }
        />
        <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route path="jelajah" element={<ExplorePage />} />
          <Route path="reels" element={<ReelsPage />} />
          {/* Favorit kini tab Disimpan/Disukai di Profil; alamat lama tetap berfungsi. */}
          <Route path="favorit" element={<Navigate to="/profil" replace />} />
          <Route path="profil" element={<ProfilePage />} />
          <Route path="pengaturan" element={<SettingsPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="kartu/:id" element={<CardDetailPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
