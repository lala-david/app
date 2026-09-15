import type { ChildProfile } from '@/entities/child/model/types';
import type { RoutineDef, WeekDef } from '@/entities/content/types';
import { addDays, compareDateKeys, isWeekend, monthGrid, weekDates, type DateKey } from '@/entities/course/calendar';
import { dayIndexOf, lessonKey } from '@/entities/course/course';
import {
  cellStatus,
  completedOn,
  isComplete,
  minutesOn,
  quizAccuracy,
  routineCompletionRate,
  speakSummary,
  streakDays,
  totalMinutes,
} from '@/entities/progress/lib/progress';
import type { CellStatus, LessonRecord } from '@/entities/progress/model/types';

export type TableCellStatus = CellStatus | 'none' | 'outside';

export interface TableCell {
  date: DateKey;
  key: string | null;
  dayIndex: number;
  status: TableCellStatus;
  record?: LessonRecord;
}

export interface TableRow {
  routine: RoutineDef;
  cells: TableCell[];
}

const recordFor = (records: readonly LessonRecord[], date: DateKey, routine: RoutineDef['key']) =>
  records.filter((r) => r.date === date && r.routine === routine).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))[0];

export function tableRoutines(week: WeekDef, child: ChildProfile): RoutineDef[] {
  return [...week.routines, ...(child.faithEnabled ? week.weekendExtras : [])].sort((a, b) => a.order - b.order);
}

/** 종이 루틴표와 같은 루틴 × 요일 표 */
export function weekTable(week: WeekDef, child: ChildProfile, records: readonly LessonRecord[], weekStart: DateKey, today: DateKey) {
  const dates = weekDates(weekStart);
  const rows: TableRow[] = tableRoutines(week, child).map((routine) => ({
    routine,
    cells: dates.map((date): TableCell => {
      const dayIndex = dayIndexOf(child.runStartDate, date);
      const inRun = dayIndex >= 1 && dayIndex <= week.days;
      const record = recordFor(records, date, routine.key);
      if (routine.requiresFaith && !isWeekend(date)) return { date, key: null, dayIndex, status: 'none' };
      if (!inRun && !record) return { date, key: null, dayIndex, status: 'outside' };
      return {
        date,
        key: inRun ? lessonKey(child.run, dayIndex, routine.key) : null,
        dayIndex,
        status: cellStatus(record, date, today),
        record,
      };
    }),
  }));
  return { dates, rows };
}

export function monthCounts(records: readonly LessonRecord[], year: number, month0: number) {
  const grid = monthGrid(year, month0);
  const counts: Record<DateKey, number> = {};
  for (const date of grid.flat()) if (date) counts[date] = completedOn(records, date).length;
  return { grid, counts };
}

export interface DayDetailRow {
  routine: RoutineDef;
  record?: LessonRecord;
  done: boolean;
}

export function dayDetail(week: WeekDef, child: ChildProfile, records: readonly LessonRecord[], date: DateKey) {
  const routines = tableRoutines(week, child).filter((r) => !r.requiresFaith || isWeekend(date));
  const rows: DayDetailRow[] = routines.map((routine) => {
    const record = recordFor(records, date, routine.key);
    return { routine, record, done: isComplete(record) };
  });
  const words = [...new Set(rows.flatMap((row) => [...(row.record?.quiz ?? []).map((a) => a.word), ...(row.record?.speak ?? []).map((s) => s.word)]))]
    .flatMap((w) => w.split(','))
    .filter(Boolean);
  return { rows, words: [...new Set(words)], minutes: minutesOn(records, date) };
}

export function summary(week: WeekDef, child: ChildProfile, records: readonly LessonRecord[], today: DateKey, weekStart: DateKey) {
  const table = weekTable(week, child, records, weekStart, today);
  const cells = table.rows.flatMap((r) => r.cells).filter((c) => c.status !== 'none' && c.status !== 'outside');
  const todayTarget = dayDetail(week, child, records, today).rows.reduce((sum, row) => sum + row.routine.targetMinutes, 0);
  return {
    todayMinutes: minutesOn(records, today),
    todayTarget,
    streak: streakDays(records, today),
    weekDone: cells.filter((c) => c.status === 'auto' || c.status === 'manual').length,
    weekTotal: cells.length,
    totalMinutes: totalMinutes(records),
  };
}

export function weekStats(week: WeekDef, child: ChildProfile, records: readonly LessonRecord[], weekStart: DateKey, today: DateKey) {
  const dates = weekDates(weekStart).filter((d) => {
    const index = dayIndexOf(child.runStartDate, d);
    return compareDateKeys(d, today) <= 0 && index >= 1 && index <= week.days;
  });
  const inWeek = records.filter((r) => r.date >= weekStart && r.date <= addDays(weekStart, 6));
  return {
    routines: week.routines.map((routine) => ({ routine, ...routineCompletionRate(records, routine.key, dates) })),
    quiz: quizAccuracy(inWeek),
    speak: speakSummary(inWeek),
    hasData: inWeek.length > 0,
  };
}
