import { StyleSheet, View } from 'react-native';

import type { RoutineDef } from '@/entities/content/types';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { strings } from '@/shared/i18n/strings.ko';
import { WEEKDAY_LABELS_MON_FIRST } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Icon } from '@/shared/ui/icons';
import { PressableScale } from '@/shared/ui/PressableScale';
import { colors, radius, spacing, tones } from '@/shared/theme/tokens';

import type { TableCell, TableRow, TableCellStatus } from '../model/dashboard';

interface Props {
  dates: string[];
  rows: TableRow[];
  today: string;
  onCellPress: (cell: TableCell, routine: RoutineDef) => void;
}

const CELL = 36;

function Cell({ cell, routine, onPress }: { cell: TableCell; routine: RoutineDef; onPress: () => void }) {
  const tone = tones[routine.tone];
  const tappable = cell.status === 'empty' || cell.status === 'manual' || cell.status === 'auto';

  const inner = (() => {
    switch (cell.status) {
      case 'auto':
        return (
          <View style={[styles.mark, { backgroundColor: tone.base }]}>
            <Icon name="check" size={20} color={tone.ink} strokeWidth={3.2} />
          </View>
        );
      case 'manual':
        return (
          <View style={[styles.mark, { backgroundColor: tone.soft, borderColor: tone.base, borderWidth: 2 }]}>
            <Icon name="check" size={18} color={tone.dark} strokeWidth={3} />
          </View>
        );
      case 'empty':
        return <View style={[styles.mark, styles.empty]} />;
      case 'future':
        return <View style={styles.futureDot} />;
      default:
        return <AppText variant="caption" color="textMuted">–</AppText>;
    }
  })();

  return (
    <View style={styles.cellWrap}>
      {tappable ? (
        <PressableScale onPress={onPress} accessibilityLabel={`${routine.titleKo} ${cell.date} ${cell.status}`} style={styles.hit} pressedScale={0.9}>
          {inner}
        </PressableScale>
      ) : (
        <View style={styles.hit}>{inner}</View>
      )}
    </View>
  );
}

const LEGEND: { status: TableCellStatus; label: string }[] = [
  { status: 'auto', label: strings.parent.legend.auto },
  { status: 'manual', label: strings.parent.legend.manual },
  { status: 'empty', label: strings.parent.legend.empty },
];

/** 종이 소리루틴표와 같은 배치의 주간 표 */
export function RoutineTable({ dates, rows, today, onCellPress }: Props) {
  return (
    <View style={styles.table}>
      <View style={styles.headRow}>
        <View style={styles.label} />
        {dates.map((date, i) => {
          const isToday = date === today;
          return (
            <View key={date} style={styles.cellWrap}>
              <View style={[styles.dayHead, isToday && styles.dayHeadToday]}>
                <AppText variant="micro" color={isToday ? 'textOnAccent' : 'textSoft'}>
                  {WEEKDAY_LABELS_MON_FIRST[i]}
                </AppText>
                <AppText variant="micro" color={isToday ? 'textOnAccent' : 'textMuted'}>
                  {Number(date.slice(8))}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>

      {rows.map((row) => (
        <View key={row.routine.key} style={styles.row}>
          <View style={styles.label}>
            <AssetImage name={row.routine.icon} size={30} />
            <AppText variant="micro" color="textSoft" numberOfLines={1} style={styles.labelText}>
              {row.routine.shortKo}
            </AppText>
          </View>
          {row.cells.map((cell) => (
            <Cell key={cell.date} cell={cell} routine={row.routine} onPress={() => onCellPress(cell, row.routine)} />
          ))}
        </View>
      ))}

      <View style={styles.legend}>
        {LEGEND.map((item) => (
          <View key={item.status} style={styles.legendItem}>
            <View
              style={[
                styles.legendMark,
                item.status === 'auto' && { backgroundColor: colors.primary },
                item.status === 'manual' && { backgroundColor: colors.primarySoft, borderWidth: 2, borderColor: colors.primary },
                item.status === 'empty' && styles.empty,
              ]}
            />
            <AppText variant="caption" color="textSoft">
              {item.label}
            </AppText>
          </View>
        ))}
      </View>
      <AppText variant="caption" color="textMuted">
        {strings.parent.tableCaption}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  table: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm, gap: spacing.xs },
  headRow: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 6 },
  label: { width: 64, alignItems: 'center', gap: 2 },
  labelText: { textAlign: 'center' },
  cellWrap: { flex: 1, alignItems: 'center' },
  hit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dayHead: { alignItems: 'center', paddingVertical: 4, paddingHorizontal: 6, borderRadius: radius.sm },
  dayHeadToday: { backgroundColor: colors.primary },
  mark: { width: CELL, height: CELL, borderRadius: CELL / 2, alignItems: 'center', justifyContent: 'center' },
  empty: { borderWidth: 2, borderColor: colors.lineStrong, backgroundColor: colors.surface },
  futureDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingTop: spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendMark: { width: 16, height: 16, borderRadius: 8 },
});
