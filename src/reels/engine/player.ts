/** Mesin status pemutar reel (murni): putar, jeda, maju per frame, ulang otomatis seperti Reels. */

export interface PlayerState {
  timeMs: number;
  playing: boolean;
  /** Berapa kali reel sudah tamat (untuk menandai "sudah ditonton"). */
  loops: number;
}

export type PlayerAction =
  | { type: 'tick'; deltaMs: number }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'toggle' }
  | { type: 'seek'; timeMs: number }
  | { type: 'restart' };

export const INITIAL_PLAYER: PlayerState = { timeMs: 0, playing: false, loops: 0 };

/** Lompatan frame dibatasi supaya tab yang baru aktif lagi tidak melompati beberapa scene sekaligus. */
export const MAX_TICK_MS = 250;

export function playerReducer(state: PlayerState, action: PlayerAction, totalMs: number): PlayerState {
  switch (action.type) {
    case 'tick': {
      if (!state.playing || totalMs <= 0) return state;
      const next = state.timeMs + Math.min(Math.max(0, action.deltaMs), MAX_TICK_MS);
      return next >= totalMs ? { ...state, timeMs: next % totalMs, loops: state.loops + 1 } : { ...state, timeMs: next };
    }
    case 'play':
      return state.playing ? state : { ...state, playing: true };
    case 'pause':
      return state.playing ? { ...state, playing: false } : state;
    case 'toggle':
      return { ...state, playing: !state.playing };
    case 'seek':
      return { ...state, timeMs: Math.min(Math.max(0, action.timeMs), Math.max(0, totalMs)) };
    case 'restart':
      return { ...state, timeMs: 0 };
  }
}
