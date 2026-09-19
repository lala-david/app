import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

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
      <AppText variant="caption" color={colors.parentSoft}>
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
            <AppText variant={on ? 'bodyStrong' : 'body'} color={on ? colors.parentInk : colors.parentSoft}>
              {option.label}
            </AppText>
          </Pressy>
        );
      })}
    </View>
  );
}

export function Card({ title, caption, children }: { title?: string; caption?: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      {title ? (
        <AppText variant="sectionTitle" color={colors.parentInk}>
          {title}
        </AppText>
      ) : null}
      {caption ? (
        <AppText variant="caption" color={colors.parentSoft} style={styles.cardCaption}>
          {caption}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

/** 오늘의 루틴 한 줄: 캐릭터 · 이름 · 루틴 색 동그라미 */
export function TodayRow({ routine, done, last, onPress }: { routine: RoutineDef; done: boolean; last: boolean; onPress: () => void }) {
  const color = parentTone(routine);
  return (
    <Pressy onPress={onPress} pressedScale={0.99} style={[styles.todayRow, !last && styles.todayRowLine]} accessibilityLabel={routine.title} accessibilityState={{ checked: done }}>
      <Character name={routine.character} size={48} />
      <AppText variant="bodyStrong" color={colors.parentInk} style={styles.flex}>
        {routine.title}
      </AppText>
      <View style={[styles.ring, { borderColor: color }, done && { backgroundColor: color }]}>{done ? <Icon name="check" size={16} color={colors.white} strokeWidth={3.2} /> : null}</View>
    </Pressy>
  );
}

/** 주간 표 (시안 03B) */
export function WeekGrid({ dates, rows, today, onCellPress }: { dates: DateKey[]; rows: ReportRow[]; today: DateKey; onCellPress: (date: DateKey, routine: RoutineDef, status: CellStatus) => void }) {
  return (
    <View>
      <View style={styles.gridRow}>
        <View style={styles.gridLabel} />
        {dates.map((date, i) => (
          <View key={date} style={styles.gridCell}>
            <AppText variant="micro" color={date === today ? colors.parentInk : colors.parentSoft}>
              {WEEKDAY_LABELS_MON_FIRST[i]}
            </AppText>
            <AppText variant="micro" color={date === today ? colors.parentInk : colors.parentSoft}>
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
              <AppText variant="micro" color={colors.parentSoft} numberOfLines={1}>
                {row.routine.shortTitle}
              </AppText>
            </View>
            {row.cells.map((cell) => {
              const filled = cell.status === 'app' || cell.status === 'parent';
              const tappable = cell.status !== 'future' && cell.status !== 'none';
              return (
                <View key={cell.date} style={styles.gridCell}>
                  {cell.status === 'none' ? null : (
                    <Pressy
                      disabled={!tappable}
                      onPress={() => onCellPress(cell.date, row.routine, cell.status)}
                      style={styles.gridHit}
                      pressedScale={0.88}
                      accessibilityLabel={`${row.routine.title} ${cell.date}`}
                      accessibilityState={{ checked: filled }}
                    >
                      <View style={[styles.gridDot, filled && { backgroundColor: color, borderColor: color }, cell.status === 'parent' && styles.parentChecked, cell.status === 'future' && styles.futureDot]}>
                        {filled ? <Icon name="check" size={13} color={colors.white} strokeWidth={3.4} /> : null}
                      </View>
                    </Pressy>
                  )}
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
      <View style={styles.monthRow}>
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
                  <AppText variant={full.has(date) ? 'bodyStrong' : 'body'} color={full.has(date) ? colors.white : colors.parentInk}>
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
          <Character name={routine.character} size={34} />
          <View style={styles.glanceTrack}>
            <View style={[styles.glanceFill, { width: `${total ? (done / total) * 100 : 0}%`, backgroundColor: parentTone(routine) }]} />
          </View>
          <AppText variant="caption" color={colors.parentSoft} style={styles.glanceCount}>
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
          {sticker ? <Character name={sticker.character} size={42} /> : <View style={styles.stickerEmpty} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stat: { flex: 1, minHeight: 94, padding: 15, borderRadius: radius.lg, backgroundColor: colors.surface },
  statValue: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 },
  segments: { flexDirection: 'row', gap: 5, marginVertical: 17, padding: 5, borderRadius: 18, backgroundColor: colors.segmentBg },
  segment: { flex: 1, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: colors.surface },
  card: { marginTop: 14, padding: 17, borderRadius: radius.xl, backgroundColor: colors.surface },
  cardCaption: { marginTop: 6, marginBottom: 2 },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 8, minHeight: 64 },
  todayRowLine: { borderBottomWidth: 1, borderBottomColor: colors.parentLine },
  ring: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  gridRow: { flexDirection: 'row', alignItems: 'center' },
  gridBodyRow: { marginTop: 14 },
  gridLabel: { width: 46, alignItems: 'center', gap: 1 },
  gridCell: { flex: 1, alignItems: 'center' },
  gridHit: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  gridDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.parentLine, alignItems: 'center', justifyContent: 'center' },
  parentChecked: { opacity: 0.55 },
  futureDot: { opacity: 0.45 },
  month: { gap: 6, marginTop: 8 },
  monthRow: { flexDirection: 'row' },
  monthCell: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 40 },
  monthDay: { width: 38, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  monthToday: { borderWidth: 2, borderColor: colors.calendarToday },
  partialDot: { position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.calendarDone },
  glance: { marginTop: 6 },
  glanceRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginVertical: 5 },
  glanceTrack: { flex: 1, height: 10, borderRadius: 10, backgroundColor: '#F4EEE4', overflow: 'hidden' },
  glanceFill: { height: '100%', borderRadius: 10 },
  glanceCount: { width: 33, textAlign: 'right' },
  stickers: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, rowGap: 8 },
  stickerCell: { width: `${100 / 6}%`, alignItems: 'center', justifyContent: 'center', height: 48 },
  stickerEmpty: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.parentLine },
});
