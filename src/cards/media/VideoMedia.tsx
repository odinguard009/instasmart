/** Video file lokal (MP4/WebM di public/videos/): putar otomatis tanpa suara saat terlihat, tap untuk jeda. */
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import type { CardOf } from '@/content/schema';

export function VideoMedia({ card, active, className }: { card: CardOf<'video'>; active: boolean; className?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [pausedByUser, setPausedByUser] = useState(false);
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    const node = video.current;
    if (!node) return;
    if (active && !pausedByUser) void node.play().catch(() => undefined);
    else node.pause();
  }, [active, pausedByUser]);

  return (
    <div className={`relative bg-black ${className ?? ''}`}>
      <video
        ref={video}
        className="h-full w-full object-contain"
        src={`${base}${card.src}`}
        poster={card.poster ? `${base}${card.poster}` : undefined}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        onClick={() => setPausedByUser((paused) => !paused)}
        aria-label={card.caption}
      />
      {pausedByUser && (
        <span className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-black/55 text-white">
            <Icon name="play" className="h-8 w-8" />
          </span>
        </span>
      )}
      <button
        type="button"
        className="absolute right-3 top-5 grid h-11 w-11 place-items-center rounded-full bg-black/45 text-white"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? 'Nyalakan suara video' : 'Matikan suara video'}
        aria-pressed={!muted}
      >
        <Icon name={muted ? 'mute' : 'volume'} className="h-5 w-5" />
      </button>
    </div>
  );
}
