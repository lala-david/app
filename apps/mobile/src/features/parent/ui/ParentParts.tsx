import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { config } from '@/entities/content/content';
import type { CharacterKey, RoutineDef } from '@/entities/content/types';
import type { DateKey } from '@/entities/course/calendar';
import type { CellStatus } from '@/entities/progress/model/types';
import { strings } from '@/shared/i18n/strings.ko';
import { WEEKDAY_LABELS_MON_FIRST } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Character } from '@/shared/ui/Character';
import { Icon } from '@/shared/ui/icons';
import { Pressy } from '@/shared/ui/Pressy';
import { colors, radius, shadows, tones } from '@/shared/theme/tokens';

import type { ReportRow } from '../model/report';

const parentTone = (routine: RoutineDef) => tones[routine.tone].parent;

export function StatTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={[styles.stat, Platform.OS === 'web' && ({ boxShadow: shadows.stat } as object)]}>
      <AppText variant="small" color={colors.parentSoft}>
        {label}
      </AppText>
      <View style={styles.statValue}>{children}</View>
    </View>
  );
}

export function Segments<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return (
    <View style={styles.segments} accessibilityRole="tablist">
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressy key={option.value} onPress={() => onChange(option.value)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={[styles.segment, on && styles.segmentOn]} pressedScale={0.98}>
            <AppText variant="segment" color={on ? colors.parentInk : colors.parentSoft}>
              {option.label}
            </AppText>
          </Pressy>
        );
      })}
    </View>
  );
}

export function Card({ title, caption, children, style }: { title?: string; caption?: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <AppText variant="parentCardTitle" color={colors.parentInk} style={styles.cardTitle}>
          {title}
        </AppText>
      ) : null}
      {caption ? (
        <AppText variant="microSoft" color={colors.parentSoft} style={styles.cardCaption}>
          {caption}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

/** 오늘의 루틴 한 줄: 캐릭터 · 이름 · 루틴 색 동그라미 (시안 03A) */
export function TodayRow({ routine, done, last, onPress }: { routine: RoutineDef; done: boolean; last: boolean; onPress: () => void }) {
  const color = parentTone(routine);
  return (
    <Pressy onPress={onPress} pressedScale={0.99} style={styles.todayRow} accessibilityLabel={routine.title} accessibilityState={{ checked: done }}>
      <Character name={routine.character} size={34} />
      <AppText variant="label" color={colors.parentInk} style={styles.flex}>
        {routine.title}
      </AppText>
      <View style={[styles.ring, { borderColor: color }, done && { backgroundColor: color }]}>{done ? <Icon name="check" size={13} color={colors.white} strokeWidth={3.4} /> : null}</View>
      {last ? null : <View style={styles.todayRowLine} />}
    </Pressy>
  );
}

/** 주간 표 (시안 03B) */
export function WeekGrid({ dates, rows, today, onCellPress }: { dates: DateKey[]; rows: ReportRow[]; today: DateKey; onCellPress: (date: DateKey, routine: RoutineDef, status: CellStatus) => void }) {
  return (
    <View style={styles.grid}>
      <View style={[styles.gridRow, styles.gridHeadRow]}>
        <View style={styles.gridLabel} />
        {dates.map((date, i) => (
          <View key={date} style={styles.gridCell}>
            <AppText variant="gridHead" color={date === today ? colors.parentInk : colors.parentSoft} align="center">
              {WEEKDAY_LABELS_MON_FIRST[i]}
              {'\n'}
              {Number(date.slice(8))}
            </AppText>
          </View>
        ))}
      </View>
      {rows.map((row) => {
        const color = parentTone(row.routine);
        return (
          <View key={row.routine.key} style={[styles.gridRow, styles.gridBodyRow]}>
            <View style={styles.gridLabel}>
              <Character name={row.routine.character} size={34} />
              <AppText variant="tiny" color={colors.parentSoft} numberOfLines={1} style={styles.gridLabelText}>
                {row.routine.shortTitle}
              </AppText>
            </View>
            {row.cells.map((cell) => {
              const filled = cell.status === 'app' || cell.status === 'parent';
              const tappable = cell.status !== 'future' && cell.status !== 'none';
              // 주말 전용 루틴의 평일 칸만 비운다. 나머지는 시안처럼 늘 동그라미가 보인다
              if (cell.status === 'none' && row.routine.requiresFaith) return <View key={cell.date} style={styles.gridCell} />;
              return (
                <View key={cell.date} style={styles.gridCell}>
                  <Pressy
                    disabled={!tappable}
                    onPress={() => onCellPress(cell.date, row.routine, cell.status)}
                    style={styles.gridHit}
                    pressedScale={0.88}
                    accessibilityLabel={`${row.routine.title} ${cell.date}`}
                    accessibilityState={{ checked: filled, disabled: !tappable }}
                  >
                    <View style={[styles.gridDot, filled && { backgroundColor: color, borderColor: color }, cell.status === 'parent' && styles.parentChecked]}>
                      {filled ? <Icon name="check" size={12} color={colors.white} strokeWidth={3.6} /> : null}
                    </View>
                  </Pressy>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

/** 월간 달력 (시안 03C): 다 채운 날은 초록, 오늘은 테두리 */
export function MonthGrid({ grid, full, partial, today }: { grid: (DateKey | null)[][]; full: Set<DateKey>; partial: Set<DateKey>; today: DateKey }) {
  return (
    <View style={styles.month}>
      <View style={styles.monthHead}>
        {strings.journey.weekdays.map((d) => (
          <View key={d} style={styles.monthCell}>
            <AppText variant="micro" color={colors.parentSoft}>
              {d}
            </AppText>
          </View>
        ))}
      </View>
      {grid.map((row, i) => (
        <View key={i} style={styles.monthRow}>
          {row.map((date, j) => (
            <View key={date ?? `blank-${j}`} style={styles.monthCell}>
              {date ? (
                <View style={[styles.monthDay, full.has(date) && { backgroundColor: colors.calendarDone }, date === today && !full.has(date) && styles.monthToday]}>
                  <AppText variant="small" color={full.has(date) ? colors.white : colors.parentInk}>
                    {Number(date.slice(8))}
                  </AppText>
                  {partial.has(date) ? <View style={styles.partialDot} /> : null}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function GlanceBars({ items }: { items: { routine: RoutineDef; done: number; total: number }[] }) {
  return (
    <View style={styles.glance}>
      {items.map(({ routine, done, total }) => (
        <View key={routine.key} style={styles.glanceRow}>
          <Character name={routine.character} size={28} />
          <View style={styles.glanceTrack}>
            <View style={[styles.glanceFill, { width: `${total ? (done / total) * 100 : 0}%`, backgroundColor: parentTone(routine) }]} />
          </View>
          <AppText variant="microSoft" color={colors.parentSoft} style={styles.glanceCount}>
            {done}/{total}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/** 모은 스티커: 끝낸 루틴의 캐릭터가 붙고, 빈 자리는 점선 */
export function StickerBoard({ earned, slots }: { earned: { id: string; character: CharacterKey }[]; slots: number }) {
  const cells = Array.from({ length: slots }, (_, i) => earned[i]);
  return (
    <View style={styles.stickers}>
      {cells.map((sticker, i) => (
        <View key={sticker?.id ?? `slot-${i}`} style={styles.stickerCell}>
          {sticker ? <Character name={sticker.character} size={36} /> : <View style={styles.stickerEmpty} />}
        </View>
      ))}
    </View>
  );
}

const STICKER_CELL = 53;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stat: { flex: 1, height: 90, paddingTop: 15, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.surface },
  statValue: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  segments: { flexDirection: 'row', height: 50, marginTop: 18, padding: 5, paddingLeft: 4, borderRadius: 16, backgroundColor: colors.parentSunken },
  segment: { flex: 1, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: colors.surface },
  card: { marginTop: 22, paddingTop: 19, paddingHorizontal: 16, paddingBottom: 30, borderRadius: radius.lg, backgroundColor: colors.surface },
  cardTitle: { marginLeft: 1 },
  cardCaption: { marginTop: 5 },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 42, paddingRight: 7 },
  todayRowLine: { position: 'absolute', left: 3, right: 2, bottom: 0, height: 1, backgroundColor: colors.parentLine },
  ring: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  grid: { marginHorizontal: -2, minHeight: 294 },
  gridRow: { flexDirection: 'row', alignItems: 'center' },
  gridHeadRow: { marginBottom: 21 },
  gridBodyRow: { height: 62, alignItems: 'flex-start' },
  gridLabel: { width: 33, alignItems: 'flex-start' },
  gridLabelText: { width: 34, textAlign: 'center', marginTop: -3 },
  gridCell: { width: 42, alignItems: 'center' },
  gridHit: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  gridDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.parentLine, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  parentChecked: { opacity: 0.6 },
  month: { marginHorizontal: -1 },
  monthHead: { flexDirection: 'row', marginBottom: 9 },
  monthRow: { flexDirection: 'row', height: 48 },
  monthCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  monthDay: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  monthToday: { borderWidth: 1, borderColor: colors.calendarToday, backgroundColor: colors.surface },
  partialDot: { position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.calendarDone },
  glance: { marginTop: 12, marginBottom: 3 },
  glanceRow: { flexDirection: 'row', alignItems: 'center', height: 35 },
  glanceTrack: { width: 235, maxWidth: '72%', height: 8, marginLeft: 10, borderRadius: 4, backgroundColor: colors.parentSunken, overflow: 'hidden' },
  glanceFill: { height: '100%', borderRadius: 4 },
  glanceCount: { flex: 1, textAlign: 'right', marginRight: 9 },
  stickers: { flexDirection: 'row', flexWrap: 'wrap', width: STICKER_CELL * config.stickerColumns, marginTop: 9, marginLeft: 2, marginBottom: -2 },
  stickerCell: { width: STICKER_CELL, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  stickerEmpty: { width: 33, height: 33, borderRadius: 17, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.parentLine },
});
