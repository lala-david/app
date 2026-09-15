import { StyleSheet, View } from 'react-native';

import { AssetImage } from '@/entities/content/ui/AssetImage';
import { weekdayOf, type DateKey } from '@/entities/course/calendar';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt, weekdayLabel } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { Icon } from '@/shared/ui/icons';
import { Sheet } from '@/shared/ui/Sheet';
import { colors, spacing } from '@/shared/theme/tokens';

interface Props {
  visible: boolean;
  onClose: () => void;
  streak: number;
  days: { date: DateKey; active: boolean }[];
  today: DateKey;
}

export function StreakSheet({ visible, onClose, streak, days, today }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.body}>
        <AssetImage name="celebrate/streak" size={140} />
        <AppText variant="hero" tint={streak > 0 ? colors.flame : colors.textMuted}>
          {fmt(strings.streak.title, { n: streak })}
        </AppText>
        <AppText variant="body" color="textSoft" align="center">
          {streak > 0 ? strings.streak.body : strings.streak.zero}
        </AppText>

        <View style={styles.week}>
          {days.map((day) => {
            const isToday = day.date === today;
            return (
              <View key={day.date} style={styles.day}>
                <AppText variant="micro" color={isToday ? 'text' : 'textMuted'}>
                  {weekdayLabel(weekdayOf(day.date))}
                </AppText>
                <View style={[styles.cell, day.active && styles.cellActive, isToday && styles.cellToday]}>
                  {day.active ? <Icon name="flame" size={22} color={colors.textOnAccent} /> : null}
                </View>
              </View>
            );
          })}
        </View>
      </View>
      <BigButton label={strings.common.close} variant="secondary" onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: spacing.sm },
  week: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  day: { alignItems: 'center', gap: 4 },
  cell: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceSunken, alignItems: 'center', justifyContent: 'center' },
  cellActive: { backgroundColor: colors.flame },
  cellToday: { borderWidth: 3, borderColor: colors.text },
});
