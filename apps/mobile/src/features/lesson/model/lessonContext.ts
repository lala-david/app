import type { Href } from 'expo-router';
import { useMemo } from 'react';

import { getChild, updateChild, useChild } from '@/entities/child/model/childStore';
import type { ChildProfile } from '@/entities/child/model/types';
import { config, getWeek } from '@/entities/content/content';
import type { RoutineDef } from '@/entities/content/types';
import { addDays, type DateKey } from '@/entities/course/calendar';
import { findRoutine, lessonKey, parseLessonKey, routinesForDate, stepsOf, type StepKey } from '@/entities/course/course';
import { isComplete, nextStep } from '@/entities/progress/lib/progress';
import { getAllRecords, progressActions, useProgress } from '@/entities/progress/model/progressStore';
import type { LessonRecord } from '@/entities/progress/model/types';
import { track } from '@/shared/analytics/analytics';
import { clock } from '@/shared/lib/clock';

export interface LessonIdentity {
  key: string;
  run: number;
  day: number;
  date: DateKey;
  routine: RoutineDef['key'];
}

export interface LessonContext {
  identity: LessonIdentity;
  routine: RoutineDef;
  steps: StepKey[];
  record: LessonRecord | undefined;
  child: ChildProfile;
}

export function resolveLesson(key: string, child: ChildProfile, records: Record<string, LessonRecord>): LessonContext | null {
  const parsed = parseLessonKey(key);
  if (!parsed) return null;
  const routine = findRoutine(getWeek(), parsed.routine);
  if (!routine) return null;
  return {
    identity: { key, run: parsed.run, day: parsed.day, routine: routine.key, date: addDays(child.runStartDate, parsed.day - 1) },
    routine,
    steps: stepsOf(routine.kind),
    record: records[key],
    child,
  };
}

export function useLesson(key: string | undefined): LessonContext | null {
  const child = useChild();
  const { recordMap } = useProgress();
  return useMemo(() => (key && child ? resolveLesson(key, child, recordMap) : null), [key, child, recordMap]);
}

const STEP_PATHS: Record<StepKey, '/lesson/video' | '/lesson/quiz' | '/lesson/speak'> = {
  video: '/lesson/video',
  quiz: '/lesson/quiz',
  speak: '/lesson/speak',
};

export function lessonHref(key: string, step: StepKey | 'done' | 'trophy'): Href {
  const pathname = step === 'done' ? '/lesson/done' : step === 'trophy' ? '/lesson/trophy' : STEP_PATHS[step];
  return { pathname, params: { key } };
}

/** 방금 끝낸 단계 다음으로 갈 곳 */
export function hrefAfter(context: LessonContext, finished: StepKey): Href {
  const index = context.steps.indexOf(finished);
  const next = context.steps[index + 1];
  return lessonHref(context.identity.key, next ?? 'done');
}

export function hrefToResume(context: LessonContext): Href {
  return lessonHref(context.identity.key, nextStep(context.record, context.steps) ?? 'done');
}

export interface FinishResult {
  dayDone: boolean;
  weekDone: boolean;
  sticker: string;
}

/** 레슨 완료 처리: 기록·스티커·하루 배지·주간 트로피 (여러 번 불려도 한 번만 반영) */
export function finishLesson(context: LessonContext): FinishResult {
  const { identity, routine, child } = context;
  const now = clock.now();
  const alreadyDone = isComplete(context.record);

  progressActions.completeLesson(identity, now, config.stars.lessonBonus);
  progressActions.addReward({ id: `sticker:${identity.key}`, kind: 'sticker', image: routine.sticker, date: identity.date, lessonKey: identity.key, earnedAt: now });
  if (!alreadyDone) track('lesson_done', { key: identity.key, stars: context.record?.stars ?? 0 });

  const week = getWeek();
  const records = getAllRecords();
  const doneKeys = new Set(records.filter(isComplete).map((r) => r.key));
  const dayRoutines = routinesForDate(week, identity.date, child.faithEnabled);
  const dayDone = dayRoutines.every((r) => doneKeys.has(lessonKey(identity.run, identity.day, r.key)));

  if (dayDone) {
    progressActions.addReward({ id: `day:${identity.run}:${identity.day}`, kind: 'dayBadge', image: 'stickers/badge-day', date: identity.date, earnedAt: now });
    if (!alreadyDone) track('day_done', { date: identity.date, day: identity.day });
  }

  const weekDone = dayDone && identity.day === week.days;
  if (weekDone) {
    progressActions.addReward({ id: `week:${identity.run}`, kind: 'weekTrophy', image: 'stickers/badge-week', date: identity.date, earnedAt: now });
  }

  return { dayDone, weekDone, sticker: routine.sticker };
}

/** “한 번 더”: 새 회차를 오늘부터 시작 */
export function startNextRun(): void {
  const child = getChild();
  if (child) updateChild({ run: child.run + 1, runStartDate: clock.today() });
}
