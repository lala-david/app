import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { useChild } from '@/entities/child/model/childStore';
import { getWeek, journey } from '@/entities/content/content';
import { compareDateKeys, startOfWeek, weekDates } from '@/entities/course/calendar';
import { doneOn } from '@/entities/progress/lib/progress';
import { useProgress } from '@/entities/progress/model/progressStore';
import { activityRecordKey } from '@/entities/progress/model/types';
import { ActivityCard, PreviewCard, StageList, WeekCard, WeekdayRow, type WeekdayCell } from '@/features/journey/ui/JourneyParts';
import { useTodayState } from '@/features/today/model/useTodayState';
import { strings } from '@/shared/i18n/strings.ko';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';
import { colors } from '@/shared/theme/tokens';

/** 시안 02 · 소리여행 */
export function JourneyScreen() {
  const router = useRouter();
  const child = useChild();
  const state = useTodayState();
  const { routines, activityMap } = useProgress();
  const week = getWeek();

  const cells = useMemo<WeekdayCell[]>(() => {
    if (!state) return [];
    return weekDates(startOfWeek(state.today)).map((date, i) => {
      const done = doneOn(routines, date).length;
      const order = compareDateKeys(date, state.today);
      const state_: WeekdayCell['state'] = order === 0 ? 'now' : order < 0 && done >= week.routines.length ? 'done' : 'idle';
      return { label: strings.journey.weekdays[i], state: state_, count: done };
    });
  }, [state, routines, week]);

  if (!child || !state) return null;
  const activityDone = !!activityMap[activityRecordKey(week.week, state.today)]?.completedAt;

  return (
    <Screen withNav>
      <AppText variant="eyebrow" color={colors.inkMuted}>
        {strings.journey.eyebrow}
      </AppText>
      <AppText variant="screenTitle" style={{ marginTop: 5 }}>
        {journey.title}
      </AppText>
      <AppText variant="body" color={colors.inkSoft} style={{ marginTop: 6, marginBottom: 18 }}>
        {journey.lead}
      </AppText>

      <WeekCard week={week} percent={state.percent} />
      <ActivityCard week={week} done={activityDone} onStart={() => router.push('/activity')} />
      <WeekdayRow cells={cells} />
      <StageList currentWeek={week.week} />
      <PreviewCard />
    </Screen>
  );
}
