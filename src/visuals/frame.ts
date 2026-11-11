/** Ukuran kanvas visual. Post = persegi, story = potret 9:16. Template menata diri dari w/h ini. */
export interface Frame {
  w: number;
  h: number;
}

export const FRAMES = {
  square: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 },
} as const satisfies Record<string, Frame>;

export type FrameName = keyof typeof FRAMES;

/** Margin tepi standar template. */
export const MARGIN = 84;
