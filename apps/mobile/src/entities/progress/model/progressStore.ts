import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { RoutineKey } from '@/entities/content/types';
import type { DateKey } from '@/entities/course/calendar';
import { useSession } from '@/entities/session/model/sessionStore';
import { persistStorage, storageKey } from '@/shared/lib/storage';

import { createRoutineRecord, elapsedSec } from '../lib/progress';

import { activityRecordKey, routineRecordKey, type ActivityRecord, type CompletionKind, type QuizAnswer, type RoutineRecord, type SpeakAttempt } from './types';

interface UserProgress {
  routines: Record<string, RoutineRecord>;
  activities: Record<string, ActivityRecord>;
}

interface ProgressState {
  byUser: Record<string, UserProgress>;
  mutate: (userId: string, recipe: (progress: UserProgress) => UserProgress) => void;
  removeUser: (userId: string) => void;
}

const EMPTY: UserProgress = { routines: {}, activities: {} };

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      byUser: {},
      mutate: (userId, recipe) => set({ byUser: { ...get().byUser, [userId]: recipe(get().byUser[userId] ?? EMPTY) } }),
      removeUser: (userId) => {
        const { [userId]: _removed, ...rest } = get().byUser;
        set({ byUser: rest });
      },
    }),
    { name: storageKey('progress-v2'), storage: persistStorage, partialize: ({ byUser }) => ({ byUser }) },
  ),
);

function requireUser(): string {
  const userId = useSession.getState().userId;
  if (!userId) throw new Error('No signed-in user');
  return userId;
}

function withRoutine(date: DateKey, routine: RoutineKey, update: (record: RoutineRecord) => RoutineRecord | null) {
  const key = routineRecordKey(date, routine);
  useProgressStore.getState().mutate(requireUser(), (progress) => {
    const next = update(progress.routines[key] ?? createRoutineRecord(date, routine));
    const { [key]: _old, ...rest } = progress.routines;
    return { ...progress, routines: next ? { ...rest, [key]: next } : rest };
  });
}

function withActivity(week: number, date: DateKey, update: (record: ActivityRecord) => ActivityRecord) {
  const key = activityRecordKey(week, date);
  useProgressStore.getState().mutate(requireUser(), (progress) => {
    const current = progress.activities[key] ?? { week, date, quiz: [], speak: [], stars: 0, completedAt: null };
    return { ...progress, activities: { ...progress.activities, [key]: update(current) } };
  });
}

/** 기록을 바꾸는 동작은 모두 여기로 모은다 */
export const progressActions = {
  startTimer(date: DateKey, routine: RoutineKey, now: number) {
    withRoutine(date, routine, (r) => (r.runningSince != null || r.completedAt ? r : { ...r, runningSince: now }));
  },

  pauseTimer(date: DateKey, routine: RoutineKey, now: number) {
    withRoutine(date, routine, (r) => (r.runningSince == null ? r : { ...r, accumulatedSec: elapsedSec(r, now), runningSince: null }));
  },

  complete(date: DateKey, routine: RoutineKey, kind: CompletionKind, targetMinutes: number, now: number) {
    withRoutine(date, routine, (r) => {
      if (r.completedAt) return r;
      // 시안과 같이, 완료한 루틴은 그 루틴의 목표 시간만큼 소리노출로 센다
      return { ...r, runningSince: null, accumulatedSec: elapsedSec(r, now), listenedMin: targetMinutes, completion: kind, completedAt: now };
    });
  },

  /** 부모 탭: 표시 해제. 부모가 표시한 기록만 지울 수 있다 */
  clearParentCheck(date: DateKey, routine: RoutineKey) {
    withRoutine(date, routine, (r) => (r.completion === 'parent' ? null : r));
  },

  addQuizAnswer(week: number, date: DateKey, answer: QuizAnswer) {
    withActivity(week, date, (a) => ({ ...a, quiz: [...a.quiz.filter((q) => q.questionId !== answer.questionId), answer] }));
  },

  addSpeakAttempt(week: number, date: DateKey, attempt: SpeakAttempt) {
    withActivity(week, date, (a) => ({ ...a, speak: [...a.speak.filter((s) => s.word !== attempt.word || (s.mode ?? 'word') !== (attempt.mode ?? 'word')), attempt] }));
  },

  restartActivity(week: number, date: DateKey) {
    withActivity(week, date, (a) => ({ ...a, quiz: [], speak: [], stars: 0, completedAt: null }));
  },

  completeActivity(week: number, date: DateKey, stars: number, now: number) {
    withActivity(week, date, (a) => ({ ...a, stars, completedAt: now }));
  },
};

export function useProgress() {
  const userId = useSession((s) => s.userId);
  const progress = useProgressStore((s) => (userId ? s.byUser[userId] : undefined));
  return useMemo(() => {
    const routineMap = progress?.routines ?? EMPTY.routines;
    const activityMap = progress?.activities ?? EMPTY.activities;
    return { routineMap, activityMap, routines: Object.values(routineMap), activities: Object.values(activityMap) };
  }, [progress]);
}

export function getRoutineMap(): Record<string, RoutineRecord> {
  const userId = useSession.getState().userId;
  return userId ? (useProgressStore.getState().byUser[userId]?.routines ?? {}) : {};
}
