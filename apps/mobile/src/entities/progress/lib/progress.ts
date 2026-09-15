import type { RoutineKey } from '@/entities/content/types';
import { addDays, compareDateKeys, type DateKey } from '@/entities/course/calendar';
import type { StepKey } from '@/entities/course/course';

import type { CellStatus, LessonRecord, NodeState } from '../model/types';

type RecordList = readonly LessonRecord[];

export function createRecord(init: Pick<LessonRecord, 'key' | 'run' | 'day' | 'date' | 'routine'> & Partial<LessonRecord>): LessonRecord {
  return {
    source: 'app',
    videoStatus: 'none',
    videoStartedAt: null,
    listenedMin: 0,
    steps: [],
    quiz: [],
    speak: [],
    stars: 0,
    completedAt: null,
    ...init,
  };
}

export function isComplete(record: LessonRecord | undefined): boolean {
  return record?.completedAt != null;
}

export function nextStep(record: LessonRecord | undefined, steps: readonly StepKey[]): StepKey | null {
  return steps.find((step) => !record?.steps.includes(step)) ?? null;
}

export function nodeState(record: LessonRecord | undefined, dayIndex: number, todayIndex: number): NodeState {
  if (isComplete(record)) return 'done';
  if (dayIndex > todayIndex) return 'locked';
  if (dayIndex < todayIndex) return 'missed';
  const started = !!record && (record.steps.length > 0 || record.videoStartedAt != null);
  return started ? 'inProgress' : 'open';
}

export function recordsOn(records: RecordList, date: DateKey): LessonRecord[] {
  return records.filter((r) => r.date === date);
}

export function minutesOn(records: RecordList, date: DateKey): number {
  return recordsOn(records, date).reduce((sum, r) => sum + r.listenedMin, 0);
}

export function totalMinutes(records: RecordList): number {
  return records.reduce((sum, r) => sum + r.listenedMin, 0);
}

export function completedOn(records: RecordList, date: DateKey): LessonRecord[] {
  return recordsOn(records, date).filter(isComplete);
}

export function totalStars(records: RecordList): number {
  return records.reduce((sum, r) => sum + r.stars, 0);
}

/** 앱에서 실제로 루틴을 1개 이상 끝낸 날만 연속으로 센다 (부모 수동 체크 제외) */
export function streakDays(records: RecordList, today: DateKey): number {
  const activeDays = new Set(records.filter((r) => isComplete(r) && r.source === 'app').map((r) => r.date));
  let cursor = activeDays.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (activeDays.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function streakCalendar(records: RecordList, today: DateKey, length: number): { date: DateKey; active: boolean }[] {
  const activeDays = new Set(records.filter((r) => isComplete(r) && r.source === 'app').map((r) => r.date));
  return Array.from({ length }, (_, i) => {
    const date = addDays(today, i - length + 1);
    return { date, active: activeDays.has(date) };
  });
}

export function cellStatus(record: LessonRecord | undefined, date: DateKey, today: DateKey): CellStatus {
  if (compareDateKeys(date, today) > 0) return 'future';
  if (!isComplete(record)) return 'empty';
  return record!.source === 'parentCheck' || record!.videoStatus === 'manual' ? 'manual' : 'auto';
}

export function quizAccuracy(records: RecordList): { correct: number; total: number } {
  const answers = records.flatMap((r) => r.quiz);
  return { correct: answers.filter((a) => a.correct).length, total: answers.length };
}

export function speakSummary(records: RecordList): { attempted: number; passed: number; total: number } {
  const attempts = records.flatMap((r) => r.speak);
  return {
    total: attempts.length,
    attempted: attempts.filter((a) => a.result !== 'skipped').length,
    passed: attempts.filter((a) => a.result === 'pass' || a.result === 'passAfterRetry').length,
  };
}

export function routineCompletionRate(
  records: RecordList,
  routine: RoutineKey,
  dates: readonly DateKey[],
): { done: number; total: number } {
  const done = dates.filter((date) => records.some((r) => r.date === date && r.routine === routine && isComplete(r))).length;
  return { done, total: dates.length };
}

export function wordStats(records: RecordList): { word: string; correct: number; total: number }[] {
  const byWord = new Map<string, { correct: number; total: number }>();
  for (const answer of records.flatMap((r) => r.quiz)) {
    const entry = byWord.get(answer.word) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (answer.correct) entry.correct += 1;
    byWord.set(answer.word, entry);
  }
  return [...byWord.entries()].map(([word, s]) => ({ word, ...s }));
}
