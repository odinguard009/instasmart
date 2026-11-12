/** Navigasi story (murni): maju otomatis berdasar waktu, tap maju/mundur, pindah ke story berikutnya, selesai. */

export interface StoryPosition {
  story: number;
  slide: number;
  elapsedMs: number;
}

export interface StoryNavState {
  position: StoryPosition;
  /** true setelah slide terakhir dari story terakhir terlewati: viewer harus ditutup. */
  done: boolean;
}

export type StoryNavAction = { type: 'tick'; deltaMs: number; slideDurationMs: number } | { type: 'next' } | { type: 'prev' } | { type: 'nextStory' } | { type: 'prevStory' };

export function initialStoryNav(story: number): StoryNavState {
  return { position: { story, slide: 0, elapsedMs: 0 }, done: false };
}

function next(state: StoryNavState, slideCounts: readonly number[]): StoryNavState {
  const { story, slide } = state.position;
  if (slide + 1 < (slideCounts[story] ?? 0)) return { ...state, position: { story, slide: slide + 1, elapsedMs: 0 } };
  if (story + 1 < slideCounts.length) return { ...state, position: { story: story + 1, slide: 0, elapsedMs: 0 } };
  return { ...state, done: true };
}

function prev(state: StoryNavState, slideCounts: readonly number[]): StoryNavState {
  const { story, slide } = state.position;
  if (slide > 0) return { ...state, position: { story, slide: slide - 1, elapsedMs: 0 } };
  if (story > 0) return { ...state, position: { story: story - 1, slide: Math.max(0, (slideCounts[story - 1] ?? 1) - 1), elapsedMs: 0 } };
  return { ...state, position: { story, slide, elapsedMs: 0 } };
}

/** Geser horizontal: lompat ke awal story berikutnya/sebelumnya (geser setelah story terakhir = selesai). */
function jumpStory(state: StoryNavState, slideCounts: readonly number[], step: 1 | -1): StoryNavState {
  const target = state.position.story + step;
  if (target >= slideCounts.length) return { ...state, done: true };
  return { ...state, position: { story: Math.max(0, target), slide: 0, elapsedMs: 0 } };
}

/** `slideCounts[i]` = jumlah slide story ke-i. */
export function storyNavReducer(state: StoryNavState, action: StoryNavAction, slideCounts: readonly number[]): StoryNavState {
  if (state.done) return state;
  switch (action.type) {
    case 'next':
      return next(state, slideCounts);
    case 'prev':
      return prev(state, slideCounts);
    case 'nextStory':
      return jumpStory(state, slideCounts, 1);
    case 'prevStory':
      return jumpStory(state, slideCounts, -1);
    case 'tick': {
      const elapsedMs = state.position.elapsedMs + Math.max(0, action.deltaMs);
      if (elapsedMs >= action.slideDurationMs) return next(state, slideCounts);
      return { ...state, position: { ...state.position, elapsedMs } };
    }
  }
}

/** 'none' = tahan lama atau gerakan lain (mis. geser ke atas): hanya jeda, tanpa navigasi. */
export type StoryGesture = 'close' | 'nextStory' | 'prevStory' | 'tapPrev' | 'tapNext' | 'none';

/** Jarak (px) dan durasi (ms) yang membedakan geser, tap, dan tahan. */
export const STORY_GESTURE = { swipePx: 60, tapMaxMs: 250, tapPrevZone: 0.3 } as const;

/**
 * Menerjemahkan satu tekanan jari menjadi aksi: geser ke bawah menutup, geser kiri/kanan pindah story,
 * tekanan singkat = tap (kiri 30% mundur), selain itu tidak bernavigasi.
 */
export function classifyStoryGesture(dx: number, dy: number, durationMs: number, xRatio: number): StoryGesture {
  const { swipePx, tapMaxMs, tapPrevZone } = STORY_GESTURE;
  if (dy > swipePx && dy > Math.abs(dx)) return 'close';
  if (Math.abs(dx) > swipePx && Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'nextStory' : 'prevStory';
  if (durationMs > tapMaxMs || Math.hypot(dx, dy) > swipePx) return 'none';
  return xRatio < tapPrevZone ? 'tapPrev' : 'tapNext';
}
