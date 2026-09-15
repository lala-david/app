import type { RoutineKey } from '@/entities/content/types';

export interface RoutineSchedule {
  routine: RoutineKey;
  time: string;
  enabled: boolean;
}

export function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function toMinutes(time: string): number {
  const { hour, minute } = parseTime(time);
  return hour * 60 + minute;
}

export function shiftTime(time: string, deltaMinutes: number): string {
  const total = (((toMinutes(time) + deltaMinutes) % 1440) + 1440) % 1440;
  return formatTime(Math.floor(total / 60), total % 60);
}

/** 사람이 읽는 시각: "오전 7:30" */
export function displayTime(time: string, labels: { am: string; pm: string }): string {
  const { hour, minute } = parseTime(time);
  const period = hour < 12 ? labels.am : labels.pm;
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${h12}:${String(minute).padStart(2, '0')}`;
}

/** order 순서대로 시각이 커지지 않는 첫 루틴을 돌려준다 */
export function findOrderViolation(
  schedules: readonly RoutineSchedule[],
  order: readonly RoutineKey[],
): { routine: RoutineKey; previous: RoutineKey } | null {
  const ordered = order
    .map((key) => schedules.find((s) => s.routine === key))
    .filter((s): s is RoutineSchedule => !!s);
  for (let i = 1; i < ordered.length; i++) {
    if (toMinutes(ordered[i].time) <= toMinutes(ordered[i - 1].time)) {
      return { routine: ordered[i].routine, previous: ordered[i - 1].routine };
    }
  }
  return null;
}

export interface UpcomingRoutine {
  routine: RoutineKey;
  minutesUntil: number;
}

/**
 * 아직 안 끝낸 루틴 중 지금 할 것. 시각이 지난 루틴이 있으면 그것(음수),
 * 없으면 가장 가까운 다음 루틴.
 */
export function pickUpcoming(
  schedules: readonly RoutineSchedule[],
  available: readonly RoutineKey[],
  done: ReadonlySet<RoutineKey>,
  nowMinutes: number,
): UpcomingRoutine | null {
  const pending = available
    .filter((key) => !done.has(key))
    .map((key) => {
      const schedule = schedules.find((s) => s.routine === key);
      return { routine: key, minutesUntil: schedule ? toMinutes(schedule.time) - nowMinutes : 0 };
    })
    .sort((a, b) => a.minutesUntil - b.minutesUntil);
  if (!pending.length) return null;
  const overdue = pending.filter((p) => p.minutesUntil <= 0);
  return overdue.length ? overdue[overdue.length - 1] : pending[0];
}
