/** Baris Stories: satu lingkaran per story hari ini; cincin gradien berubah abu-abu setelah ditonton. */
import { useState } from 'react';
import { AccountAvatar } from '@/components/AccountAvatar';
import type { CardOf } from '@/content/schema';
import { subTopicName } from '@/content/lookup';
import { StoryViewer } from '@/features/stories/StoryViewer';
import { useStore } from '@/state/store';

export function StoryRow({ stories }: { stories: readonly CardOf<'story'>[] }) {
  const seen = useStore((s) => s.day?.storiesSeen);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (stories.length === 0) return null;

  return (
    <section aria-label="Stories hari ini" className="border-b border-line">
      <ul className="no-scrollbar flex gap-3 overflow-x-auto px-3 py-3">
        {stories.map((story, index) => {
          const watched = seen?.includes(story.id) ?? false;
          return (
            <li key={story.id} className="shrink-0">
              <button type="button" className="flex w-[76px] flex-col items-center gap-1.5" onClick={() => setOpenIndex(index)} aria-label={`Story ${subTopicName(story)}${watched ? ', sudah ditonton' : ''}`}>
                <span className={`rounded-full p-[3px] ${watched ? 'bg-line' : 'story-ring'}`}>
                  <span className="block rounded-full bg-bg p-[3px]">
                    <AccountAvatar card={story} className="h-[60px] w-[60px]" />
                  </span>
                </span>
                <span className={`line-clamp-2 text-center text-[11px] leading-tight ${watched ? 'text-muted' : ''}`}>{subTopicName(story)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {openIndex !== null && <StoryViewer stories={stories} startIndex={openIndex} onClose={() => setOpenIndex(null)} />}
    </section>
  );
}
