import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import type { RoutineDef, RoutineKey } from '@/entities/content/types';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { displayTime, findOrderViolation, type RoutineSchedule } from '@/entities/schedule/schedule';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Icon } from '@/shared/ui/icons';
import { PressableScale } from '@/shared/ui/PressableScale';
import { colors, radius, spacing, tones } from '@/shared/theme/tokens';

import { TimePickerSheet } from './TimePickerSheet';

interface Props {
  routines: RoutineDef[];
  orderedKeys: RoutineKey[];
  schedules: RoutineSchedule[];
  onChange: (schedules: RoutineSchedule[]) => void;
  showSwitches?: boolean;
}

export function scheduleError(routines: RoutineDef[], schedules: RoutineSchedule[], orderedKeys: RoutineKey[]): string | null {
  const violation = findOrderViolation(schedules, orderedKeys);
  if (!violation) return null;
  const name = (key: RoutineKey) => routines.find((r) => r.key === key)?.titleKo ?? key;
  return fmt(strings.schedule.orderError, { routine: name(violation.routine), previous: name(violation.previous) });
}

export function ScheduleEditor({ routines, orderedKeys, schedules, onChange, showSwitches = false }: Props) {
  const [editing, setEditing] = useState<RoutineDef | null>(null);
  const error = scheduleError(routines, schedules, orderedKeys);

  const update = (key: RoutineKey, patch: Partial<RoutineSchedule>) =>
    onChange(schedules.map((s) => (s.routine === key ? { ...s, ...patch } : s)));

  return (
    <View style={styles.root}>
      {routines.map((routine) => {
        const schedule = schedules.find((s) => s.routine === routine.key);
        if (!schedule) return null;
        const tone = tones[routine.tone];
        return (
          <View key={routine.key} style={styles.row}>
            <View style={[styles.icon, { backgroundColor: tone.soft }]}>
              <AssetImage name={routine.icon} size={40} />
            </View>
            <View style={styles.texts}>
              <AppText variant="bodyStrong">{routine.titleKo}</AppText>
              <AppText variant="caption" color="textMuted">
                {fmt(strings.common.minutes, { n: routine.targetMinutes })}
              </AppText>
            </View>
            <PressableScale onPress={() => setEditing(routine)} style={[styles.time, !schedule.enabled && styles.timeOff]} accessibilityLabel={`${routine.titleKo} ${schedule.time}`}>
              <Icon name="clock" size={18} color={colors.textSoft} strokeWidth={2.2} />
              <AppText variant="bodyStrong">{displayTime(schedule.time, strings.common)}</AppText>
            </PressableScale>
            {showSwitches ? (
              <Switch
                value={schedule.enabled}
                onValueChange={(enabled) => update(routine.key, { enabled })}
                trackColor={{ true: colors.success, false: colors.locked }}
                thumbColor={colors.surface}
                accessibilityLabel={routine.titleKo}
              />
            ) : null}
          </View>
        );
      })}

      {error ? (
        <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}

      <TimePickerSheet
        visible={!!editing}
        title={editing?.titleKo ?? ''}
        value={schedules.find((s) => s.routine === editing?.key)?.time ?? '00:00'}
        onClose={() => setEditing(null)}
        onSave={(time) => {
          if (editing) update(editing.key, { time });
          setEditing(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm },
  icon: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 2 },
  time: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceSunken, borderRadius: radius.md, paddingHorizontal: spacing.sm, minHeight: 48 },
  timeOff: { opacity: 0.5 },
});
