import type { RoutineDef, RoutineKey, RoutineKind, WeekDef } from '@/entities/content/types';

import { addDays, diffDays, isWeekend, type DateKey } from './calendar';

export type StepKey = 'video' | 'quiz' | 'speak';

export interface CourseDay {
  index: number;
  date: DateKey;
  routines: RoutineDef[];
}

const STEPS_BY_KIND: Record<RoutineKind, StepKey[]> = {
  listen: ['video'],
  play: ['video', 'quiz', 'speak'],
};

export function stepsOf(kind: RoutineKind): StepKey[] {
  return STEPS_BY_KIND[kind];
}

export function lessonKey(run: number, day: number, routine: RoutineKey): string {
  return `r${run}-d${day}-${routine}`;
}

export function parseLessonKey(key: string): { run: number; day: number; routine: RoutineKey } | null {
  const match = /^r(\d+)-d(\d+)-([a-zA-Z]+)$/.exec(key);
  if (!match) return null;
  return { run: Number(match[1]), day: Number(match[2]), routine: match[3] as RoutineKey };
}

/** 회차 시작일 기준 오늘이 몇 번째 Day인지. 1부터, 범위 밖일 수 있다 */
export function dayIndexOf(runStart: DateKey, today: DateKey): number {
  return diffDays(runStart, today) + 1;
}

export function routinesForDate(week: WeekDef, date: DateKey, faithEnabled: boolean): RoutineDef[] {
  const extras = faithEnabled && isWeekend(date) ? week.weekendExtras : [];
  return [...week.routines, ...extras].sort((a, b) => a.order - b.order);
}

export function buildCourse(week: WeekDef, runStart: DateKey, faithEnabled: boolean): CourseDay[] {
  return Array.from({ length: week.days }, (_, i) => {
    const date = addDays(runStart, i);
    return { index: i + 1, date, routines: routinesForDate(week, date, faithEnabled) };
  });
}

export function findRoutine(week: WeekDef, key: RoutineKey): RoutineDef | undefined {
  return [...week.routines, ...week.weekendExtras].find((r) => r.key === key);
}
