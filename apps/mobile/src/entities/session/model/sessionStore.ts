import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage, storageKey } from '@/shared/lib/storage';

interface SessionState {
  userId: string | null;
  introSeen: boolean;
  hydrated: boolean;
  signIn: (userId: string) => void;
  signOut: () => void;
  markIntroSeen: () => void;
  resetIntro: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      userId: null,
      introSeen: false,
      hydrated: false,
      signIn: (userId) => set({ userId }),
      signOut: () => set({ userId: null }),
      markIntroSeen: () => set({ introSeen: true }),
      resetIntro: () => set({ introSeen: false }),
    }),
    {
      name: storageKey('session'),
      storage: persistStorage,
      partialize: ({ userId, introSeen }) => ({ userId, introSeen }),
      onRehydrateStorage: () => () => useSession.setState({ hydrated: true }),
    },
  ),
);

export const currentUserId = () => useSession.getState().userId;
