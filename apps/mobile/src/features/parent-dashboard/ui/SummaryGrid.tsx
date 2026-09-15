import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { strings } from '@/shared/i18n/strings.ko';
import { fmt, splitMinutes } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Icon } from '@/shared/ui/icons';
import { PressableScale } from '@/shared/ui/PressableScale';
import { ProgressRing } from '@/shared/ui/ProgressRing';
import { colors, radius, shadows, spacing } from '@/shared/theme/tokens';

interface Props {
  todayMinutes: number;
  todayTarget: number;
  streak: number;
  weekDone: number;
  weekTotal: number;
  totalMinutes: number;
  onStreakPress: () => void;
}

function Tile({ label, children, onPress }: { label: string; children: ReactNode; onPress?: () => void }) {
  const body = (
    <View style={styles.tile}>
      <AppText variant="caption" color="textSoft">
        {label}
      </AppText>
      <View style={styles.value}>{children}</View>
    </View>
  );
  return onPress ? (
    <PressableScale onPress={onPress} style={styles.cell} pressedScale={0.98} accessibilityLabel={label}>
      {body}
    </PressableScale>
  ) : (
    <View style={styles.cell}>{body}</View>
  );
}

export function SummaryGrid({ todayMinutes, todayTarget, streak, weekDone, weekTotal, totalMinutes, onStreakPress }: Props) {
  const total = splitMinutes(totalMinutes);
  return (
    <View style={styles.grid}>
      <Tile label={strings.parent.summary.today}>
        <AppText variant="number">{todayMinutes}</AppText>
        <AppText variant="body" color="textMuted">
          / {fmt(strings.parent.minutesShort, { n: todayTarget })}
        </AppText>
        <View style={styles.spacer} />
        <ProgressRing size={40} stroke={6} progress={todayTarget ? todayMinutes / todayTarget : 0} color={colors.success} />
      </Tile>
      <Tile label={strings.parent.summary.streak} onPress={onStreakPress}>
        <Icon name="flame" size={28} color={streak > 0 ? colors.flame : colors.lockedDark} />
        <AppText variant="number" tint={streak > 0 ? colors.flame : colors.textMuted}>
          {fmt(strings.common.days, { n: streak })}
        </AppText>
      </Tile>
      <Tile label={strings.parent.summary.week}>
        <AppText variant="number">{weekDone}</AppText>
        <AppText variant="body" color="textMuted">
          / {weekTotal}
        </AppText>
      </Tile>
      <Tile label={strings.parent.summary.total}>
        <AppText variant="number">
          {total.h > 0 ? fmt(strings.parent.hoursMinutes, { h: total.h, m: total.m }) : fmt(strings.parent.minutesShort, { n: total.m })}
        </AppText>
      </Tile>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: { width: '48%', flexGrow: 1 },
  tile: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xxs, boxShadow: shadows.card, minHeight: 96 },
  value: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spacer: { flex: 1 },
});
