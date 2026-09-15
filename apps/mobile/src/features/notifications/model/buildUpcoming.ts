import type { ChildProfile } from '@/entities/child/model/types';
import { config } from '@/entities/content/content';
import type { WeekDef } from '@/entities/content/types';
import { addDays, fromDateKey, toDateKey, type DateKey } from '@/entities/course/calendar';
import { dayIndexOf, lessonKey, routinesForDate } from '@/entities/course/course';
import type { LessonRecord } from '@/entities/progress/model/types';
import { parseTime } from '@/entities/schedule/schedule';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import type { UpcomingNotification } from '@/shared/platform/notifications';

export const LOOKAHEAD_DAYS = 7;

export function dateAt(date: DateKey, time: string): Date {
  const { hour, minute } = parseTime(time);
  const at = fromDateKey(date);
  at.setHours(hour, minute, 0, 0);
  return at;
}

export function lessonHomeUrl(key: string): string {
  return `/home?lesson=${key}`;
}

interface Input {
  week: WeekDef;
  child: ChildProfile;
  records: Record<string, LessonRecord>;
  now: Date;
  days?: number;
}

/** 앞으로 며칠간 보낼 루틴 알림 목록. 이미 끝낸 루틴·꺼진 루틴·지난 시각은 뺀다 */
export function buildUpcoming({ week, child, records, now, days = LOOKAHEAD_DAYS }: Input): UpcomingNotification[] {
  const today = toDateKey(now);
  const items: UpcomingNotification[] = [];

  for (let offset = 0; offset < days; offset++) {
    const date = addDays(today, offset);
    const dayIndex = dayIndexOf(child.runStartDate, date);
    if (dayIndex < 1 || dayIndex > week.days) continue;

    const routines = routinesForDate(week, date, child.faithEnabled);
    let remaining = 0;

    for (const routine of routines) {
      const key = lessonKey(child.run, dayIndex, routine.key);
      if (records[key]?.completedAt) continue;
      remaining += 1;

      const schedule = child.schedules.find((s) => s.routine === routine.key);
      if (!schedule?.enabled) continue;
      const at = dateAt(date, schedule.time);
      if (at <= now) continue;

      items.push({
        id: `routine:${key}`,
        at,
        title: fmt(strings.notifications.routineTitle, { routine: routine.titleKo }),
        body: fmt(strings.notifications.routineBody, { video: routine.video.title, n: routine.targetMinutes }),
        url: lessonHomeUrl(key),
      });
    }

    const eveningAt = dateAt(date, config.eveningReminder.time);
    if (child.eveningReminder && remaining > 0 && eveningAt > now) {
      items.push({
        id: `routine:evening:${date}`,
        at: eveningAt,
        title: fmt(strings.notifications.eveningTitle, { n: remaining }),
        body: strings.notifications.eveningBody,
        url: '/home',
      });
    }
  }

  return items.sort((a, b) => a.at.getTime() - b.at.getTime());
}
