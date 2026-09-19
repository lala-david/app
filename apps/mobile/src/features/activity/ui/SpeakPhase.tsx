import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { config, getWord } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { playSfx, playWord } from '@/entities/content/voice';
import type { SpeakAttempt, SpeakResult } from '@/entities/progress/model/types';
import { judgeSpeech } from '@/entities/speech/judgeSpeech';
import { strings } from '@/shared/i18n/strings.ko';
import { fmt } from '@/shared/lib/format';
import { haptics } from '@/shared/platform/haptics';
import { SpeechRecognitionError, speechRecognizer } from '@/shared/platform/speech';
import { AppText } from '@/shared/ui/AppText';
import { PrimaryButton } from '@/shared/ui/Form';
import { Icon } from '@/shared/ui/icons';
import { Pressy } from '@/shared/ui/Pressy';
import { colors, radius, tones } from '@/shared/theme/tokens';

import { SpeakerButton } from './Tiles';

type Phase = 'idle' | 'listening' | 'checking' | 'pass' | 'retry' | 'given';

interface Props {
  words: string[];
  onAttempt: (attempt: SpeakAttempt) => void;
  onProgress: (fraction: number) => void;
  onDone: () => void;
}

const MIC = 104;
const tone = tones.theme;

function MicButton({ listening, onPress }: { listening: boolean; onPress: () => void }) {
  const pulse = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    pulse.value = listening && !reduceMotion ? withRepeat(withTiming(1.28, { duration: 700 }), -1, true) : withTiming(1);
  }, [listening, pulse, reduceMotion]);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: listening ? 0.3 : 0 }));

  return (
    <Pressy onPress={onPress} accessibilityLabel={listening ? strings.activity.listening : strings.activity.tapToSpeak} style={styles.micWrap}>
      <Animated.View style={[styles.micRing, ring]} />
      <View style={[styles.mic, { backgroundColor: listening ? colors.danger : tone.c }]}>
        <Icon name="mic" size={50} color={colors.white} />
      </View>
    </Pressy>
  );
}

/** 단어를 듣고 따라 말하기. 두 번 안 되면 통과, 언제든 건너뛸 수 있다 */
export function SpeakPhase({ words, onAttempt, onProgress, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [tries, setTries] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [heard, setHeard] = useState('');
  const [helperMode, setHelperMode] = useState(!speechRecognizer.isAvailable());
  const word = getWord(words[index]);
  const resolved = phase === 'pass' || phase === 'given';

  useEffect(() => {
    const timer = setTimeout(() => playWord(word.id), 400);
    return () => clearTimeout(timer);
  }, [word]);

  const record = (result: SpeakResult, score: number, text: string) => onAttempt({ word: word.id, heard: text, score, result });

  const listen = async () => {
    if (phase === 'listening') return speechRecognizer.stop();
    if (phase === 'checking') return;
    haptics.tap();
    setHeard('');
    setPhase('listening');
    try {
      if (!(await speechRecognizer.requestPermission())) throw new SpeechRecognitionError('permission');
      const alternatives = await speechRecognizer.listen({ lang: config.speech.lang, timeoutMs: config.speech.listenTimeoutMs, hints: [word.id] });
      setPhase('checking');
      const verdict = judgeSpeech(word.id, alternatives, word.accept, config.speech.passThreshold);
      const attempt = tries + 1;
      setHeard(verdict.heard);
      setTries(attempt);
      if (verdict.passed) {
        record(attempt > 1 ? 'passAfterRetry' : 'pass', verdict.score, verdict.heard);
        setPhase('pass');
        playSfx('correct');
        haptics.success();
      } else if (attempt < config.speech.maxTries) {
        setPhase('retry');
      } else {
        record('given', verdict.score, verdict.heard);
        setPhase('given');
      }
    } catch (error) {
      if (error instanceof SpeechRecognitionError && error.code !== 'aborted') setHelperMode(true);
      setPhase('idle');
    }
  };

  const next = () => {
    setTries(0);
    setHeard('');
    setPhase('idle');
    onProgress((index + 1) / words.length);
    if (index + 1 < words.length) setIndex(index + 1);
    else onDone();
  };

  const statusText = { idle: '', listening: strings.activity.listening, checking: strings.activity.checking, pass: strings.activity.pass, retry: strings.activity.retry, given: strings.activity.given }[phase];

  return (
    <View style={styles.root}>
      <View style={styles.dots}>
        {words.map((w, i) => (
          <View key={w} style={[styles.dot, i < index && { backgroundColor: colors.brand }, i === index && { backgroundColor: tone.c, width: 24 }]} />
        ))}
      </View>

      <View style={[styles.card, { borderColor: phase === 'pass' ? colors.brand : tone.p }]}>
        <AssetImage name={word.image} size={160} />
        <AppText variant="word">{word.id}</AppText>
        <SpeakerButton size={60} onPress={() => playWord(word.id)} label={word.id} />
      </View>

      <View style={styles.status}>
        <AppText variant="cardTitle" color={phase === 'pass' ? colors.navActive : colors.ink}>
          {statusText}
        </AppText>
        {heard ? (
          <AppText variant="caption" color={colors.inkMuted}>
            {fmt(strings.activity.heard, { text: heard })}
          </AppText>
        ) : null}
      </View>

      {resolved ? (
        <View style={styles.bottom}>
          <PrimaryButton label={strings.activity.continue} onPress={next} color={colors.brand} />
        </View>
      ) : helperMode ? (
        <View style={styles.helper}>
          <AppText variant="bodyStrong" align="center">
            {strings.activity.helperMode}
          </AppText>
          <AppText variant="caption" color={colors.inkSoft} align="center">
            {strings.activity.helperBody}
          </AppText>
          <PrimaryButton label={`✓ ${strings.activity.helperSaid}`} color={colors.brand} onPress={() => { record('passByParent', 1, ''); setPhase('pass'); playSfx('correct'); }} />
        </View>
      ) : (
        <MicButton listening={phase === 'listening'} onPress={listen} />
      )}

      {!resolved ? (
        <Pressy onPress={() => { record('skipped', 0, ''); next(); }} style={styles.skip}>
          <AppText variant="label" color={colors.inkSoft}>
            {strings.activity.skip}
          </AppText>
        </Pressy>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.line },
  card: { alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: radius.hero, borderWidth: 3, paddingVertical: 18, paddingHorizontal: 40 },
  status: { minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 2 },
  bottom: { alignSelf: 'stretch' },
  helper: { alignSelf: 'stretch', backgroundColor: colors.surface, borderRadius: radius.xl, padding: 16, gap: 8 },
  micWrap: { width: MIC + 40, height: MIC + 40, alignItems: 'center', justifyContent: 'center' },
  micRing: { position: 'absolute', width: MIC, height: MIC, borderRadius: MIC * 0.36, backgroundColor: tone.c },
  mic: { width: MIC, height: MIC, borderRadius: MIC * 0.36, alignItems: 'center', justifyContent: 'center' },
  skip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
});
