import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useChild } from '@/entities/child/model/childStore';
import { getWeek } from '@/entities/content/content';
import { addDays, compareDateKeys, fromDateKey, startOfWeek, type DateKey } from '@/entities/course/calendar';
import { useProgress } from '@/entities/progress/model/progressStore';
import { AvatarView } from '@/features/child-profile/ui/ChildForm';
import { toggleCheck } from '@/features/parent/model/parentCheck';
import { monthView, stickerBoard, summaryStats, todayRows, weekGlance, weekTable } from '@/features/parent/model/report';
import { Card, GlanceBars, MonthGrid, Segments, StatTile, StickerBoard, TodayRow, WeekGrid } from '@/features/parent/ui/ParentParts';
import { strings } from '@/shared/i18n/strings.ko';
import { clock } from '@/shared/lib/clock';
import { fmt, shortDate, splitMinutes } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Icon } from '@/shared/ui/icons';
import { Pressy } from '@/shared/ui/Pressy';
import { Screen } from '@/shared/ui/Screen';
import { colors, sizes } from '@/shared/theme/tokens';

type Period = 'today' | 'week' | 'month';

const monthKey = (date: Date) => date.getFullYear() * 12 + date.getMonth();

function Pager({ label, onPrev, onNext, canPrev, canNext }: { label: string; onPrev: () => void; onNext: () => void; canPrev: boolean; canNext: boolean }) {
  return (
    <View style={styles.pager}>
      <Pressy onPress={onPrev} disabled={!canPrev} style={[styles.pagerButton, styles.pagerPrev, !canPrev && styles.dim]} accessibilityLabel={strings.parent.prev}>
        <Icon name="chevronLeft" size={16} color={colors.parentSoft} />
      </Pressy>
      <AppText variant="captionButton" color={colors.parentInk}>
        {label}
      </AppText>
      <Pressy onPress={onNext} disabled={!canNext} style={[styles.pagerButton, styles.pagerNext, !canNext && styles.dim]} accessibilityLabel={strings.parent.next}>
        <Icon name="chevronRight" size={16} color={colors.parentSoft} />
      </Pressy>
    </View>
  );
}

/** 시안 03A·B·C · 부모 */
export function ParentScreen() {
  const child = useChild();
  const { routineMap } = useProgress();
  const week = getWeek();
  const today = clock.today();
  const thisWeek = startOfWeek(today);

  const [period, setPeriod] = useState<Period>('today');
  const [weekStart, setWeekStart] = useState<DateKey>(thisWeek);
  const [month, setMonth] = useState(() => ({ y: fromDateKey(today).getFullYear(), m: fromDateKey(today).getMonth() }));

  const data = useMemo(() => {
    if (!child) return null;
    return {
      stats: summaryStats(week, child, routineMap, today, thisWeek),
      rows: todayRows(week, child, routineMap, today),
      table: weekTable(week, child, routineMap, weekStart, today),
      month: monthView(week, routineMap, month.y, month.m),
      glance: weekGlance(week, child, routineMap, thisWeek, today),
      stickers: stickerBoard(week, routineMap),
    };
  }, [child, week, routineMap, today, thisWeek, weekStart, month]);

  if (!child || !data) return null;
  const { stats } = data;
  const total = splitMinutes(stats.totalMinutes);
  const shiftMonth = (delta: number) => setMonth(({ y, m }) => ({ y: new Date(y, m + delta, 1).getFullYear(), m: new Date(y, m + delta, 1).getMonth() }));
  const shown = monthKey(new Date(month.y, month.m, 1));

  return (
    <Screen withNav ground={colors.groundParent} paddingX={sizes.parentPaddingX}>
      <View style={styles.head}>
        <View style={styles.avatar}>
          <AvatarView avatar={child.avatar} size={34} />
        </View>
        <AppText variant="parentTitle" color={colors.parentInk}>
          {fmt(strings.parent.title, { name: child.nickname })}
        </AppText>
      </View>

      <View style={styles.statRow}>
        <StatTile label={strings.parent.stats.today}>
          <AppText variant="stat" color={colors.parentInk}>
            {fmt(strings.parent.todayValue, { done: stats.todayMinutes, total: stats.todayTarget })}
          </AppText>
        </StatTile>
        <StatTile label={strings.parent.stats.streak}>
          <Icon name="flame" size={22} color={colors.streak} />
          <AppText variant="stat" color={colors.streak}>
            {fmt(strings.parent.streakValue, { n: stats.streak })}
          </AppText>
        </StatTile>
      </View>
      <View style={[styles.statRow, styles.statRowGap]}>
        <StatTile label={strings.parent.stats.week}>
          <AppText variant="stat" color={colors.parentInk}>
            {fmt(strings.parent.weekValue, { done: stats.weekDone, total: stats.weekTotal })}
          </AppText>
        </StatTile>
        <StatTile label={strings.parent.stats.total}>
          <AppText variant="stat" color={colors.parentInk}>
            {total.h > 0 ? fmt(strings.parent.hoursMinutes, { h: total.h, m: total.m }) : fmt(strings.common.minutes, { n: total.m })}
          </AppText>
        </StatTile>
      </View>

      <Segments<Period>
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'today', label: strings.parent.periods.today },
          { value: 'week', label: strings.parent.periods.week },
          { value: 'month', label: strings.parent.periods.month },
        ]}
      />

      {period === 'today' ? (
        <Card title={strings.parent.todayCard}>
          <View style={styles.cardBody}>
            {data.rows.map((row, i) => (
              <TodayRow key={row.routine.key} routine={row.routine} done={row.done} last={i === data.rows.length - 1} onPress={() => void toggleCheck(today, row.routine, row.done ? (row.record?.completion === 'parent' ? 'parent' : 'app') : 'empty')} />
            ))}
          </View>
        </Card>
      ) : null}

      {period === 'week' ? (
        <>
          <Pager
            label={fmt(strings.parent.weekRange, { from: shortDate(weekStart), to: shortDate(addDays(weekStart, 6)) })}
            onPrev={() => setWeekStart(addDays(weekStart, -7))}
            onNext={() => setWeekStart(addDays(weekStart, 7))}
            canPrev={compareDateKeys(weekStart, startOfWeek(child.startDate)) > 0}
            canNext={compareDateKeys(weekStart, thisWeek) < 0}
          />
          <Card style={styles.tableCard}>
            <WeekGrid dates={data.table.dates} rows={data.table.rows} today={today} onCellPress={(date, routine, status) => void toggleCheck(date, routine, status)} />
          </Card>
        </>
      ) : null}

      {period === 'month' ? (
        <>
          <Pager
            label={fmt(strings.parent.monthTitle, { y: month.y, m: month.m + 1 })}
            onPrev={() => shiftMonth(-1)}
            onNext={() => shiftMonth(1)}
            canPrev={shown > monthKey(fromDateKey(child.startDate))}
            canNext={shown < monthKey(fromDateKey(today))}
          />
          <Card style={styles.monthCard}>
            <MonthGrid grid={data.month.grid} full={data.month.full} partial={data.month.partial} today={today} />
          </Card>
        </>
      ) : null}

      <Card title={strings.parent.summaryTitle} caption={strings.parent.summaryCaption} style={styles.glanceCard}>
        <GlanceBars items={data.glance} />
      </Card>

      <Card title={strings.parent.stickers} style={styles.stickerCard}>
        <StickerBoard earned={data.stickers.earned} slots={data.stickers.slots} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginLeft: 4, marginBottom: 20 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F1D4C4', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  statRow: { flexDirection: 'row', gap: 16 },
  statRowGap: { marginTop: 16 },
  cardBody: { marginTop: 4, marginBottom: -3 },
  pager: { height: 18, marginTop: 22, alignItems: 'center', justifyContent: 'center' },
  pagerButton: { position: 'absolute', top: -13, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pagerPrev: { left: 0 },
  pagerNext: { right: 0 },
  tableCard: { marginTop: 19, paddingTop: 18, paddingBottom: 28 },
  monthCard: { marginTop: 19, paddingTop: 17 },
  glanceCard: { marginTop: 18, paddingBottom: 30 },
  stickerCard: { marginTop: 27, paddingBottom: 26 },
  dim: { opacity: 0.3 },
});
