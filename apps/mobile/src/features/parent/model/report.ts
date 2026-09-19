import type { ChildProfile } from '@/entities/child/model/types';
import { config } from '@/entities/content/content';
import type { RoutineDef, WeekDef } from '@/entities/content/types';
import { compareDateKeys, isWeekend, monthGrid, weekDates, type DateKey } from '@/entities/course/calendar';
import { isCourseDay, routinesForDate } from '@/entities/course/course';
import { cellStatus, completionRate, doneOn, earnedStickers, isDone, minutesOn, streakDays, totalMinutes } from '@/entities/progress/lib/progress';
import { routineRecordKey, type CellStatus, type RoutineRecord } from '@/entities/progress/model/types';

type RecordMap = Record<string, RoutineRecord>;

export interface ReportCell {
  date: DateKey;
  status: CellStatus;
}

export interface ReportRow {
  routine: RoutineDef;
  cells: ReportCell[];
}

export function reportRoutines(week: WeekDef, child: ChildProfile): RoutineDef[] {
  return [...week.routines, ...(child.faithEnabled ? week.weekendExtras : [])].sort((a, b) => a.order - b.order);
}

/** 주간 표: 루틴(행) × 요일(열). 종이 소리루틴표와 같은 모양 */
export function weekTable(week: WeekDef, child: ChildProfile, map: RecordMap, weekStart: DateKey, today: DateKey): { dates: DateKey[]; rows: ReportRow[] } {
  const dates = weekDates(weekStart);
  const rows = reportRoutines(week, child).map((routine) => ({
    routine,
    cells: dates.map((date): ReportCell => {
      if (routine.requiresFaith && !isWeekend(date)) return { date, status: 'none' };
      if (compareDateKeys(date, child.startDate) < 0) return { date, status: 'none' };
      return { date, status: cellStatus(map[routineRecordKey(date, routine.key)], date, today) };
    }),
  }));
  return { dates, rows };
}

export function todayRows(week: WeekDef, child: ChildProfile, map: RecordMap, today: DateKey) {
  return routinesForDate(week, today, child.faithEnabled).map((routine) => {
    const record = map[routineRecordKey(today, routine.key)];
    return { routine, record, done: isDone(record) };
  });
}

export function summaryStats(week: WeekDef, child: ChildProfile, map: RecordMap, today: DateKey, weekStart: DateKey) {
  const records = Object.values(map);
  const cells = weekTable(week, child, map, weekStart, today).rows.flatMap((r) => r.cells).filter((c) => c.status !== 'none');
  return {
    todayMinutes: minutesOn(records, today),
    todayTarget: config.dailyTargetMinutes,
    streak: streakDays(records, today),
    weekDone: cells.filter((c) => c.status === 'app' || c.status === 'parent').length,
    weekTotal: cells.length,
    totalMinutes: totalMinutes(records),
  };
}

/** 이번 주 한눈에: 루틴별로 지난 날 중 며칠 했는지 */
export function weekGlance(week: WeekDef, child: ChildProfile, map: RecordMap, weekStart: DateKey, today: DateKey) {
  const records = Object.values(map);
  const elapsed = weekDates(weekStart).filter((d) => compareDateKeys(d, today) <= 0 && isCourseDay(week, child.runStartDate, d));
  return week.routines.map((routine) => ({ routine, ...completionRate(records, routine.key, elapsed) }));
}

export function monthView(week: WeekDef, map: RecordMap, year: number, month0: number) {
  const records = Object.values(map);
  const grid = monthGrid(year, month0);
  const full = new Set<DateKey>();
  const partial = new Set<DateKey>();
  for (const date of grid.flat()) {
    if (!date) continue;
    const done = doneOn(records, date).length;
    if (done >= week.routines.length) full.add(date);
    else if (done > 0) partial.add(date);
  }
  return { grid, full, partial };
}

export function stickerBoard(week: WeekDef, map: RecordMap) {
  const earned = earnedStickers(Object.values(map)).map((record) => ({
    id: routineRecordKey(record.date, record.routine),
    character: [...week.routines, ...week.weekendExtras].find((r) => r.key === record.routine)?.character ?? week.routines[0].character,
  }));
  return { earned, slots: Math.max(config.stickerSlots, earned.length) };
}
