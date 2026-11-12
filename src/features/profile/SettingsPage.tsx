/** Pengaturan: preferensi, tautan ke Review, dan cadangan data (dipisah dari Profil seperti menu pengaturan aplikasi). */
import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { SubPageHeader } from '@/components/SubPageHeader';
import { BackupSection } from './BackupSection';
import { SettingsSection } from './SettingsSection';

export function SettingsPage() {
  return (
    <div>
      <SubPageHeader title="Pengaturan" fallback="/profil" />
      <div className="space-y-4 px-4 pb-10 pt-4">
        <SettingsSection />
        <Link to="/review" className="flex h-14 items-center justify-between rounded-2xl bg-surface px-4 font-bold">
          <span className="flex items-center gap-2">
            <Icon name="shield" className="h-5 w-5" /> Review &amp; verifikasi kartu
          </span>
          <span aria-hidden>›</span>
        </Link>
        <BackupSection />
      </div>
    </div>
  );
}
