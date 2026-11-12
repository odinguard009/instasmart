/** Penampil story layar penuh: auto-lanjut, progress bar, tap kiri/kanan, tahan untuk jeda, geser untuk pindah/tutup. */
import { useEffect, useReducer, useRef, useState } from 'react';
import { AccountAvatar } from '@/components/AccountAvatar';
import { Icon } from '@/components/Icon';
import { STORY_SLIDE_MS } from '@/config/feed';
import type { CardOf } from '@/content/schema';
import { subTopicName, topicPaletteOf } from '@/content/lookup';
import { effectiveStatus } from '@/domain/moderation';
import { useActions, useStore } from '@/state/store';
import { VisualView } from '@/visuals/VisualView';
import { classifyStoryGesture, initialStoryNav, storyNavReducer, type StoryNavAction, type StoryNavState } from './storyNav';

interface StoryViewerProps {
  stories: readonly CardOf<'story'>[];
  startIndex: number;
  onClose: () => void;
}

export function StoryViewer({ stories, startIndex, onClose }: StoryViewerProps) {
  const slideCounts = stories.map((story) => story.slides.length);
  const [nav, dispatch] = useReducer((state: StoryNavState, action: StoryNavAction) => storyNavReducer(state, action, slideCounts), initialStoryNav(startIndex));
  const [paused, setPaused] = useState(false);
  const press = useRef({ at: 0, x: 0, y: 0 });
  const { markStorySeen } = useActions();

  const story = stories[nav.position.story];
  const slide = story?.slides[nav.position.slide];
  const durationMs = slide?.durationMs ?? STORY_SLIDE_MS;
  const draft = useStore((s) => (story ? effectiveStatus(story, s.moderation) !== 'approved' : false));
  const isLastSlide = story !== undefined && nav.position.slide === story.slides.length - 1;
  const storyId = story?.id;

  useEffect(() => {
    if (nav.done) onClose();
  }, [nav.done, onClose]);

  useEffect(() => {
    if (isLastSlide && storyId) markStorySeen(storyId);
  }, [isLastSlide, storyId, markStorySeen]);

  useEffect(() => {
    if (paused || nav.done) return;
    let last = performance.now();
    let raf = requestAnimationFrame(function loop(now) {
      dispatch({ type: 'tick', deltaMs: now - last, slideDurationMs: durationMs });
      last = now;
      raf = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(raf);
  }, [paused, nav.done, durationMs]);

  if (!story || !slide) return null;

  return (
    <div className="pt-safe pb-safe fixed inset-0 z-50 flex items-center justify-center bg-black" role="dialog" aria-modal="true" aria-label={`Story ${story.title}`}>
      {/* Kanvas story 9:16 ditampilkan utuh (tanpa terpotong); sisa layar hitam seperti letterbox. */}
      <div className="relative aspect-[9/16] max-h-full w-full max-w-[min(480px,calc(100dvh*9/16))] overflow-hidden sm:rounded-xl">
        <VisualView visual={slide.visual} topicPalette={topicPaletteOf(story)} frame="story" className="absolute inset-0 h-full w-full" />
        <button
          type="button"
          className="absolute inset-0 h-full w-full cursor-default touch-none"
          aria-label="Tap kanan untuk lanjut, kiri untuk kembali, tahan untuk jeda, geser ke bawah untuk menutup"
          onPointerDown={(event) => {
            press.current = { at: performance.now(), x: event.clientX, y: event.clientY };
            setPaused(true);
          }}
          onPointerUp={(event) => {
            setPaused(false);
            const box = event.currentTarget.getBoundingClientRect();
            const start = press.current;
            const gesture = classifyStoryGesture(event.clientX - start.x, event.clientY - start.y, performance.now() - start.at, (event.clientX - box.left) / box.width);
            if (gesture === 'close') onClose();
            else if (gesture === 'nextStory' || gesture === 'prevStory') dispatch({ type: gesture });
            else if (gesture === 'tapPrev') dispatch({ type: 'prev' });
            else if (gesture === 'tapNext') dispatch({ type: 'next' });
          }}
          onPointerCancel={() => setPaused(false)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') dispatch({ type: 'next' });
            if (event.key === 'ArrowLeft') dispatch({ type: 'prev' });
            if (event.key === 'Escape') onClose();
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent px-2.5 pb-8 pt-2.5">
          <div className="flex gap-1">
            {story.slides.map((_, index) => {
              const filled = index < nav.position.slide ? 1 : index === nav.position.slide ? nav.position.elapsedMs / durationMs : 0;
              return (
                <div key={index} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35">
                  <div className="h-full origin-left bg-white" style={{ transform: `scaleX(${filled})` }} />
                </div>
              );
            })}
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-white">
            <AccountAvatar card={story} className="h-9 w-9" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold">{story.account}</p>
              <p className="truncate text-xs opacity-85">{subTopicName(story)}</p>
            </div>
            <button type="button" className="pointer-events-auto grid h-11 w-11 place-items-center" onClick={onClose} aria-label="Tutup story">
              <Icon name="close" className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2 pt-8 text-[11px] leading-snug text-white">
          {draft && <p className="mb-1 font-bold text-amber-300">Belum diverifikasi: cek sumbernya sebelum dihafal.</p>}
          <p className="opacity-90">
            Sumber: {story.source.title}, {story.source.reference}
          </p>
        </div>
      </div>
    </div>
  );
}
