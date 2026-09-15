import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage, storageKey } from '@/shared/lib/storage';

interface GuideState {
  seen: string[];
  markSeen: (id: string) => void;
  reset: () => void;
}

/** 첫 방문 가이드를 본 기록 (기기 단위) */
export const useGuideStore = create<GuideState>()(
  persist(
    (set, get) => ({
      seen: [],
      markSeen: (id) => !get().seen.includes(id) && set({ seen: [...get().seen, id] }),
      reset: () => set({ seen: [] }),
    }),
    { name: storageKey('guides'), storage: persistStorage },
  ),
);

export const useGuideSeen = (id: string) => useGuideStore((s) => s.seen.includes(id));
