import type { RoutineKey } from '@/entities/content/types';
import { addDays, compareDateKeys, type DateKey } from '@/entities/course/calendar';

import type { ActivityRecord, CellStatus, RoutineRecord, StationState } from '../model/types';

type Records = readonly RoutineRecord[];

export function createRoutineRecord(date: DateKey, routine: RoutineKey, patch: Partial<RoutineRecord> = {}): RoutineRecord {
  return { date, routine, runningSince: null, accumulatedSec: 0, listenedMin: 0, completion: null, completedAt: null, ...patch };
}

export const isDone = (record: RoutineRecord | undefined): boolean => record?.completedAt != null;

/** 지금까지 들은 초: 쌓인 시간 + 돌고 있는 구간 */
export function elapsedSec(record: RoutineRecord | undefined, now: number): number {
  if (!record) return 0;
  const running = record.runningSince == null ? 0 : Math.max(0, (now - record.runningSince) / 1000);
  return record.accumulatedSec + running;
}

export function stationState(record: RoutineRecord | undefined, date: DateKey, today: DateKey): StationState {
  if (isDone(record)) return 'done';
  const order = compareDateKeys(date, today);
  if (order > 0) return 'upcoming';
  if (order < 0) return 'missed';
  return record?.runningSince != null || (record?.accumulatedSec ?? 0) > 0 ? 'running' : 'open';
}

export const recordsOn = (records: Records, date: DateKey) => records.filter((r) => r.date === date);
export const doneOn = (records: Records, date: DateKey) => recordsOn(records, date).filter(isDone);
export const minutesOn = (records: Records, date: DateKey) => doneOn(records, date).reduce((sum, r) => sum + r.listenedMin, 0);
export const totalMinutes = (records: Records) => records.filter(isDone).reduce((sum, r) => sum + r.listenedMin, 0);

/** 루틴을 1개 이상 끝낸 날이 이어진 일수. 오늘 아직 안 했으면 어제까지로 센다 */
export function streakDays(records: Records, today: DateKey): number {
  const active = new Set(records.filter(isDone).map((r) => r.date));
  let cursor = active.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (active.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function cellStatus(record: RoutineRecord | undefined, date: DateKey, today: DateKey): CellStatus {
  if (compareDateKeys(date, today) > 0) return 'future';
  if (!isDone(record)) return 'empty';
  return record!.completion === 'parent' ? 'parent' : 'app';
}

export function completionRate(records: Records, routine: RoutineKey, dates: readonly DateKey[]): { done: number; total: number } {
  const done = dates.filter((date) => records.some((r) => r.date === date && r.routine === routine && isDone(r))).length;
  return { done, total: dates.length };
}

/** 모은 스티커 = 끝낸 루틴. 끝낸 순서대로 */
export function earnedStickers(records: Records): RoutineRecord[] {
  return records.filter(isDone).sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));
}

export function activityStats(activities: readonly ActivityRecord[]) {
  const answers = activities.flatMap((a) => a.quiz);
  const attempts = activities.flatMap((a) => a.speak);
  return {
    quizCorrect: answers.filter((a) => a.correct).length,
    quizTotal: answers.length,
    speakTried: attempts.filter((a) => a.result !== 'skipped').length,
    speakPassed: attempts.filter((a) => a.result === 'pass' || a.result === 'passAfterRetry').length,
    stars: activities.reduce((sum, a) => sum + a.stars, 0),
  };
}
