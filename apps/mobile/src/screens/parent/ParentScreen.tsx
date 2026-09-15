import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useChild } from '@/entities/child/model/childStore';
import { getWeek } from '@/entities/content/content';
import type { RoutineDef } from '@/entities/content/types';
import { addDays, compareDateKeys, fromDateKey, startOfWeek, type DateKey } from '@/entities/course/calendar';
import { streakCalendar } from '@/entities/progress/lib/progress';
import { useProgress } from '@/entities/progress/model/progressStore';
import { ChildAvatar } from '@/features/avatar/ui/ChildAvatar';
import { CardsGuide } from '@/features/guides/ui/CardsGuide';
import { dayDetail, monthCounts, summary, weekStats, weekTable } from '@/features/parent-dashboard/model/dashboard';
import { toggleCell } from '@/features/parent-dashboard/model/manualCheck';
import { DayPanel } from '@/features/parent-dashboard/ui/DayPanel';
import { MonthCalendar } from '@/features/parent-dashboard/ui/MonthCalendar';
import { RoutineTable } from '@/features/parent-dashboard/ui/RoutineTable';
import { StatsSection } from '@/features/parent-dashboard/ui/StatsSection';
import { SummaryGrid } from '@/features/parent-dashboard/ui/SummaryGrid';
import { useParentAccess } from '@/features/parent-gate/model/useParentAccess';
import { StickerBoard } from '@/features/rewards/ui/StickerBoard';
import { StreakSheet } from '@/features/rewards/ui/StreakSheet';
import { strings } from '@/shared/i18n/strings.ko';
import { clock } from '@/shared/lib/clock';
import { fmt, shortDate } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Segmented } from '@/shared/ui/Choice';
import { Icon } from '@/shared/ui/icons';
import { PressableScale } from '@/shared/ui/PressableScale';
import { Screen } from '@/shared/ui/Screen';
import { Sheet } from '@/shared/ui/Sheet';
import { colors, radius, spacing } from '@/shared/theme/tokens';

import { LockedPlaceholder } from './LockedPlaceholder';

type DashboardView = 'day' | 'week' | 'month';

function Pager({ label, onPrev, onNext, prevDisabled, nextDisabled, prevLabel, nextLabel }: { label: string; onPrev: () => void; onNext: () => void; prevDisabled: boolean; nextDisabled: boolean; prevLabel: string; nextLabel: string }) {
  return (
    <View style={styles.pager}>
      <PressableScale onPress={onPrev} disabled={prevDisabled} style={[styles.pagerButton, prevDisabled && styles.disabled]} accessibilityLabel={prevLabel}>
        <Icon name="chevronLeft" size={22} color={colors.textSoft} />
      </PressableScale>
      <AppText variant="bodyStrong">{label}</AppText>
      <PressableScale onPress={onNext} disabled={nextDisabled} style={[styles.pagerButton, nextDisabled && styles.disabled]} accessibilityLabel={nextLabel}>
        <Icon name="chevronRight" size={22} color={colors.textSoft} />
      </PressableScale>
    </View>
  );
}

export function ParentScreen() {
  const granted = useParentAccess();
  const child = useChild();
  const { records, rewards } = useProgress();
  const week = getWeek();
  const today = clock.today();
  const thisWeek = startOfWeek(today);

  const [view, setView] = useState<DashboardView>('week');
  const [weekStart, setWeekStart] = useState<DateKey>(thisWeek);
  const [month, setMonth] = useState(() => ({ y: fromDateKey(today).getFullYear(), m: fromDateKey(today).getMonth() }));
  const [selectedDate, setSelectedDate] = useState<DateKey | null>(null);
  const [streakOpen, setStreakOpen] = useState(false);

  const data = useMemo(() => {
    if (!child) return null;
    return {
      summary: summary(week, child, records, today, thisWeek),
      table: weekTable(week, child, records, weekStart, today),
      todayTable: weekTable(week, child, records, thisWeek, today),
      stats: weekStats(week, child, records, weekStart, today),
      month: monthCounts(records, month.y, month.m),
      today: dayDetail(week, child, records, today),
      selected: selectedDate ? dayDetail(week, child, records, selectedDate) : null,
    };
  }, [child, week, records, today, thisWeek, weekStart, month, selectedDate]);

  if (!granted) return <LockedPlaceholder />;
  if (!child || !data) return null;

  const earliestWeek = startOfWeek(child.startDate);
  const markToday = (routine: RoutineDef) => {
    const cell = data.todayTable.rows.find((row) => row.routine.key === routine.key)?.cells.find((c) => c.date === today);
    if (cell) void toggleCell(cell, routine, child.run);
  };

  const monthStart = new Date(month.y, month.m, 1);
  const shiftMonth = (delta: number) => setMonth(({ y, m }) => ({ y: new Date(y, m + delta, 1).getFullYear(), m: new Date(y, m + delta, 1).getMonth() }));

  return (
    <Screen mode="parent" scroll edges={['top']}>
      <CardsGuide id="parent" />
      <View style={styles.head}>
        <ChildAvatar avatar={child.avatar} size={48} />
        <AppText variant="title">{fmt(strings.parent.title, { name: child.nickname })}</AppText>
      </View>

      <View style={styles.stack}>
        <SummaryGrid {...data.summary} onStreakPress={() => setStreakOpen(true)} />

        <Segmented<DashboardView>
          value={view}
          onChange={setView}
          options={[
            { value: 'day', label: strings.parent.views.day },
            { value: 'week', label: strings.parent.views.week },
            { value: 'month', label: strings.parent.views.month },
          ]}
        />

        {view === 'day' ? <DayPanel rows={data.today.rows} words={data.today.words} editable onMark={markToday} /> : null}

        {view === 'week' ? (
          <>
            <Pager
              label={fmt(strings.parent.weekRange, { from: shortDate(weekStart), to: shortDate(addDays(weekStart, 6)) })}
              onPrev={() => setWeekStart(addDays(weekStart, -7))}
              onNext={() => setWeekStart(addDays(weekStart, 7))}
              prevDisabled={compareDateKeys(weekStart, earliestWeek) <= 0}
              nextDisabled={compareDateKeys(weekStart, thisWeek) >= 0}
              prevLabel={strings.parent.prevWeek}
              nextLabel={strings.parent.nextWeek}
            />
            <RoutineTable dates={data.table.dates} rows={data.table.rows} today={today} onCellPress={(cell, routine) => void toggleCell(cell, routine, child.run)} />
          </>
        ) : null}

        {view === 'month' ? (
          <>
            <Pager
              label={fmt(strings.parent.monthTitle, { y: month.y, m: month.m + 1 })}
              onPrev={() => shiftMonth(-1)}
              onNext={() => shiftMonth(1)}
              prevDisabled={monthStart <= new Date(fromDateKey(child.startDate).getFullYear(), fromDateKey(child.startDate).getMonth(), 1)}
              nextDisabled={monthStart >= new Date(fromDateKey(today).getFullYear(), fromDateKey(today).getMonth(), 1)}
              prevLabel={strings.parent.prevMonth}
              nextLabel={strings.parent.nextMonth}
            />
            <MonthCalendar grid={data.month.grid} counts={data.month.counts} routinesPerDay={week.routines.length} today={today} selected={selectedDate} onSelect={setSelectedDate} />
          </>
        ) : null}

        <StatsSection {...data.stats} />

        <View style={styles.card}>
          <AppText variant="heading">{strings.parent.stickers}</AppText>
          <StickerBoard rewards={rewards} slots={week.days * week.routines.length} />
        </View>
      </View>

      <StreakSheet visible={streakOpen} onClose={() => setStreakOpen(false)} streak={data.summary.streak} today={today} days={streakCalendar(records, today, 7)} />
      <Sheet visible={!!selectedDate} onClose={() => setSelectedDate(null)}>
        {selectedDate && data.selected ? (
          <>
            <AppText variant="title" align="center">
              {shortDate(selectedDate)}
            </AppText>
            <DayPanel rows={data.selected.rows} words={data.selected.words} editable={false} />
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  stack: { gap: spacing.md },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pagerButton: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
});
