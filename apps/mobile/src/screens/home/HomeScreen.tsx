import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useChild } from '@/entities/child/model/childStore';
import { config, getWeek } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { playMascot } from '@/entities/content/voice';
import { streakCalendar } from '@/entities/progress/lib/progress';
import { progressActions, useProgress } from '@/entities/progress/model/progressStore';
import type { NodeModel } from '@/features/course-map/model/courseState';
import { useCourseState } from '@/features/course-map/model/useCourseState';
import { CourseMap } from '@/features/course-map/ui/CourseMap';
import { HomeHeader } from '@/features/course-map/ui/HomeHeader';
import { LessonStartSheet } from '@/features/course-map/ui/LessonStartSheet';
import { NowCard } from '@/features/course-map/ui/NowCard';
import { MascotGuide } from '@/features/guides/ui/MascotGuide';
import { hrefAfter, hrefToResume, lessonHref, resolveLesson, startNextRun } from '@/features/lesson/model/lessonContext';
import { useNotificationPermission } from '@/features/notifications/model/useNotificationPermission';
import { requireParent } from '@/features/parent-gate/model/gateStore';
import { StreakSheet } from '@/features/rewards/ui/StreakSheet';
import { track } from '@/shared/analytics/analytics';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt, shortDate } from '@/shared/lib/format';
import { wait } from '@/shared/lib/wait';
import { haptics } from '@/shared/platform/haptics';
import { AppText } from '@/shared/ui/AppText';
import { Icon } from '@/shared/ui/icons';
import { PressableScale } from '@/shared/ui/PressableScale';
import { Screen } from '@/shared/ui/Screen';
import { colors, motion, radius, spacing } from '@/shared/theme/tokens';

const STREAK_DAYS_SHOWN = 7;

export function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lesson?: string }>();
  const child = useChild();
  const state = useCourseState();
  const { recordMap, records } = useProgress();
  const { permission } = useNotificationPermission();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [streakOpen, setStreakOpen] = useState(false);

  const selected = useMemo(() => state?.days.flatMap((d) => d.nodes).find((n) => n.key === selectedKey) ?? null, [state, selectedKey]);

  useEffect(() => {
    if (!params.lesson) return;
    setSelectedKey(params.lesson);
    track('lesson_open', { key: params.lesson, from: 'notification' });
    router.setParams({ lesson: undefined });
  }, [params.lesson, router]);

  if (!child || !state) return null;

  const contextOf = (node: NodeModel) => resolveLesson(node.key, child, recordMap);

  const pressNode = (node: NodeModel) => {
    if (node.state === 'locked' || node.state === 'missed') {
      haptics.warning();
      playMascot(node.state === 'locked' ? 'locked' : 'missed');
      return;
    }
    setSelectedKey(node.key);
    track('lesson_open', { key: node.key, from: 'node' });
  };

  const start = (node: NodeModel) => {
    const context = contextOf(node);
    setSelectedKey(null);
    if (context) router.push(hrefToResume(context));
  };

  const alreadyListened = async (node: NodeModel) => {
    const context = contextOf(node);
    if (!context) return;
    // 레슨 시트를 먼저 닫아야 부모 확인 시트가 그 아래에 깔리지 않는다
    setSelectedKey(null);
    await wait(motion.base);
    if (!(await requireParent())) return;
    progressActions.completeStep(context.identity, 'video', { videoStatus: 'manual', listenedMin: node.routine.targetMinutes, stars: config.stars.videoStep });
    track('video_done', { key: node.key, status: 'manual', minutes: node.routine.targetMinutes });
    router.push(hrefAfter(context, 'video'));
  };

  const replay = (node: NodeModel) => {
    const context = contextOf(node);
    if (!context) return;
    progressActions.resetVideoTimer(context.identity);
    setSelectedKey(null);
    router.push(lessonHref(node.key, 'video'));
  };

  const notificationsOff = child.notificationsEnabled && (permission === 'denied' || permission === 'undetermined');

  const header = (
    <View style={styles.header}>
      <HomeHeader
        avatar={child.avatar}
        nickname={child.nickname}
        streak={state.streak}
        stars={state.stars}
        onAvatarPress={() => playMascot('hello')}
        onAvatarLongPress={() => router.push('/manage/avatar')}
        onStreakPress={() => setStreakOpen(true)}
      />
      {state.beforeStart ? (
        <View style={styles.notice}>
          <AssetImage name="mascot/sori-wave" size={56} />
          <AppText variant="childBody">{fmt(strings.home.notStarted, { date: shortDate(child.runStartDate) })}</AppText>
        </View>
      ) : (
        <NowCard state={state} onStart={(key) => setSelectedKey(key)} />
      )}
      {notificationsOff ? (
        <PressableScale onPress={() => router.push('/manage/notifications')} style={styles.banner} pressedScale={0.99}>
          <Icon name="bellOff" size={18} color={colors.textSoft} strokeWidth={2.2} />
          <AppText variant="caption" color="textSoft" style={styles.flex}>
            {strings.home.notifyOff}
          </AppText>
          <AppText variant="caption" color="primaryDark" weight="700">
            {strings.home.notifyOn}
          </AppText>
        </PressableScale>
      ) : null}
    </View>
  );

  return (
    <Screen edges={['top']} padded={false}>
      <CourseMap state={state} week={getWeek().week} header={header} onNodePress={pressNode} onRepeatWeek={startNextRun} />

      <MascotGuide id="home" enabled={state.todayNodes.some((n) => n.state === 'open')} />
      <StreakSheet visible={streakOpen} onClose={() => setStreakOpen(false)} streak={state.streak} today={state.today} days={streakCalendar(records, state.today, STREAK_DAYS_SHOWN)} />
      <LessonStartSheet node={selected} onClose={() => setSelectedKey(null)} onStart={start} onAlreadyListened={alreadyListened} onReplay={replay} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, paddingBottom: spacing.xs },
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.md, padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginHorizontal: spacing.md, paddingHorizontal: spacing.sm, minHeight: 40, borderRadius: radius.pill, backgroundColor: colors.surfaceSunken },
  flex: { flex: 1 },
});
