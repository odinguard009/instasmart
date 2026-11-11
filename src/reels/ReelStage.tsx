/** Tampilan reel pada satu titik waktu: scene aktif + progress bar + caption. Tanpa jam; dipakai pemutar dan perender. */
import type { CardOf, PaletteId } from '@/content/schema';
import { buildTimeline, locate } from './engine/timeline';
import { SceneView } from './SceneView';

interface ReelStageProps {
  card: CardOf<'reel'>;
  timeMs: number;
  topicPalette: PaletteId;
}

export function ReelStage({ card, timeMs, topicPalette }: ReelStageProps) {
  const timeline = buildTimeline(card.scenes);
  const head = locate(timeline, timeMs);
  const scene = card.scenes[head.sceneIndex];
  if (!scene) return null;
  return (
    <>
      <SceneView scene={scene} sceneKey={`${card.id}:${head.sceneIndex}`} localMs={head.localMs} topicPalette={topicPalette} />
      <div className="absolute inset-x-2 top-2 flex gap-1" aria-hidden>
        {timeline.entries.map((entry) => {
          const filled = entry.index < head.sceneIndex ? 1 : entry.index === head.sceneIndex ? head.sceneProgress : 0;
          return (
            <div key={entry.index} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30" style={{ flexGrow: entry.endMs - entry.startMs }}>
              <div className="h-full origin-left bg-white" style={{ transform: `scaleX(${filled})` }} />
            </div>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-4 pb-4 pt-12">
        <p className="text-[15px] font-semibold leading-snug text-white drop-shadow" aria-live="off">
          {scene.caption}
        </p>
      </div>
    </>
  );
}
