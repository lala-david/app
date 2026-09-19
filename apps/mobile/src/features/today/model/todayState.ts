import type { ChildProfile } from '@/entities/child/model/types';
import { config } from '@/entities/content/content';
import type { RoutineDef, WeekDef } from '@/entities/content/types';
import { diffDays, toDateKey, type DateKey } from '@/entities/course/calendar';
import { buildCourse, dayIndexOf } from '@/entities/course/course';
import { minutesOn, stationState, streakDays } from '@/entities/progress/lib/progress';
import { routineRecordKey, type RoutineRecord, type StationState } from '@/entities/progress/model/types';

export interface Station {
  id: string;
  number: number;
  routine: RoutineDef;
  date: DateKey;
  state: StationState;
  record?: RoutineRecord;
}

export interface PathDay {
  index: number;
  date: DateKey;
  /** 오늘 기준 며칠 뒤인지 (0 = 오늘) */
  offset: number;
  stations: Station[];
}

export interface TodayState {
  today: DateKey;
  todayIndex: number;
  beforeStart: boolean;
  weekFinished: boolean;
  /** 오늘부터 미리보기 일수만큼의 길 */
  days: PathDay[];
  doneCount: number;
  totalCount: number;
  minutes: number;
  percent: number;
  streak: number;
}

export function computeTodayState(week: WeekDef, child: ChildProfile, routineMap: Record<string, RoutineRecord>, now: Date): TodayState {
  const today = toDateKey(now);
  const todayIndex = dayIndexOf(child.runStartDate, today);
  const records = Object.values(routineMap);
  const firstShown = Math.max(1, todayIndex);

  const days: PathDay[] = buildCourse(week, child.runStartDate, child.faithEnabled)
    .filter((day) => day.index >= firstShown && day.index <= firstShown + config.pathPreviewDays)
    .map((day) => ({
      index: day.index,
      date: day.date,
      offset: diffDays(today, day.date),
      stations: day.routines.map((routine, i) => {
        const record = routineMap[routineRecordKey(day.date, routine.key)];
        return { id: `${day.date}:${routine.key}`, number: i + 1, routine, date: day.date, record, state: stationState(record, day.date, today) };
      }),
    }));

  const todayStations = days.find((d) => d.offset === 0)?.stations ?? [];
  const minutes = minutesOn(records, today);

  return {
    today,
    todayIndex,
    beforeStart: todayIndex < 1,
    weekFinished: todayIndex > week.days,
    days,
    doneCount: todayStations.filter((s) => s.state === 'done').length,
    totalCount: todayStations.length,
    minutes,
    percent: Math.min(100, Math.round((minutes / config.dailyTargetMinutes) * 100)),
    streak: streakDays(records, today),
  };
}
