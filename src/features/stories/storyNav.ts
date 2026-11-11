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

export type StoryNavAction = { type: 'tick'; deltaMs: number; slideDurationMs: number } | { type: 'next' } | { type: 'prev' };

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

/** `slideCounts[i]` = jumlah slide story ke-i. */
export function storyNavReducer(state: StoryNavState, action: StoryNavAction, slideCounts: readonly number[]): StoryNavState {
  if (state.done) return state;
  switch (action.type) {
    case 'next':
      return next(state, slideCounts);
    case 'prev':
      return prev(state, slideCounts);
    case 'tick': {
      const elapsedMs = state.position.elapsedMs + Math.max(0, action.deltaMs);
      if (elapsedMs >= action.slideDurationMs) return next(state, slideCounts);
      return { ...state, position: { ...state.position, elapsedMs } };
    }
  }
}
