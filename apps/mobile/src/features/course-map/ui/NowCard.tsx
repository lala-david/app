import { StyleSheet, View } from 'react-native';

import { AssetImage } from '@/entities/content/ui/AssetImage';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt, splitMinutes } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Icon } from '@/shared/ui/icons';
import { PressableScale } from '@/shared/ui/PressableScale';
import { ProgressRing } from '@/shared/ui/ProgressRing';
import { colors, radius, shadows, spacing, tones } from '@/shared/theme/tokens';

import type { CourseState } from '../model/courseState';

interface Props {
  state: CourseState;
  onStart: (key: string) => void;
}

function timeUntilLabel(minutes: number): string {
  if (minutes <= 0) return strings.home.overdue;
  const { h, m } = splitMinutes(minutes);
  const time = h > 0 ? fmt(strings.home.hours, { h, m }) : fmt(strings.home.mins, { m });
  return fmt(strings.home.inTime, { time });
}

/** 홈 상단 “지금 할 루틴” 카드 */
export function NowCard({ state, onStart }: Props) {
  const progress = state.todayTargetMinutes ? state.todayMinutes / state.todayTargetMinutes : 0;
  const ring = (
    <ProgressRing size={64} stroke={8} progress={progress} color={colors.success}>
      <AppText variant="micro" color="textSoft">
        {state.todayMinutes}
      </AppText>
    </ProgressRing>
  );

  if (!state.upcoming) {
    return (
      <View style={[styles.card, styles.doneCard]}>
        <AssetImage name="mascot/sori-cheer" size={72} />
        <View style={styles.texts}>
          <AppText variant="childBody">{strings.home.allDone}</AppText>
          <AppText variant="caption" color="textSoft">
            {fmt(strings.home.todayMinutes, { done: state.todayMinutes, total: state.todayTargetMinutes })}
          </AppText>
        </View>
        {ring}
      </View>
    );
  }

  const { node, minutesUntil } = state.upcoming;
  const tone = tones[node.routine.tone];

  return (
    <PressableScale onPress={() => onStart(node.key)} style={[styles.card, { borderColor: tone.base }]} pressedScale={0.98} accessibilityLabel={node.routine.titleKo}>
      <View style={[styles.icon, { backgroundColor: tone.soft }]}>
        <AssetImage name={node.routine.icon} size={52} />
      </View>
      <View style={styles.texts}>
        <AppText variant="micro" color="textMuted">
          {strings.home.now}
        </AppText>
        <AppText variant="childBody" numberOfLines={1}>
          {node.routine.titleKo}
        </AppText>
        <View style={styles.meta}>
          <Icon name="clock" size={14} color={colors.textMuted} strokeWidth={2} />
          <AppText variant="caption" color="textSoft">
            {timeUntilLabel(minutesUntil)}
          </AppText>
        </View>
      </View>
      <View style={[styles.play, { backgroundColor: tone.base, borderBottomColor: tone.dark }]}>
        <Icon name="play" size={26} color={tone.ink} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.line,
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    boxShadow: shadows.card,
  },
  doneCard: { borderColor: colors.successSoft },
  icon: { width: 64, height: 64, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  play: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, paddingLeft: 3 },
});
