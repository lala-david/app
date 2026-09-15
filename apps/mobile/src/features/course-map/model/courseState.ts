import type { ChildProfile } from '@/entities/child/model/types';
import type { RoutineDef, WeekDef } from '@/entities/content/types';
import { minutesOfDay, toDateKey, type DateKey } from '@/entities/course/calendar';
import { buildCourse, dayIndexOf, lessonKey, stepsOf, type StepKey } from '@/entities/course/course';
import { isComplete, minutesOn, nodeState, streakDays, totalStars } from '@/entities/progress/lib/progress';
import type { LessonRecord, NodeState } from '@/entities/progress/model/types';
import { pickUpcoming } from '@/entities/schedule/schedule';

export interface NodeModel {
  key: string;
  routine: RoutineDef;
  dayIndex: number;
  date: DateKey;
  state: NodeState;
  steps: StepKey[];
  record?: LessonRecord;
  progress: number;
}

export interface DayModel {
  index: number;
  date: DateKey;
  isToday: boolean;
  nodes: NodeModel[];
  complete: boolean;
}

export interface CourseState {
  today: DateKey;
  todayIndex: number;
  beforeStart: boolean;
  weekFinished: boolean;
  days: DayModel[];
  todayNodes: NodeModel[];
  upcoming: { node: NodeModel; minutesUntil: number } | null;
  todayMinutes: number;
  todayTargetMinutes: number;
  streak: number;
  stars: number;
}

export function computeCourseState(week: WeekDef, child: ChildProfile, records: Record<string, LessonRecord>, now: Date): CourseState {
  const today = toDateKey(now);
  const todayIndex = dayIndexOf(child.runStartDate, today);
  const recordList = Object.values(records);

  const days: DayModel[] = buildCourse(week, child.runStartDate, child.faithEnabled).map((day) => {
    const nodes = day.routines.map((routine): NodeModel => {
      const key = lessonKey(child.run, day.index, routine.key);
      const record = records[key];
      const steps = stepsOf(routine.kind);
      return {
        key,
        routine,
        dayIndex: day.index,
        date: day.date,
        state: nodeState(record, day.index, todayIndex),
        steps,
        record,
        progress: isComplete(record) ? 1 : (record?.steps.length ?? 0) / steps.length,
      };
    });
    return { index: day.index, date: day.date, isToday: day.index === todayIndex, nodes, complete: nodes.every((n) => n.state === 'done') };
  });

  const todayNodes = days.find((d) => d.isToday)?.nodes ?? [];
  const done = new Set(todayNodes.filter((n) => n.state === 'done').map((n) => n.routine.key));
  const next = pickUpcoming(child.schedules, todayNodes.map((n) => n.routine.key), done, minutesOfDay(now));
  const upcomingNode = next ? todayNodes.find((n) => n.routine.key === next.routine) : undefined;

  return {
    today,
    todayIndex,
    beforeStart: todayIndex < 1,
    weekFinished: todayIndex > week.days || (days.at(-1)?.complete ?? false),
    days,
    todayNodes,
    upcoming: upcomingNode && next ? { node: upcomingNode, minutesUntil: next.minutesUntil } : null,
    todayMinutes: minutesOn(recordList, today),
    todayTargetMinutes: todayNodes.reduce((sum, n) => sum + n.routine.targetMinutes, 0),
    streak: streakDays(recordList, today),
    stars: totalStars(recordList),
  };
}
