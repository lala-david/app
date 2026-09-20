import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChild } from '@/entities/child/model/childStore';
import { config, getWeek } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { playSfx } from '@/entities/content/voice';
import { progressActions, useProgress } from '@/entities/progress/model/progressStore';
import { activityRecordKey } from '@/entities/progress/model/types';
import { quizFor } from '@/features/activity/model/activityQuiz';
import { buildSpeakRounds } from '@/features/activity/model/speakGame';
import { QuizPhase } from '@/features/activity/ui/QuizPhase';
import { SpeakPhase } from '@/features/activity/ui/SpeakPhase';
import { track } from '@/shared/analytics/analytics';
import { confirmDialog } from '@/shared/feedback/feedbackStore';
import { strings } from '@/shared/i18n/strings.ko';
import { clock } from '@/shared/lib/clock';
import { fmt } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Character } from '@/shared/ui/Character';
import { PrimaryButton } from '@/shared/ui/Form';
import { Icon } from '@/shared/ui/icons';
import { Pressy } from '@/shared/ui/Pressy';
import { colors, sizes, tones } from '@/shared/theme/tokens';

type Phase = 'quiz' | 'speak' | 'finish';

/** 이번 주 소리활동: 단어 맞추기 → 단어 말하기 → 끝 */
export function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const child = useChild();
  const { activityMap } = useProgress();
  const week = getWeek();
  const [today] = useState(() => clock.today());
  const record = activityMap[activityRecordKey(week.week, today)];

  // 이미 끝낸 활동을 다시 열면 처음부터 새로 한다
  const [fresh] = useState(() => {
    if (record?.completedAt) progressActions.restartActivity(week.week, today);
    return !record || !!record.completedAt;
  });
  const answered = fresh ? 0 : (record?.quiz.length ?? 0);

  const questions = useMemo(() => (child ? quizFor(week.activity, `${week.id}:${today}`, child.ageBand) : []), [child, week, today]);
  const rounds = useMemo(() => (child ? buildSpeakRounds(week.activity, child.ageBand) : []), [child, week]);
  const [phase, setPhase] = useState<Phase>(answered >= questions.length && questions.length > 0 ? 'speak' : 'quiz');
  const [fraction, setFraction] = useState(0);

  if (!child) return null;

  const live = activityMap[activityRecordKey(week.week, today)];
  const stars = (live?.quiz.filter((a) => a.correct).length ?? 0) * config.stars.quizCorrect + (live?.speak.filter((s) => s.result === 'pass' || s.result === 'passAfterRetry' || s.result === 'passByParent').length ?? 0) * config.stars.speakPass;

  const quit = async () => {
    const { quit: q } = strings.activity;
    if (phase === 'finish' || (await confirmDialog({ title: q.title, body: q.body, confirmLabel: q.confirm, cancelLabel: q.cancel }))) router.back();
  };

  const finish = () => {
    progressActions.completeActivity(week.week, today, stars, clock.now());
    track('lesson_done', { activity: week.id, stars });
    playSfx('fanfare');
    setPhase('finish');
  };

  // 안드로이드의 뒤로 가기도 닫기 버튼과 똑같이 ‘그만할까요?’를 묻는다
  const quitRef = useRef(quit);
  quitRef.current = quit;
  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      void quitRef.current();
      return true;
    });
    return () => back.remove();
  }, []);

  const overall = phase === 'quiz' ? fraction / 2 : phase === 'speak' ? 0.5 + fraction / 2 : 1;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.top}>
        <Pressy onPress={quit} style={styles.close} accessibilityLabel={strings.common.close}>
          <Icon name="close" size={24} color={colors.inkMuted} strokeWidth={2.6} />
        </Pressy>
        <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(overall * 100) }}>
          <View style={[styles.fill, { width: `${overall * 100}%` }]} />
        </View>
      </View>

      <View style={styles.body}>
        {phase === 'quiz' ? (
          <QuizPhase
            questions={questions}
            startIndex={Math.min(answered, questions.length - 1)}
            onAnswer={(answer) => {
              progressActions.addQuizAnswer(week.week, today, answer);
              track('quiz_answer', { word: answer.word, type: answer.type, correct: answer.correct });
            }}
            onProgress={setFraction}
            onDone={() => {
              setFraction(0);
              setPhase('speak');
            }}
          />
        ) : null}
        {phase === 'speak' ? (
          <SpeakPhase
            game={week.activity.speakGame}
            rounds={rounds}
            onAttempt={(attempt) => {
              progressActions.addSpeakAttempt(week.week, today, attempt);
              track('speak_result', { word: attempt.word, mode: attempt.mode ?? 'word', result: attempt.result });
            }}
            onProgress={setFraction}
            onDone={finish}
          />
        ) : null}
        {phase === 'finish' ? (
          <View style={styles.finish}>
            <View style={styles.finishArt}>
              <AssetImage name="game/rainbow" size={250} />
              <Character name="crocodile" size={170} float shadow style={styles.finishCroc} />
              <AssetImage name="game/medal" size={84} style={styles.finishMedal} />
            </View>
            <AppText variant="screenTitle" align="center">
              {strings.activity.finishTitle}
            </AppText>
            <View style={styles.stars}>
              <Icon name="star" size={26} color={colors.star} />
              <AppText variant="stat">{fmt(strings.activity.finishStars, { n: stars })}</AppText>
            </View>
          </View>
        ) : null}
      </View>

      {phase === 'finish' ? <PrimaryButton label={strings.activity.backToJourney} onPress={() => router.back()} color={tones.theme.c} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ground, paddingHorizontal: sizes.screenPaddingX },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  close: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
  track: { flex: 1, height: 12, borderRadius: 10, backgroundColor: colors.lineSoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 10, backgroundColor: tones.theme.c },
  body: { flex: 1, paddingTop: 12 },
  finish: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  finishArt: { width: 280, height: 290, alignItems: 'center' },
  finishCroc: { position: 'absolute', bottom: 0 },
  finishMedal: { position: 'absolute', right: 8, bottom: 6, transform: [{ rotate: '12deg' }] },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.starSoft, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
});
