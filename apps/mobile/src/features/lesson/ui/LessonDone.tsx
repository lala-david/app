import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AssetImage } from '@/entities/content/ui/AssetImage';
import { playMascot, playSfx } from '@/entities/content/voice';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { Icon } from '@/shared/ui/icons';
import { Confetti, Float, Pop } from '@/shared/ui/Motion';
import { ProgressRing } from '@/shared/ui/ProgressRing';
import { Screen } from '@/shared/ui/Screen';
import { colors, radius, spacing, tones } from '@/shared/theme/tokens';

import { finishLesson, type FinishResult, type LessonContext } from '../model/lessonContext';

interface Props {
  context: LessonContext;
  todayMinutes: number;
  todayTargetMinutes: number;
  streak: number;
  nextReminder: string | null;
  onHome: () => void;
  onTrophy: () => void;
}

export function LessonDone({ context, todayMinutes, todayTargetMinutes, streak, nextReminder, onHome, onTrophy }: Props) {
  const [result, setResult] = useState<FinishResult | null>(null);
  const tone = tones[context.routine.tone];

  useEffect(() => {
    const finished = finishLesson(context);
    setResult(finished);
    playSfx(finished.dayDone ? 'fanfare' : 'sticker');
    const timer = setTimeout(() => playMascot(finished.weekDone ? 'week-done' : finished.dayDone ? 'day-done' : 'lesson-done'), 700);
    return () => clearTimeout(timer);
    // 완료 처리는 화면이 열릴 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!result) return <Screen>{null}</Screen>;

  return (
    <Screen
      footer={
        result.weekDone ? (
          <BigButton label={fmt(strings.trophy.title, { n: 1 })} variant="success" size="child" onPress={onTrophy} />
        ) : (
          <BigButton label={strings.done.home} tone={tone} size="child" onPress={onHome} />
        )
      }
    >
      {result.dayDone ? <Confetti /> : null}
      <View style={styles.body}>
        <Float distance={6}>
          <AssetImage name={result.dayDone ? 'celebrate/day-done' : 'mascot/sori-cheer'} size={190} />
        </Float>

        <AppText variant="childTitle" align="center">
          {result.dayDone ? strings.done.dayDone : context.routine.titleKo}
        </AppText>

        <Pop delay={200}>
          <View style={[styles.sticker, { backgroundColor: tone.soft }]}>
            <AssetImage name={result.sticker} size={120} />
          </View>
        </Pop>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Icon name="star" size={26} color={colors.star} />
            <AppText variant="number" tint={colors.starDark}>
              {context.record?.stars ?? 0}
            </AppText>
          </View>
          <View style={styles.stat}>
            <ProgressRing size={48} stroke={6} progress={todayTargetMinutes ? todayMinutes / todayTargetMinutes : 0} color={colors.success}>
              <Icon name="clock" size={18} color={colors.success} strokeWidth={2.4} />
            </ProgressRing>
            <AppText variant="childBody">{fmt(strings.home.todayMinutes, { done: todayMinutes, total: todayTargetMinutes })}</AppText>
          </View>
          {result.dayDone ? (
            <Pop delay={500}>
              <View style={[styles.stat, styles.streak]}>
                <Icon name="flame" size={26} color={colors.flame} />
                <AppText variant="number" tint={colors.flame}>
                  {fmt(strings.done.streak, { n: streak })}
                </AppText>
              </View>
            </Pop>
          ) : null}
        </View>

        {nextReminder ? (
          <AppText variant="caption" color="textSoft" align="center">
            {nextReminder}
          </AppText>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  sticker: { width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 2,
    borderColor: colors.line,
  },
  streak: { borderColor: '#FFD2B3', backgroundColor: '#FFF1E6' },
});
