/** Garis waktu reel: fungsi murni untuk urutan dan waktu scene. */
import type { Scene } from '@/content/schema';

export interface TimelineEntry {
  index: number;
  startMs: number;
  endMs: number;
}

export interface Timeline {
  entries: TimelineEntry[];
  totalMs: number;
}

export function buildTimeline(scenes: readonly Pick<Scene, 'durationMs'>[]): Timeline {
  let cursor = 0;
  const entries = scenes.map((scene, index) => {
    const entry = { index, startMs: cursor, endMs: cursor + scene.durationMs };
    cursor = entry.endMs;
    return entry;
  });
  return { entries, totalMs: cursor };
}

export interface Playhead {
  sceneIndex: number;
  /** Waktu sejak awal scene aktif. */
  localMs: number;
  /** Kemajuan scene aktif, 0..1. */
  sceneProgress: number;
  /** Kemajuan seluruh reel, 0..1. */
  totalProgress: number;
}

/** Posisi putar pada waktu `timeMs` (dijepit ke rentang reel). */
export function locate(timeline: Timeline, timeMs: number): Playhead {
  const last = timeline.entries[timeline.entries.length - 1];
  if (!last) return { sceneIndex: 0, localMs: 0, sceneProgress: 0, totalProgress: 0 };
  const t = Math.min(Math.max(0, timeMs), timeline.totalMs);
  const entry = timeline.entries.find((e) => t < e.endMs) ?? last;
  const localMs = t - entry.startMs;
  return {
    sceneIndex: entry.index,
    localMs,
    sceneProgress: localMs / (entry.endMs - entry.startMs),
    totalProgress: timeline.totalMs === 0 ? 0 : t / timeline.totalMs,
  };
}
