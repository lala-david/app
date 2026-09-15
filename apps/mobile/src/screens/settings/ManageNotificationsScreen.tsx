import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { updateChild, useChild } from '@/entities/child/model/childStore';
import { coreRoutineOrder, getWeek } from '@/entities/content/content';
import { ScheduleEditor, scheduleError } from '@/features/schedule/ui/ScheduleEditor';
import { toast } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { Screen } from '@/shared/ui/Screen';
import { TopBar } from '@/shared/ui/TopBar';
import { spacing } from '@/shared/theme/tokens';

export function ManageNotificationsScreen() {
  const router = useRouter();
  const child = useChild();
  const week = getWeek();
  const [schedules, setSchedules] = useState(child?.schedules ?? []);

  if (!child) return null;

  const routines = [...week.routines, ...(child.faithEnabled ? week.weekendExtras : [])].sort((a, b) => a.order - b.order);
  const order = coreRoutineOrder(week);
  const invalid = !!scheduleError(week.routines, schedules, order);

  const save = () => {
    updateChild({ schedules });
    toast(strings.settings.scheduleSaved);
    router.back();
  };

  return (
    <Screen
      mode="parent"
      scroll
      header={<TopBar title={strings.settings.routineTimes} onLeftPress={() => router.back()} />}
      footer={<BigButton label={strings.common.save} onPress={save} disabled={invalid} />}
    >
      <View style={styles.head}>
        <AppText variant="body" color="textSoft">
          {strings.schedule.subtitle}
        </AppText>
      </View>
      <ScheduleEditor routines={routines} orderedKeys={order} schedules={schedules} onChange={setSchedules} showSwitches />
    </Screen>
  );
}

const styles = StyleSheet.create({ head: { paddingVertical: spacing.sm } });
