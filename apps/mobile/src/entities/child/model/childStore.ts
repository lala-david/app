import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { config } from '@/entities/content/content';
import type { RoutineSchedule } from '@/entities/schedule/schedule';
import { useSession } from '@/entities/session/model/sessionStore';
import { clock } from '@/shared/lib/clock';
import { persistStorage, storageKey } from '@/shared/lib/storage';

import type { AvatarConfig, ChildProfile } from './types';

interface ChildState {
  profiles: Record<string, ChildProfile>;
  save: (userId: string, patch: Partial<ChildProfile>) => void;
  remove: (userId: string) => void;
}

export function createDefaultProfile(): ChildProfile {
  const today = clock.today();
  return {
    nickname: '',
    ageBand: config.defaultAgeBand as ChildProfile['ageBand'],
    avatar: { kind: 'builder', seed: String(clock.now()), options: {} },
    schedules: config.defaultSchedule as RoutineSchedule[],
    startDate: today,
    run: 1,
    runStartDate: today,
    faithEnabled: false,
    notificationsEnabled: true,
    eveningReminder: config.eveningReminder.enabled,
    onboardingDone: false,
  };
}

export const useChildStore = create<ChildState>()(
  persist(
    (set, get) => ({
      profiles: {},
      save: (userId, patch) => {
        const current = get().profiles[userId] ?? createDefaultProfile();
        set({ profiles: { ...get().profiles, [userId]: { ...current, ...patch } } });
      },
      remove: (userId) => {
        const { [userId]: _removed, ...rest } = get().profiles;
        set({ profiles: rest });
      },
    }),
    { name: storageKey('children'), storage: persistStorage, partialize: ({ profiles }) => ({ profiles }) },
  ),
);

/** 로그인한 보호자의 아이 프로필 (없으면 undefined) */
export function useChild(): ChildProfile | undefined {
  const userId = useSession((s) => s.userId);
  return useChildStore((s) => (userId ? s.profiles[userId] : undefined));
}

export function updateChild(patch: Partial<ChildProfile>): void {
  const userId = useSession.getState().userId;
  if (userId) useChildStore.getState().save(userId, patch);
}

export function updateAvatar(avatar: AvatarConfig): void {
  updateChild({ avatar });
}

export function getChild(): ChildProfile | undefined {
  const userId = useSession.getState().userId;
  return userId ? useChildStore.getState().profiles[userId] : undefined;
}
