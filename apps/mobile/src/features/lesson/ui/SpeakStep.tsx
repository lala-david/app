import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { config, getWord } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { playMascot, playSfx, playWord } from '@/entities/content/voice';
import { progressActions } from '@/entities/progress/model/progressStore';
import type { SpeakResult } from '@/entities/progress/model/types';
import { judgeSpeech } from '@/entities/speech/judgeSpeech';
import { MascotGuide } from '@/features/guides/ui/MascotGuide';
import { track } from '@/shared/analytics/analytics';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import { haptics } from '@/shared/platform/haptics';
import { speechRecognizer, SpeechRecognitionError } from '@/shared/platform/speech';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { Icon } from '@/shared/ui/icons';
import { PressableScale } from '@/shared/ui/PressableScale';
import { Screen } from '@/shared/ui/Screen';
import { colors, radius, sizes, spacing, tones } from '@/shared/theme/tokens';

import { hrefAfter, type LessonContext } from '../model/lessonContext';

import { confirmQuitLesson } from './confirmQuit';
import { LessonTopBar } from './LessonTopBar';
import { SpeakerButton } from './SpeakerButton';
import { StepResult } from './StepResult';

type Phase = 'idle' | 'listening' | 'checking' | 'pass' | 'retry' | 'given';

const PASS_RESULTS: SpeakResult[] = ['pass', 'passAfterRetry', 'passByParent'];

function MicButton({ listening, onPress, color }: { listening: boolean; onPress: () => void; color: string }) {
  const pulse = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    pulse.value = listening && !reduceMotion ? withRepeat(withTiming(1.25, { duration: 700 }), -1, true) : withTiming(1);
  }, [listening, pulse, reduceMotion]);

  const ring = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: listening ? 0.35 : 0 }));

  return (
    <PressableScale onPress={onPress} accessibilityLabel={listening ? strings.speak.listening : strings.speak.tap} style={styles.micWrap}>
      <Animated.View style={[styles.micRing, { backgroundColor: color }, ring]} />
      <View style={[styles.mic, { backgroundColor: listening ? colors.danger : color }]}>
        <Icon name="mic" size={52} color={colors.textOnAccent} />
      </View>
    </PressableScale>
  );
}

export function SpeakStep({ context }: { context: LessonContext }) {
  const router = useRouter();
  const { identity, routine } = context;
  const tone = tones[routine.tone];
  const words = routine.speakWords ?? [];

  const [index, setIndex] = useState(0);
  const [tries, setTries] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [heard, setHeard] = useState('');
  const [parentMode, setParentMode] = useState(!speechRecognizer.isAvailable());
  const [passed, setPassed] = useState(0);
  const [finished, setFinished] = useState(false);

  const word = words[index] ? getWord(words[index]) : null;

  useEffect(() => {
    if (!word) return;
    const timer = setTimeout(() => playWord(word.id), 400);
    return () => clearTimeout(timer);
  }, [word]);

  const record = (result: SpeakResult, score: number, heardText: string) => {
    if (!word) return;
    progressActions.addSpeakAttempt(identity, { word: word.id, heard: heardText, score, result });
    track('speak_result', { key: identity.key, word: word.id, result, score });
    if (PASS_RESULTS.includes(result)) setPassed((p) => p + 1);
  };

  const listen = async () => {
    if (phase === 'listening') return speechRecognizer.stop();
    if (!word || phase === 'checking') return;
    haptics.tap();
    setHeard('');
    setPhase('listening');
    try {
      if (!(await speechRecognizer.requestPermission())) throw new SpeechRecognitionError('permission');
      const alternatives = await speechRecognizer.listen({ lang: config.speech.lang, timeoutMs: config.speech.listenTimeoutMs, hints: [word.id] });
      setPhase('checking');
      const judgement = judgeSpeech(word.id, alternatives, word.accept, config.speech.passThreshold);
      setHeard(judgement.heard);
      const attempt = tries + 1;
      setTries(attempt);

      if (judgement.passed) {
        record(attempt > 1 ? 'passAfterRetry' : 'pass', judgement.score, judgement.heard);
        setPhase('pass');
        playSfx('correct');
        setTimeout(() => playMascot('speak-pass'), 300);
      } else if (attempt < config.speech.maxTries) {
        setPhase('retry');
        playMascot('speak-retry');
      } else {
        record('given', judgement.score, judgement.heard);
        setPhase('given');
        playMascot('speak-given');
      }
    } catch (error) {
      if (error instanceof SpeechRecognitionError && error.code !== 'aborted') setParentMode(true);
      setPhase('idle');
    }
  };

  const parentSaid = () => {
    record('passByParent', 1, '');
    setPhase('pass');
    playSfx('correct');
  };

  const skip = () => {
    record('skipped', 0, '');
    next();
  };

  const next = () => {
    setTries(0);
    setHeard('');
    setPhase('idle');
    if (index + 1 < words.length) setIndex(index + 1);
    else setFinished(true);
  };

  const complete = () => {
    progressActions.completeStep(identity, 'speak', { stars: passed * config.stars.speakPass });
    router.replace(hrefAfter(context, 'speak'));
  };

  const close = async () => {
    if (await confirmQuitLesson()) router.back();
  };

  const stepsBefore = context.steps.indexOf('speak');
  const progress = (stepsBefore + (finished ? 1 : index / Math.max(1, words.length))) / context.steps.length;
  const resolved = phase === 'pass' || phase === 'given';

  if (finished || !word) {
    return (
      <Screen footer={<BigButton label={strings.quiz.continue} variant="success" size="child" onPress={complete} />}>
        <StepResult title={strings.speak.pass} score={`${passed} / ${words.length}`} stars={passed * config.stars.speakPass} mascot="mascot/sori-cheer" />
      </Screen>
    );
  }

  return (
    <Screen
      header={<LessonTopBar progress={progress} color={tone.base} onClose={close} />}
      footer={
        resolved ? (
          <BigButton label={strings.quiz.continue} variant={phase === 'pass' ? 'success' : 'primary'} size="child" onPress={next} />
        ) : (
          <BigButton label={strings.speak.skip} variant="ghost" size="compact" onPress={skip} />
        )
      }
    >
      <MascotGuide id="speak" />
      <View style={styles.body}>
        <View style={styles.dots}>
          {words.map((w, i) => (
            <View key={w} style={[styles.dot, i < index && styles.dotDone, i === index && { backgroundColor: tone.base, width: 26 }]} />
          ))}
        </View>

        <View style={[styles.card, { borderColor: phase === 'pass' ? colors.success : tone.soft }]}>
          <AssetImage name={word.image} size={170} />
          <AppText variant="hero">{word.id}</AppText>
          <SpeakerButton tone={tone} size={64} onPress={() => playWord(word.id)} label={word.id} />
        </View>

        <View style={styles.status}>
          {phase === 'pass' || phase === 'given' || phase === 'retry' ? (
            <Animated.View entering={FadeIn} style={styles.feedback}>
              <AssetImage name={phase === 'pass' ? 'mascot/sori-clap' : phase === 'retry' ? 'mascot/sori-hmm' : 'mascot/sori-idle'} size={56} />
              <AppText variant="childBody" tint={phase === 'pass' ? colors.successDark : colors.text}>
                {phase === 'pass' ? strings.speak.pass : phase === 'retry' ? strings.speak.retry : strings.speak.given}
              </AppText>
            </Animated.View>
          ) : phase === 'listening' || phase === 'checking' ? (
            <AppText variant="childBody" color="textSoft">
              {phase === 'listening' ? strings.speak.listening : strings.speak.checking}
            </AppText>
          ) : null}
          {heard ? (
            <AppText variant="caption" color="textMuted">
              {fmt(strings.speak.heard, { text: heard })}
            </AppText>
          ) : null}
        </View>

        {parentMode ? (
          !resolved ? (
            <View style={styles.parentBox}>
              <AppText variant="bodyStrong" align="center">
                {strings.speak.parentMode}
              </AppText>
              <AppText variant="caption" color="textSoft" align="center">
                {strings.speak.parentModeBody}
              </AppText>
              <BigButton label={strings.speak.parentSaid} variant="success" icon={<Icon name="check" size={22} color={colors.textOnAccent} strokeWidth={3} />} onPress={parentSaid} />
            </View>
          ) : null
        ) : !resolved ? (
          <MicButton listening={phase === 'listening'} onPress={listen} color={tone.base} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.line },
  dotDone: { backgroundColor: colors.success },
  card: {
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 4,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  status: { minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 4 },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  micWrap: { width: sizes.mic + 40, height: sizes.mic + 40, alignItems: 'center', justifyContent: 'center' },
  micRing: { position: 'absolute', width: sizes.mic, height: sizes.mic, borderRadius: sizes.mic / 2 },
  mic: { width: sizes.mic, height: sizes.mic, borderRadius: sizes.mic / 2, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 6, borderBottomColor: 'rgba(0,0,0,0.18)' },
  parentBox: { alignSelf: 'stretch', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
});
