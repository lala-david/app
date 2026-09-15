import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage, storageKey } from '@/shared/lib/storage';

export type EventName =
  | 'lesson_open'
  | 'video_open'
  | 'video_done'
  | 'quiz_answer'
  | 'speak_result'
  | 'lesson_done'
  | 'day_done'
  | 'manual_check'
  | 'notification_open'
  | 'guide_seen'
  | 'avatar_saved';

export interface AnalyticsEvent {
  name: EventName;
  payload: Record<string, unknown>;
  at: number;
  userId: string | null;
}

const MAX_EVENTS = 1000;

interface AnalyticsState {
  events: AnalyticsEvent[];
  userId: string | null;
  setUser: (userId: string | null) => void;
  track: (name: EventName, payload?: Record<string, unknown>) => void;
  clearUser: (userId: string) => void;
}

/** 파일럿 지표용 이벤트 로그. 서버 연결 시 배치 업로드 대상 */
export const useAnalytics = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      events: [],
      userId: null,
      setUser: (userId) => set({ userId }),
      track: (name, payload = {}) =>
        set({ events: [...get().events, { name, payload, at: Date.now(), userId: get().userId }].slice(-MAX_EVENTS) }),
      clearUser: (userId) => set({ events: get().events.filter((e) => e.userId !== userId) }),
    }),
    { name: storageKey('analytics'), storage: persistStorage, partialize: (s) => ({ events: s.events }) },
  ),
);

export const track = (name: EventName, payload?: Record<string, unknown>) => useAnalytics.getState().track(name, payload);
