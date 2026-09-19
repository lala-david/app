import type { RoutineDef, WeekDef } from '@/entities/content/types';

import { addDays, diffDays, isWeekend, type DateKey } from './calendar';

export interface CourseDay {
  index: number;
  date: DateKey;
  routines: RoutineDef[];
}

/** 시작일 기준으로 date 가 몇 번째 Day인지. 1부터, 범위 밖일 수 있다 */
export function dayIndexOf(runStart: DateKey, date: DateKey): number {
  return diffDays(runStart, date) + 1;
}

export function isCourseDay(week: WeekDef, runStart: DateKey, date: DateKey): boolean {
  const index = dayIndexOf(runStart, date);
  return index >= 1 && index <= week.days;
}

/** 그날 할 루틴. 주말 신앙 콘텐츠는 부모가 켰을 때만 붙는다 */
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
