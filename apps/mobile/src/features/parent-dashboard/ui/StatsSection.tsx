import { StyleSheet, View } from 'react-native';

import type { RoutineDef } from '@/entities/content/types';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { strings } from '@/shared/i18n/strings.ko';
import { AppText } from '@/shared/ui/AppText';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { colors, radius, spacing, tones } from '@/shared/theme/tokens';

interface Props {
  routines: { routine: RoutineDef; done: number; total: number }[];
  quiz: { correct: number; total: number };
  speak: { attempted: number; passed: number; total: number };
  hasData: boolean;
}

export function StatsSection({ routines, quiz, speak, hasData }: Props) {
  const accuracy = quiz.total ? Math.round((quiz.correct / quiz.total) * 100) : null;

  return (
    <View style={styles.card}>
      <AppText variant="heading">{strings.parent.stats.title}</AppText>

      <View style={styles.block}>
        <AppText variant="caption" color="textSoft">
          {strings.parent.stats.routineRate}
        </AppText>
        {routines.map(({ routine, done, total }) => (
          <View key={routine.key} style={styles.barRow}>
            <AssetImage name={routine.icon} size={28} />
            <ProgressBar progress={total ? done / total : 0} color={tones[routine.tone].base} height={12} />
            <AppText variant="caption" color="textSoft" style={styles.count}>
              {done}/{total}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.pair}>
        <View style={styles.metric}>
          <AppText variant="caption" color="textSoft">
            {strings.parent.stats.quiz}
          </AppText>
          <AppText variant="number">{accuracy == null ? '–' : `${accuracy}%`}</AppText>
        </View>
        <View style={styles.metric}>
          <AppText variant="caption" color="textSoft">
            {strings.parent.stats.speak}
          </AppText>
          <AppText variant="number">{`${speak.passed}/${speak.attempted}`}</AppText>
          <AppText variant="micro" color="textMuted">
            {strings.parent.stats.speakCaption}
          </AppText>
        </View>
      </View>

      {!hasData ? (
        <AppText variant="caption" color="textMuted">
          {strings.parent.stats.noData}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md },
  block: { gap: spacing.xs },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  count: { width: 36, textAlign: 'right' },
  pair: { flexDirection: 'row', gap: spacing.sm },
  metric: { flex: 1, backgroundColor: colors.surfaceSunken, borderRadius: radius.md, padding: spacing.sm, gap: 4 },
});
