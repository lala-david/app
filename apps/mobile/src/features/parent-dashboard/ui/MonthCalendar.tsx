import { StyleSheet, View } from 'react-native';

import type { DateKey } from '@/entities/course/calendar';
import { WEEKDAY_LABELS_MON_FIRST } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { PressableScale } from '@/shared/ui/PressableScale';
import { colors, radius, spacing } from '@/shared/theme/tokens';

interface Props {
  grid: (DateKey | null)[][];
  counts: Record<DateKey, number>;
  routinesPerDay: number;
  today: DateKey;
  selected: DateKey | null;
  onSelect: (date: DateKey) => void;
}

const MAX_DOTS = 4;

export function MonthCalendar({ grid, counts, routinesPerDay, today, selected, onSelect }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {WEEKDAY_LABELS_MON_FIRST.map((label) => (
          <View key={label} style={styles.cell}>
            <AppText variant="micro" color="textMuted">
              {label}
            </AppText>
          </View>
        ))}
      </View>
      {grid.map((week, i) => (
        <View key={i} style={styles.row}>
          {week.map((date, j) => {
            if (!date) return <View key={`blank-${j}`} style={styles.cell} />;
            const count = counts[date] ?? 0;
            const full = count >= routinesPerDay;
            const isToday = date === today;
            const future = date > today;
            return (
              <View key={date} style={styles.cell}>
                <PressableScale
                  onPress={() => onSelect(date)}
                  disabled={future}
                  accessibilityLabel={`${date} ${count}`}
                  style={[styles.day, full && styles.dayFull, isToday && styles.dayToday, selected === date && styles.daySelected]}
                  pressedScale={0.92}
                >
                  <AppText variant="bodyStrong" tint={full ? colors.textOnAccent : future ? colors.textMuted : colors.text}>
                    {Number(date.slice(8))}
                  </AppText>
                  <View style={styles.dots}>
                    {!full
                      ? Array.from({ length: Math.min(count, MAX_DOTS) }, (_, k) => <View key={k} style={styles.dot} />)
                      : null}
                  </View>
                </PressableScale>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm, gap: 4 },
  row: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  day: { width: 44, height: 48, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dayFull: { backgroundColor: colors.success },
  dayToday: { borderWidth: 2, borderColor: colors.primary },
  daySelected: { backgroundColor: colors.primarySoft },
  dots: { flexDirection: 'row', gap: 2, height: 6 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.success },
});
