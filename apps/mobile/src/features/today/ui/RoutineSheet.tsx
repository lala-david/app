import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { playSfx } from '@/entities/content/voice';
import { progressActions } from '@/entities/progress/model/progressStore';
import { track } from '@/shared/analytics/analytics';
import { toast } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { clock } from '@/shared/lib/clock';
import { fmt, formatClock } from '@/shared/lib/format';
import { haptics } from '@/shared/platform/haptics';
import { openExternal, youtubeUrl } from '@/shared/platform/links';
import { notificationScheduler } from '@/shared/platform/notifications';
import { AppText } from '@/shared/ui/AppText';
import { Character } from '@/shared/ui/Character';
import { PrimaryButton, SoftButton } from '@/shared/ui/Form';
import { Pressy } from '@/shared/ui/Pressy';
import { Sheet } from '@/shared/ui/Sheet';
import { colors, sizes, tones } from '@/shared/theme/tokens';

import type { Station } from '../model/todayState';
import { TIME_SCALE, useRoutineTimer } from '../model/useRoutineTimer';

interface Props {
  station: Station | null;
  onClose: () => void;
}

const timerNotificationId = (station: Station) => `timer:${station.id}`;

function SheetBody({ station, onClose }: { station: Station; onClose: () => void }) {
  const { routine, date, record } = station;
  const tone = tones[routine.tone];
  const timer = useRoutineTimer(record, routine.targetMinutes);
  const done = station.state === 'done';

  // 목표 시간을 다 채우면 저절로 완료된다
  useEffect(() => {
    if (!timer.reached || done) return;
    progressActions.complete(date, routine.key, 'timer', routine.targetMinutes, clock.now());
    track('lesson_done', { routine: routine.key, date, kind: 'timer' });
    playSfx('fanfare');
    haptics.success();
    toast(fmt(strings.sheet.reached, { n: routine.targetMinutes }));
  }, [timer.reached, done, date, routine]);

  const open = async () => {
    track('video_open', { routine: routine.key, date });
    if (!(await openExternal(youtubeUrl(routine.video)))) toast(strings.sheet.openFailed);
  };

  const toggle = async () => {
    const now = clock.now();
    if (timer.running) {
      progressActions.pauseTimer(date, routine.key, now);
      void notificationScheduler.cancel(timerNotificationId(station));
      return;
    }
    if (!timer.started) await open();
    progressActions.startTimer(date, routine.key, now);
    void notificationScheduler.scheduleIn(timerNotificationId(station), Math.ceil((timer.target - timer.elapsed) / TIME_SCALE), {
      title: fmt(strings.notifications.timerTitle, { n: routine.targetMinutes }),
      body: strings.notifications.timerBody,
      url: '/today',
    });
  };

  const completeNow = () => {
    progressActions.complete(date, routine.key, 'manual', routine.targetMinutes, clock.now());
    void notificationScheduler.cancel(timerNotificationId(station));
    track('lesson_done', { routine: routine.key, date, kind: 'manual' });
    playSfx('sticker');
    haptics.success();
    onClose();
  };

  return (
    <View>
      <View style={styles.head}>
        <View style={[styles.tile, { backgroundColor: tone.p }]}>
          <Character name={routine.character} size={102} float={timer.running} />
        </View>
        <View style={styles.headText}>
          <AppText variant="captionStrong" color={tone.c}>
            {routine.titleEn.toUpperCase()}
          </AppText>
          <AppText variant="sheetTitle" style={styles.title}>
            {routine.title}
          </AppText>
          <AppText variant="caption" color={colors.inkSoft}>
            {routine.guide}
          </AppText>
        </View>
      </View>

      <View style={styles.sentence}>
        <View style={[styles.dot, { borderColor: tone.c }]}>
          <View style={[styles.dotCore, { backgroundColor: tone.c }]} />
        </View>
        <View style={styles.sentenceText}>
          <AppText variant="caption" color={colors.inkMuted}>
            {strings.sheet.sentence}
          </AppText>
          <AppText variant="bodyStrong">{routine.sentence}</AppText>
        </View>
      </View>

      <View style={styles.timerRow}>
        <AppText variant="bodyStrong" color="#52655F">
          {formatClock(done ? timer.target : timer.elapsed)}
        </AppText>
        <AppText variant="bodyStrong" color="#52655F">
          {formatClock(timer.target)}
        </AppText>
      </View>
      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round((done ? 1 : timer.progress) * 100) }}>
        <View style={[styles.fill, { width: `${(done ? 1 : timer.progress) * 100}%`, backgroundColor: tone.c }]} />
      </View>

      {timer.started && !done ? (
        <Pressy onPress={open} style={styles.reopen}>
          <AppText variant="caption" color={colors.inkSoft} style={styles.underline}>
            {routine.video.title} ↗
          </AppText>
        </Pressy>
      ) : null}

      <View style={styles.actions}>
        {done ? (
          <PrimaryButton label={strings.sheet.completed} onPress={onClose} color={colors.brand} />
        ) : (
          <>
            <PrimaryButton label={timer.running ? strings.sheet.pause : timer.started ? strings.sheet.resume : strings.sheet.start} onPress={toggle} color={tone.c} />
            <SoftButton label={strings.sheet.complete} onPress={completeNow} />
          </>
        )}
      </View>
    </View>
  );
}

/** 루틴 팝업 (시안 05A~D) */
export function RoutineSheet({ station, onClose }: Props) {
  return (
    <Sheet visible={!!station} onClose={onClose} minHeight={sizes.sheetHeight}>
      {station ? <SheetBody station={station} onClose={onClose} /> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  tile: { width: sizes.playerTile, height: sizes.playerTile, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  headText: { flex: 1 },
  title: { marginVertical: 6 },
  sentence: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 23, padding: 16, borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 20, backgroundColor: colors.surface },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dotCore: { width: 10, height: 10, borderRadius: 5 },
  sentenceText: { flex: 1, gap: 3 },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 8, marginHorizontal: 2 },
  track: { height: 10, borderRadius: 10, backgroundColor: colors.lineSoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 10 },
  reopen: { alignSelf: 'center', paddingVertical: 10 },
  underline: { textDecorationLine: 'underline' },
  actions: { marginTop: 24, gap: 10 },
});
