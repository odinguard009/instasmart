/** Pemutar reel: jam requestAnimationFrame di atas mesin murni (engine/). Tap = jeda, tombol suara = narasi. */
import { useEffect, useReducer, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import type { CardOf, PaletteId } from '@/content/schema';
import { useActions, useStore } from '@/state/store';
import { INITIAL_PLAYER, playerReducer, type PlayerAction, type PlayerState } from './engine/player';
import { buildTimeline, locate } from './engine/timeline';
import { ReelStage } from './ReelStage';
import { narrationSupported, useNarration } from './useNarration';

interface ReelPlayerProps {
  card: CardOf<'reel'>;
  topicPalette: PaletteId;
  /** Reel hanya berjalan saat aktif (terlihat di layar). */
  active: boolean;
  className?: string;
}

export function ReelPlayer({ card, topicPalette, active, className }: ReelPlayerProps) {
  const timeline = buildTimeline(card.scenes);
  const totalMs = timeline.totalMs;
  const [player, dispatch] = useReducer(
    (state: PlayerState, action: PlayerAction) => playerReducer(state, action, totalMs),
    { ...INITIAL_PLAYER, playing: true },
  );
  const [pausedByUser, setPausedByUser] = useState(false);
  const sound = useStore((s) => s.settings.sound);
  const { updateSettings } = useActions();
  const playing = active && !pausedByUser;
  const lastFrame = useRef(0);

  useEffect(() => {
    if (!playing) return;
    lastFrame.current = performance.now();
    let raf = requestAnimationFrame(function loop(now) {
      dispatch({ type: 'tick', deltaMs: now - lastFrame.current });
      lastFrame.current = now;
      raf = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const scene = card.scenes[locate(timeline, player.timeMs).sceneIndex];
  useNarration(scene?.caption ?? '', playing && sound);

  return (
    <div className={`relative select-none overflow-hidden bg-black ${className ?? ''}`}>
      <button
        type="button"
        className="absolute inset-0 block h-full w-full cursor-pointer text-left"
        onClick={() => setPausedByUser((paused) => !paused)}
        aria-label={playing ? 'Jeda reel' : 'Putar reel'}
      >
        <ReelStage card={card} timeMs={player.timeMs} topicPalette={topicPalette} />
        {pausedByUser && (
          <span className="absolute inset-0 grid place-items-center bg-black/25">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-black/55 text-white">
              <Icon name="play" className="h-8 w-8" />
            </span>
          </span>
        )}
      </button>
      <button
        type="button"
        className="absolute right-3 top-5 grid h-11 w-11 place-items-center rounded-full bg-black/45 text-white"
        onClick={() => updateSettings({ sound: !sound })}
        aria-label={sound ? 'Matikan narasi suara' : 'Nyalakan narasi suara'}
        aria-pressed={sound}
        title={narrationSupported() ? undefined : 'Perangkat ini tidak mendukung narasi suara; caption tetap tampil.'}
      >
        <Icon name={sound ? 'volume' : 'mute'} className="h-5 w-5" />
      </button>
    </div>
  );
}
