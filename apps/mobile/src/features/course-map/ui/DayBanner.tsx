import { StyleSheet, View } from 'react-native';

import { AssetImage } from '@/entities/content/ui/AssetImage';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt, shortDate } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { colors, radius, spacing } from '@/shared/theme/tokens';

import type { DayModel } from '../model/courseState';

export function DayBanner({ day, past }: { day: DayModel; past: boolean }) {
  const palette = day.isToday
    ? { bg: colors.primary, depth: colors.primaryDark, text: colors.textOnAccent }
    : day.complete
      ? { bg: colors.success, depth: colors.successDark, text: colors.textOnAccent }
      : past
        ? { bg: colors.surfaceSunken, depth: colors.line, text: colors.textMuted }
        : { bg: colors.locked, depth: colors.lockedDark, text: colors.textSoft };

  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <View style={[styles.banner, { backgroundColor: palette.bg, borderBottomColor: palette.depth }]}>
        {day.complete ? <AssetImage name="stickers/badge-day" size={28} /> : null}
        <AppText variant="childBody" tint={palette.text}>
          {fmt(strings.home.day, { n: day.index })}
        </AppText>
        <AppText variant="caption" tint={palette.text} style={styles.date}>
          {shortDate(day.date)}
        </AppText>
      </View>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md },
  line: { flex: 1, height: 2, backgroundColor: colors.line, borderRadius: 1 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderBottomWidth: 4,
  },
  date: { opacity: 0.9 },
});
