import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { updateChild, useChild } from '@/entities/child/model/childStore';
import { getWeek } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { HelpCards } from '@/features/help/ui/HelpCards';
import { useSplash } from '@/features/splash/model/splashStore';
import { useTodayState } from '@/features/today/model/useTodayState';
import { HeroCard } from '@/features/today/ui/HeroCard';
import { RoutinePath } from '@/features/today/ui/RoutinePath';
import { RoutineSheet } from '@/features/today/ui/RoutineSheet';
import { strings } from '@/shared/i18n/strings.ko';
import { clock } from '@/shared/lib/clock';
import { fmt, shortDate } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Character } from '@/shared/ui/Character';
import { PrimaryButton } from '@/shared/ui/Form';
import { Pressy } from '@/shared/ui/Pressy';
import { Screen } from '@/shared/ui/Screen';
import { colors, sizes } from '@/shared/theme/tokens';

/** 시안 01 · 오늘 */
export function TodayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ open?: string }>();
  const child = useChild();
  const state = useTodayState();
  const splashVisible = useSplash((s) => s.visible);
  const week = getWeek();
  const [openId, setOpenId] = useState<string | null>(null);

  const todayStations = useMemo(() => state?.days.find((d) => d.offset === 0)?.stations ?? [], [state]);
  const openStation = todayStations.find((s) => s.id === openId) ?? null;

  // 알림을 눌러 들어오면 (?open=morning) 해당 루틴 팝업을 연다
  useEffect(() => {
    if (!params.open) return;
    const target = todayStations.find((s) => s.routine.key === params.open);
    if (target) setOpenId(target.id);
    router.setParams({ open: undefined });
  }, [params.open, todayStations, router]);

  if (!child || !state) return null;

  return (
    <Screen withNav>
      <View style={styles.header}>
        <AssetImage name="brand/logo" width={146} height={42} />
        <Pressy onPress={() => router.push('/manage/child')} style={styles.nameChip} accessibilityLabel={child.nickname}>
          <AppText variant="captionStrong" color={colors.nameChipInk} numberOfLines={1}>
            {child.nickname.slice(0, 3)}
          </AppText>
        </Pressy>
      </View>

      <AppText variant="eyebrow" color={colors.inkMuted}>
        {strings.today.eyebrow}
      </AppText>
      <AppText variant="greeting" style={styles.greeting}>
        {strings.today.title}
      </AppText>

      <HeroCard week={week} minutes={state.minutes} percent={state.percent} />

      <View style={styles.heading}>
        <View>
          <AppText variant="eyebrow" color={colors.inkMuted}>
            {strings.today.routineEyebrow}
          </AppText>
          <AppText variant="sectionTitle">{strings.today.routineTitle}</AppText>
        </View>
        {state.totalCount ? (
          <AppText variant="captionStrong" color="#668078">
            {fmt(strings.today.doneCount, { done: state.doneCount, total: state.totalCount })}
          </AppText>
        ) : null}
      </View>

      {state.beforeStart ? (
        <View style={styles.notice}>
          <Character name="chick" size={72} float />
          <AppText variant="bodyStrong">{fmt(strings.today.notStarted, { date: shortDate(child.runStartDate) })}</AppText>
        </View>
      ) : null}

      {state.weekFinished ? (
        <View style={styles.finished}>
          <Character name="crocodile" size={120} float />
          <AppText variant="sectionTitle" align="center">
            {fmt(strings.today.weekDone, { n: week.week })}
          </AppText>
          <PrimaryButton label={strings.today.again} onPress={() => updateChild({ run: child.run + 1, runStartDate: clock.today() })} />
        </View>
      ) : (
        <RoutinePath days={state.days} onStationPress={(station) => setOpenId(station.id)} />
      )}

      <RoutineSheet station={openStation} onClose={() => setOpenId(null)} />
      <HelpCards enabled={!splashVisible && !state.beforeStart} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  nameChip: { width: 45, height: 45, borderRadius: 17, backgroundColor: colors.nameChipBg, alignItems: 'center', justifyContent: 'center' },
  greeting: { marginTop: 5, marginBottom: 18 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 30, marginHorizontal: 2, marginBottom: 4 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, padding: 14, borderRadius: 22, backgroundColor: colors.surface },
  finished: { alignItems: 'stretch', gap: 14, marginTop: 24, padding: 22, borderRadius: sizes.heroHeight / 10, backgroundColor: colors.surface },
});
