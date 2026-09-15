import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { RoutineKey } from '@/entities/content/types';
import type { DateKey } from '@/entities/course/calendar';
import type { StepKey } from '@/entities/course/course';
import { useSession } from '@/entities/session/model/sessionStore';
import { persistStorage, storageKey } from '@/shared/lib/storage';

import { createRecord } from '../lib/progress';

import type { LessonRecord, QuizAnswer, Reward, SpeakAttempt } from './types';

interface UserProgress {
  records: Record<string, LessonRecord>;
  rewards: Reward[];
}

interface LessonIdentity {
  key: string;
  run: number;
  day: number;
  date: DateKey;
  routine: RoutineKey;
}

interface ProgressState {
  byUser: Record<string, UserProgress>;
  mutate: (userId: string, recipe: (progress: UserProgress) => UserProgress) => void;
  removeUser: (userId: string) => void;
}

const EMPTY: UserProgress = { records: {}, rewards: [] };

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
    { name: storageKey('progress'), storage: persistStorage, partialize: ({ byUser }) => ({ byUser }) },
  ),
);

function withRecord(userId: string, lesson: LessonIdentity, update: (record: LessonRecord) => LessonRecord) {
  useProgressStore.getState().mutate(userId, (progress) => {
    const record = progress.records[lesson.key] ?? createRecord(lesson);
    return { ...progress, records: { ...progress.records, [lesson.key]: update(record) } };
  });
}

function requireUser(): string {
  const userId = useSession.getState().userId;
  if (!userId) throw new Error('No signed-in user');
  return userId;
}

/** 진행 기록 변경은 모두 여기로 모은다 */
export const progressActions = {
  startVideo(lesson: LessonIdentity, startedAt: number) {
    withRecord(requireUser(), lesson, (r) => ({ ...r, videoStartedAt: r.videoStartedAt ?? startedAt }));
  },

  /** 다시 하기: 완료 기록은 두고 듣기 타이머만 비운다 */
  resetVideoTimer(lesson: LessonIdentity) {
    withRecord(requireUser(), lesson, (r) => ({ ...r, videoStartedAt: null }));
  },

  completeStep(lesson: LessonIdentity, step: StepKey, patch: Partial<LessonRecord> = {}) {
    withRecord(requireUser(), lesson, (r) => ({
      ...r,
      ...patch,
      steps: r.steps.includes(step) ? r.steps : [...r.steps, step],
      stars: r.stars + (patch.stars ?? 0),
    }));
  },

  addQuizAnswer(lesson: LessonIdentity, answer: QuizAnswer) {
    withRecord(requireUser(), lesson, (r) => ({ ...r, quiz: [...r.quiz.filter((a) => a.questionId !== answer.questionId), answer] }));
  },

  addSpeakAttempt(lesson: LessonIdentity, attempt: SpeakAttempt) {
    withRecord(requireUser(), lesson, (r) => ({ ...r, speak: [...r.speak.filter((a) => a.word !== attempt.word), attempt] }));
  },

  completeLesson(lesson: LessonIdentity, completedAt: number, bonusStars: number) {
    withRecord(requireUser(), lesson, (r) => (r.completedAt ? r : { ...r, completedAt, stars: r.stars + bonusStars }));
  },

  /** 부모 대시보드 수동 체크 */
  setParentCheck(lesson: LessonIdentity, checked: boolean, at: number, listenedMin: number) {
    const userId = requireUser();
    useProgressStore.getState().mutate(userId, (progress) => {
      const existing = progress.records[lesson.key];
      if (!checked) {
        if (!existing || existing.source !== 'parentCheck') return progress;
        const { [lesson.key]: _removed, ...rest } = progress.records;
        return { ...progress, records: rest };
      }
      const record = createRecord({
        ...lesson,
        ...existing,
        source: existing?.completedAt ? existing.source : 'parentCheck',
        videoStatus: existing?.videoStatus === 'auto' ? 'auto' : 'manual',
        listenedMin: Math.max(existing?.listenedMin ?? 0, listenedMin),
        completedAt: existing?.completedAt ?? at,
      });
      return { ...progress, records: { ...progress.records, [lesson.key]: record } };
    });
  },

  addReward(reward: Reward) {
    useProgressStore.getState().mutate(requireUser(), (progress) =>
      progress.rewards.some((r) => r.id === reward.id) ? progress : { ...progress, rewards: [...progress.rewards, reward] },
    );
  },

  resetLesson(lessonKey: string) {
    useProgressStore.getState().mutate(requireUser(), (progress) => {
      const { [lessonKey]: _removed, ...rest } = progress.records;
      return { ...progress, records: rest };
    });
  },
};

export function useProgress(): { records: LessonRecord[]; recordMap: Record<string, LessonRecord>; rewards: Reward[] } {
  const userId = useSession((s) => s.userId);
  const progress = useProgressStore((s) => (userId ? s.byUser[userId] : undefined));
  return useMemo(() => {
    const recordMap = progress?.records ?? EMPTY.records;
    return { recordMap, records: Object.values(recordMap), rewards: progress?.rewards ?? EMPTY.rewards };
  }, [progress]);
}

export function getRecord(key: string): LessonRecord | undefined {
  const userId = useSession.getState().userId;
  return userId ? useProgressStore.getState().byUser[userId]?.records[key] : undefined;
}

export function getAllRecords(): LessonRecord[] {
  const userId = useSession.getState().userId;
  return userId ? Object.values(useProgressStore.getState().byUser[userId]?.records ?? {}) : [];
}
