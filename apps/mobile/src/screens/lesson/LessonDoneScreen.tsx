import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { getWeek } from '@/entities/content/content';
import { nextStep } from '@/entities/progress/lib/progress';
import { displayTime } from '@/entities/schedule/schedule';
import { useProgress } from '@/entities/progress/model/progressStore';
import { useCourseState } from '@/features/course-map/model/useCourseState';
import { lessonHref, useLesson } from '@/features/lesson/model/lessonContext';
import { LessonDone } from '@/features/lesson/ui/LessonDone';
import { WeekTrophy } from '@/features/lesson/ui/WeekTrophy';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';

export function LessonDoneScreen() {
  const router = useRouter();
  const { key } = useLocalSearchParams<{ key?: string }>();
  const context = useLesson(key);
  const state = useCourseState();
  if (!context || !state) return <Redirect href="/home" />;

  // 주소로 바로 들어와도 남은 단계를 건너뛰고 완료되지 않게 한다
  const pending = nextStep(context.record, context.steps);
  if (pending && !context.record?.completedAt) return <Redirect href={lessonHref(context.identity.key, pending)} />;

  const upcoming = state.upcoming && state.upcoming.minutesUntil > 0 ? state.upcoming : null;
  const schedule = upcoming ? context.child.schedules.find((s) => s.routine === upcoming.node.routine.key) : undefined;
  const nextReminder =
    upcoming && schedule?.enabled && context.child.notificationsEnabled
      ? fmt(strings.done.nextReminder, { routine: upcoming.node.routine.titleKo, time: displayTime(schedule.time, strings.common) })
      : null;

  return (
    <LessonDone
      context={context}
      todayMinutes={state.todayMinutes}
      todayTargetMinutes={state.todayTargetMinutes}
      streak={state.streak}
      nextReminder={nextReminder}
      onHome={() => router.replace('/home')}
      onTrophy={() => router.replace(lessonHref(context.identity.key, 'trophy'))}
    />
  );
}

export function LessonTrophyScreen() {
  const router = useRouter();
  const { key } = useLocalSearchParams<{ key?: string }>();
  const context = useLesson(key);
  const { rewards } = useProgress();
  if (!context) return <Redirect href="/home" />;

  const runPrefix = `r${context.identity.run}-`;
  const stickers = rewards.filter((r) => r.kind === 'sticker' && r.lessonKey?.startsWith(runPrefix));

  return <WeekTrophy week={getWeek().week} stickers={stickers} onHome={() => router.replace('/home')} />;
}
