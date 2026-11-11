/** Store zustand: state pengguna + aksi. Aksi hanya meneruskan ke reducer murni dan menyimpan hasilnya. */
import { create } from 'zustand';
import { library } from '@/content';
import { todayKey } from '@/lib/date';
import { browserStorage, loadState, saveState } from './persistence';
import * as reducers from './reducers';
import { createInitialState, type Settings, type UserState } from './schema';

interface Actions {
  startDay(): void;
  extendDay(): void;
  consumeItem(itemKey: string, cardIds: readonly string[]): void;
  viewCard(cardId: string): void;
  markStorySeen(storyId: string): void;
  recordAnswer(input: reducers.AnswerInput): void;
  toggleFavorite(cardId: string, field: 'liked' | 'saved'): void;
  setApproved(cardId: string, approved: boolean): void;
  reportCard(cardId: string, note: string): void;
  clearReport(cardId: string): void;
  updateSettings(patch: Partial<Settings>): void;
  replaceState(state: UserState): void;
  resetAll(): void;
}

export type Store = UserState & { actions: Actions };

const storage = browserStorage();
const nowIso = () => new Date().toISOString();

export const useStore = create<Store>()((set) => {
  const apply = (reduce: (state: UserState) => UserState) => set((store) => reduce(store));
  return {
    ...loadState(storage),
    actions: {
      startDay: () => apply((s) => reducers.startDay(s, library.cards, todayKey())),
      extendDay: () => apply((s) => reducers.extendDay(s, library.cards, todayKey())),
      consumeItem: (itemKey, cardIds) => apply((s) => reducers.consumeItem(s, itemKey, cardIds, todayKey())),
      viewCard: (cardId) => apply((s) => reducers.viewCard(s, cardId, todayKey())),
      markStorySeen: (storyId) => apply((s) => reducers.markStorySeen(s, storyId, todayKey())),
      recordAnswer: (input) => apply((s) => reducers.recordAnswer(s, input, todayKey())),
      toggleFavorite: (cardId, field) => apply((s) => reducers.toggleFavorite(s, cardId, field, nowIso())),
      setApproved: (cardId, approved) => apply((s) => reducers.setApproved(s, cardId, approved)),
      reportCard: (cardId, note) => apply((s) => reducers.reportCard(s, cardId, note, nowIso())),
      clearReport: (cardId) => apply((s) => reducers.clearReport(s, cardId)),
      updateSettings: (patch) => apply((s) => reducers.updateSettings(s, patch)),
      replaceState: (state) => {
        set(state);
        apply((s) => reducers.startDay(s, library.cards, todayKey()));
      },
      resetAll: () => {
        set(createInitialState());
        apply((s) => reducers.startDay(s, library.cards, todayKey()));
      },
    },
  };
});

/** State tanpa aksi: bentuk yang disimpan dan diekspor. */
export function snapshot(store: Store): UserState {
  const { actions: _actions, ...state } = store;
  return state;
}

useStore.subscribe((store) => saveState(storage, snapshot(store)));

export const useActions = () => useStore((store) => store.actions);
