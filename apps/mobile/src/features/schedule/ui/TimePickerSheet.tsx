import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { config } from '@/entities/content/content';
import { displayTime, shiftTime } from '@/entities/schedule/schedule';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { Icon } from '@/shared/ui/icons';
import { PressableScale } from '@/shared/ui/PressableScale';
import { Sheet } from '@/shared/ui/Sheet';
import { colors, radius, spacing } from '@/shared/theme/tokens';

interface Props {
  visible: boolean;
  title: string;
  value: string;
  onClose: () => void;
  onSave: (time: string) => void;
}

const HOUR = 60;

function Stepper({ label, onMinus, onPlus }: { label: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.stepper}>
      <PressableScale onPress={onMinus} style={styles.stepButton} accessibilityLabel={`${label} -`}>
        <Icon name="minus" size={26} color={colors.text} strokeWidth={3} />
      </PressableScale>
      <AppText variant="bodyStrong" color="textSoft" style={styles.stepLabel}>
        {label}
      </AppText>
      <PressableScale onPress={onPlus} style={styles.stepButton} accessibilityLabel={`${label} +`}>
        <Icon name="plus" size={26} color={colors.text} strokeWidth={3} />
      </PressableScale>
    </View>
  );
}

/** 플랫폼 공통 시간 선택 (웹에서도 동일하게 동작) */
export function TimePickerSheet({ visible, title, value, onClose, onSave }: Props) {
  const [time, setTime] = useState(value);
  const step = config.timeStepMinutes;

  useEffect(() => {
    if (visible) setTime(value);
  }, [visible, value]);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <AppText variant="title" align="center">
        {title}
      </AppText>
      <AppText variant="hero" align="center" style={styles.time}>
        {displayTime(time, strings.common)}
      </AppText>
      <View style={styles.steppers}>
        <Stepper label={strings.schedule.hourStep} onMinus={() => setTime(shiftTime(time, -HOUR))} onPlus={() => setTime(shiftTime(time, HOUR))} />
        <Stepper label={fmt(strings.common.minutes, { n: step })} onMinus={() => setTime(shiftTime(time, -step))} onPlus={() => setTime(shiftTime(time, step))} />
      </View>
      <BigButton label={strings.common.save} onPress={() => onSave(time)} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  time: { marginVertical: spacing.xs },
  steppers: { gap: spacing.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceSunken, borderRadius: radius.lg, padding: spacing.xs },
  stepButton: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { flex: 1, textAlign: 'center' },
});
