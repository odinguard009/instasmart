/** Detail satu kartu (dibuka dari Jelajah/Profil/Review). Tidak memakai kuota harian. */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CardView } from '@/cards/CardView';
import { SubPageHeader } from '@/components/SubPageHeader';
import { library } from '@/content';
import { TYPE_LABELS } from '@/content/lookup';
import { StoryViewer } from '@/features/stories/StoryViewer';
import { useActions } from '@/state/store';

export function CardDetailPage() {
  const { id } = useParams();
  const card = id ? library.cardById.get(id) : undefined;
  const { viewCard } = useActions();
  const [storyOpen, setStoryOpen] = useState(false);
  const cardId = card?.id;

  useEffect(() => {
    if (cardId) viewCard(cardId);
  }, [cardId, viewCard]);

  return (
    <div>
      <SubPageHeader title={card ? TYPE_LABELS[card.type] : 'Kartu'} fallback="/jelajah" />
      {card ? <CardView card={card} onOpenStory={() => setStoryOpen(true)} /> : <p className="p-8 text-center text-sm text-muted">Kartu tidak ditemukan.</p>}
      {storyOpen && card?.type === 'story' && <StoryViewer stories={[card]} startIndex={0} onClose={() => setStoryOpen(false)} />}
    </div>
  );
}
