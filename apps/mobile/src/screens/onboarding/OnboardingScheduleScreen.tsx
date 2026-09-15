import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { updateChild, useChild } from '@/entities/child/model/childStore';
import { coreRoutineOrder, getWeek } from '@/entities/content/content';
import { compareDateKeys } from '@/entities/course/calendar';
import { ScheduleEditor, scheduleError } from '@/features/schedule/ui/ScheduleEditor';
import { StartDatePicker } from '@/features/schedule/ui/StartDatePicker';
import { strings } from '@/shared/i18n/strings.ko';
import { clock } from '@/shared/lib/clock';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { Screen } from '@/shared/ui/Screen';
import { spacing } from '@/shared/theme/tokens';

import { OnboardingHeader } from './OnboardingHeader';

export function OnboardingScheduleScreen() {
  const router = useRouter();
  const child = useChild();
  const week = getWeek();
  const routines = [...week.routines].sort((a, b) => a.order - b.order);
  const order = coreRoutineOrder(week);
  const today = clock.today();

  const [schedules, setSchedules] = useState(child?.schedules ?? []);
  const [startDate, setStartDate] = useState(child && compareDateKeys(child.startDate, today) >= 0 ? child.startDate : today);

  if (!child) return null;
  const invalid = !!scheduleError(routines, schedules, order);

  const next = () => {
    updateChild({ schedules, startDate, runStartDate: startDate });
    router.push('/onboarding/notifications');
  };

  return (
    <Screen
      mode="parent"
      scroll
      header={<OnboardingHeader step={2} onBack={() => router.back()} />}
      footer={<BigButton label={strings.common.next} onPress={next} disabled={invalid} />}
    >
      <View style={styles.head}>
        <AppText variant="title">{strings.schedule.title}</AppText>
        <AppText variant="body" color="textSoft">
          {strings.schedule.subtitle}
        </AppText>
      </View>

      <ScheduleEditor routines={routines} orderedKeys={order} schedules={schedules} onChange={setSchedules} />

      <View style={styles.section}>
        <AppText variant="heading">{strings.schedule.startDate}</AppText>
        <StartDatePicker today={today} value={startDate} onChange={setStartDate} />
        <AppText variant="caption" color="textMuted">
          {strings.schedule.weekendNote}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing.xxs, marginBottom: spacing.lg, marginTop: spacing.xs },
  section: { gap: spacing.xs, marginTop: spacing.lg },
});
