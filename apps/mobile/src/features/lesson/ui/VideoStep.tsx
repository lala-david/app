import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { config } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { playMascot, playSfx } from '@/entities/content/voice';
import { progressActions } from '@/entities/progress/model/progressStore';
import { CardsGuide } from '@/features/guides/ui/CardsGuide';
import { requireParent } from '@/features/parent-gate/model/gateStore';
import { track } from '@/shared/analytics/analytics';
import { useFeedbackStore } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { clock } from '@/shared/lib/clock';
import { fmt, formatClock } from '@/shared/lib/format';
import { haptics } from '@/shared/platform/haptics';
import { openExternal, youtubeUrl } from '@/shared/platform/links';
import { notificationScheduler } from '@/shared/platform/notifications';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { Icon } from '@/shared/ui/icons';
import { Float } from '@/shared/ui/Motion';
import { PressableScale } from '@/shared/ui/PressableScale';
import { ProgressRing } from '@/shared/ui/ProgressRing';
import { Screen } from '@/shared/ui/Screen';
import { colors, radius, sizes, spacing, tones } from '@/shared/theme/tokens';

import { hrefAfter, type LessonContext } from '../model/lessonContext';
import { useListenTimer, useOnBecomeTrue } from '../model/useListenTimer';

import { confirmQuitLesson } from './confirmQuit';
import { LessonTopBar } from './LessonTopBar';

const timerNotificationId = (key: string) => `timer:${key}`;

export function VideoStep({ context }: { context: LessonContext }) {
  const router = useRouter();
  const { identity, routine, record, steps } = context;
  const tone = tones[routine.tone];
  const timer = useListenTimer(record?.videoStartedAt ?? null, routine.targetMinutes);
  const [tipOpen, setTipOpen] = useState(false);

  useOnBecomeTrue(
    timer.reached,
    useCallback(() => {
      playSfx('timer');
      haptics.success();
      setTimeout(() => playMascot('timer-reached'), 900);
    }, []),
  );

  const openVideo = async () => {
    const now = clock.now();
    if (!timer.started) progressActions.startVideo(identity, now);
    track('video_open', { key: identity.key });

    const opened = await openExternal(youtubeUrl(routine.video));
    if (!opened) {
      const choice = await useFeedbackStore.getState().openDialog({
        title: strings.video.openFailed,
        image: 'mascot/sori-hmm',
        actions: [
          { label: strings.common.retry, value: 'retry', tone: 'primary' },
          { label: strings.common.close, value: 'close', tone: 'ghost' },
        ],
      });
      if (choice === 'retry') void openVideo();
      return;
    }

    const remaining = timer.started ? timer.realRemainingSec : routine.targetMinutes * 60;
    void notificationScheduler.scheduleIn(timerNotificationId(identity.key), remaining, {
      title: fmt(strings.notifications.timerTitle, { n: routine.targetMinutes }),
      body: strings.notifications.timerBody,
      url: `/lesson/video?key=${identity.key}`,
    });
  };

  const completeVideo = (status: 'auto' | 'manual', minutes: number) => {
    void notificationScheduler.cancel(timerNotificationId(identity.key));
    progressActions.completeStep(identity, 'video', { videoStatus: status, listenedMin: minutes, stars: config.stars.videoStep });
    track('video_done', { key: identity.key, status, minutes });
    router.replace(hrefAfter(context, 'video'));
  };

  const skipAhead = async () => {
    if (!(await requireParent())) return;
    const value = await useFeedbackStore.getState().openDialog({
      title: strings.video.skipDialog.title,
      body: strings.video.skipDialog.body,
      actions: [
        ...config.listen.skipMinuteOptions.map((n) => ({ label: fmt(strings.common.minutes, { n }), value: String(n), tone: 'primary' as const })),
        { label: strings.common.cancel, value: 'cancel', tone: 'ghost' as const },
      ],
    });
    const minutes = Number(value);
    if (minutes > 0) completeVideo('manual', minutes);
  };

  const close = async () => {
    if (await confirmQuitLesson()) router.back();
  };

  const stepProgress = steps.length > 1 ? (timer.progress * 1) / steps.length : timer.progress;

  return (
    <Screen
      header={<LessonTopBar progress={stepProgress} color={tone.base} onClose={close} />}
      scroll
      footer={
        timer.reached ? (
          <BigButton label={strings.video.done} variant="success" size="child" icon={<Icon name="check" size={24} color={colors.textOnAccent} strokeWidth={3} />} onPress={() => completeVideo('auto', routine.targetMinutes)} />
        ) : (
          <>
            <BigButton
              label={timer.started ? strings.video.reopen : strings.video.openYoutube}
              tone={timer.started ? undefined : tone}
              variant={timer.started ? 'secondary' : 'primary'}
              size="child"
              icon={<Icon name={timer.started ? 'external' : 'play'} size={22} color={timer.started ? colors.text : tone.ink} />}
              onPress={openVideo}
            />
            {timer.started ? <BigButton label={strings.video.skip} variant="ghost" size="compact" onPress={skipAhead} /> : null}
          </>
        )
      }
    >
      <CardsGuide id="video" />
      <View style={styles.stage}>
        <AppText variant="childTitle" align="center">
          {routine.titleKo}
        </AppText>

        <ProgressRing size={sizes.timer} stroke={16} progress={timer.progress} color={timer.reached ? colors.success : tone.base} track={tone.soft}>
          <Float active={timer.started && !timer.reached} distance={5}>
            <AssetImage name={timer.reached ? 'mascot/sori-clap' : 'mascot/sori-listen'} size={124} />
          </Float>
          <AppText variant="number" tint={timer.reached ? colors.success : colors.text}>
            {timer.reached ? strings.video.reached : formatClock(timer.started ? timer.remainingSec : routine.targetMinutes * 60)}
          </AppText>
        </ProgressRing>

        {!timer.reached && timer.started ? (
          <AppText variant="caption" color="textSoft" align="center">
            {strings.video.waiting}
          </AppText>
        ) : null}

        <PressableScale onPress={() => setTipOpen((v) => !v)} style={styles.tip} pressedScale={0.99} accessibilityState={{ expanded: tipOpen }}>
          <View style={styles.tipHead}>
            <Icon name="book" size={20} color={colors.textSoft} />
            <AppText variant="bodyStrong" style={styles.flex}>
              {strings.video.parentTip}
            </AppText>
            <Icon name={tipOpen ? 'minus' : 'plus'} size={20} color={colors.textMuted} />
          </View>
          {tipOpen ? (
            <View style={styles.tipBody}>
              <AppText variant="body" color="textSoft">
                {routine.parentTip}
              </AppText>
              {routine.phrases.length ? (
                <>
                  <AppText variant="caption" color="textMuted">
                    {strings.video.phrases}
                  </AppText>
                  {routine.phrases.map((phrase) => (
                    <AppText key={phrase} variant="bodyStrong">
                      {phrase}
                    </AppText>
                  ))}
                </>
              ) : null}
            </View>
          ) : null}
        </PressableScale>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', gap: spacing.lg, paddingTop: spacing.md },
  tip: { alignSelf: 'stretch', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  tipHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tipBody: { gap: 6 },
  flex: { flex: 1 },
});
