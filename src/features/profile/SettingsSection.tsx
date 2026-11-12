import { FEED_CONFIG } from '@/config/feed';
import { narrationSupported } from '@/reels/useNarration';
import { THEMES, type Settings } from '@/state/schema';
import { useActions, useStore } from '@/state/store';

const THEME_LABELS: Record<Settings['theme'], string> = { dark: 'Gelap', light: 'Terang', system: 'Ikut sistem' };

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="relative flex min-h-12 cursor-pointer items-center justify-between gap-4 py-2">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span aria-hidden className="relative h-7 w-12 shrink-0 rounded-full bg-raised transition-colors after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-good peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-brand" />
    </label>
  );
}

export function SettingsSection() {
  const settings = useStore((s) => s.settings);
  const { updateSettings } = useActions();
  return (
    <section aria-labelledby="settings-title" className="rounded-2xl bg-surface p-4">
      <h2 id="settings-title" className="text-sm font-bold">
        Preferensi
      </h2>

      <label className="mt-3 block" htmlFor="quota">
        <span className="flex justify-between text-sm font-semibold">
          <span>Target harian</span>
          <span>{settings.dailyQuota} item</span>
        </span>
        <span className="block text-xs text-muted">Titik "target tercapai" di feed. Feed tidak berhenti di sini; kartu berikutnya dimuat otomatis.</span>
      </label>
      <input
        id="quota"
        type="range"
        className="mt-2 h-8 w-full accent-[rgb(var(--brand))]"
        min={FEED_CONFIG.minQuota}
        max={FEED_CONFIG.maxQuota}
        step={1}
        value={settings.dailyQuota}
        onChange={(event) => updateSettings({ dailyQuota: Number(event.target.value) })}
      />

      <Toggle
        label="Tampilkan kartu yang belum diverifikasi"
        hint="Jika dimatikan, hanya kartu yang sudah kamu setujui di halaman Review yang muncul (mulai rencana feed berikutnya)."
        checked={settings.showUnverified}
        onChange={(showUnverified) => updateSettings({ showUnverified })}
      />
      <Toggle
        label="Narasi suara reel"
        hint={narrationSupported() ? 'Memakai suara bawaan perangkat. Caption selalu tampil.' : 'Perangkat/peramban ini tidak menyediakan suara; caption tetap tampil.'}
        checked={settings.sound}
        onChange={(sound) => updateSettings({ sound })}
      />

      <fieldset className="mt-2">
        <legend className="text-sm font-semibold">Tema</legend>
        <div className="mt-2 flex gap-2">
          {THEMES.map((theme) => (
            <label key={theme} className={`relative grid h-11 flex-1 cursor-pointer place-items-center rounded-xl text-sm font-semibold ${settings.theme === theme ? 'bg-ink text-bg' : 'bg-raised'}`}>
              <input type="radio" name="theme" className="sr-only" checked={settings.theme === theme} onChange={() => updateSettings({ theme })} />
              {THEME_LABELS[theme]}
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
