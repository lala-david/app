import type { ChildProfile } from '@/entities/child/model/types';
import { config } from '@/entities/content/content';
import type { RoutineDef } from '@/entities/content/types';
import type { WeekDef } from '@/entities/content/types';
import { addDays, fromDateKey, toDateKey, type DateKey } from '@/entities/course/calendar';
import { isCourseDay, routinesForDate } from '@/entities/course/course';
import { isDone, streakDays } from '@/entities/progress/lib/progress';
import { routineRecordKey, type RoutineRecord } from '@/entities/progress/model/types';
import { parseTime } from '@/entities/schedule/schedule';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import type { UpcomingNotification } from '@/shared/platform/notifications';
import { tones } from '@/shared/theme/tokens';

const LOOKAHEAD_DAYS = 7;

function dateAt(date: DateKey, time: string): Date {
  const { hour, minute } = parseTime(time);
  const at = fromDateKey(date);
  at.setHours(hour, minute, 0, 0);
  return at;
}

/** 캐릭터가 부르는 알림. 문구는 날짜에 따라 돌아가며 바뀐다 */
function routineMessage(routine: RoutineDef, child: ChildProfile, dayIndex: number) {
  const lines = strings.notifications.routineBodies;
  const character = strings.child.characters[routine.character];
  return {
    title: fmt(strings.notifications.routineTitle, { routine: routine.title }),
    body: fmt(lines[(dayIndex + routine.order) % lines.length], { name: child.nickname, character, n: routine.targetMinutes }),
    color: tones[routine.tone].c,
    art: routine.character,
  };
}

interface Input {
  week: WeekDef;
  child: ChildProfile;
  routineMap: Record<string, RoutineRecord>;
  now: Date;
  days?: number;
}

/** 앞으로 보낼 알림 목록. 끝낸 루틴·꺼진 루틴·지난 시각은 뺀다 */
export function buildUpcoming({ week, child, routineMap, now, days = LOOKAHEAD_DAYS }: Input): UpcomingNotification[] {
  const today = toDateKey(now);
  const items: UpcomingNotification[] = [];
  const streak = streakDays(Object.values(routineMap), today);

  for (let offset = 0; offset < days; offset++) {
    const date = addDays(today, offset);
    if (!isCourseDay(week, child.runStartDate, date)) continue;
    let remaining = 0;

    for (const routine of routinesForDate(week, date, child.faithEnabled)) {
      if (isDone(routineMap[routineRecordKey(date, routine.key)])) continue;
      remaining += 1;
      const schedule = child.schedules.find((s) => s.routine === routine.key);
      if (!schedule?.enabled) continue;
      const at = dateAt(date, schedule.time);
      if (at <= now) continue;
      items.push({
        id: `routine:${date}:${routine.key}`,
        at,
        ...routineMessage(routine, child, offset),
        url: `/today?open=${routine.key}`,
      });
    }

    const eveningAt = dateAt(date, config.eveningReminder.time);
    if (child.eveningReminder && remaining > 0 && eveningAt > now) {
      const keepStreak = offset === 0 && streak > 0;
      items.push({ id: `routine:evening:${date}`, at: eveningAt, art: keepStreak ? 'flame' : 'moon', color: keepStreak ? tones.dinner.c : tones.bedtime.c, title: fmt(strings.notifications.eveningTitle, { n: remaining }), body: keepStreak ? fmt(strings.notifications.eveningStreakBody, { n: streak }) : strings.notifications.eveningBody, url: '/today' });
    }
  }
  return items.sort((a, b) => a.at.getTime() - b.at.getTime());
}
