/** Detail satu kartu (dibuka dari Jelajah/Favorit/Review). Tidak memakai kuota harian. */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CardView } from '@/cards/CardView';
import { Icon } from '@/components/Icon';
import { library } from '@/content';
import { TYPE_LABELS } from '@/content/lookup';
import { StoryViewer } from '@/features/stories/StoryViewer';
import { useActions } from '@/state/store';

export function CardDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const card = id ? library.cardById.get(id) : undefined;
  const { viewCard } = useActions();
  const [storyOpen, setStoryOpen] = useState(false);
  const cardId = card?.id;

  useEffect(() => {
    if (cardId) viewCard(cardId);
  }, [cardId, viewCard]);

  return (
    <div>
      <header className="sticky top-0 z-30 flex h-12 items-center gap-1 border-b border-line bg-bg/95 px-1 backdrop-blur">
        <button type="button" className="grid h-11 w-11 place-items-center" onClick={() => navigate(-1)} aria-label="Kembali">
          <Icon name="back" />
        </button>
        <h1 className="text-base font-bold">{card ? TYPE_LABELS[card.type] : 'Kartu'}</h1>
      </header>
      {card ? <CardView card={card} onOpenStory={() => setStoryOpen(true)} /> : <p className="p-8 text-center text-sm text-muted">Kartu tidak ditemukan.</p>}
      {storyOpen && card?.type === 'story' && <StoryViewer stories={[card]} startIndex={0} onClose={() => setStoryOpen(false)} />}
    </div>
  );
}
