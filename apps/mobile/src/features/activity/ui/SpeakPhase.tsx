import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { config, getWord } from '@/entities/content/content';
import type { SpeakGameDef } from '@/entities/content/types';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { playSentence, playSfx, playWord } from '@/entities/content/voice';
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

import { firstSentenceIndex, type SpeakRound } from '../model/speakGame';

import { MagicStage } from './MagicStage';

type Phase = 'idle' | 'listening' | 'checking' | 'pass' | 'retry' | 'given';

interface Props {
  game: SpeakGameDef;
  rounds: SpeakRound[];
  onAttempt: (attempt: SpeakAttempt) => void;
  onProgress: (fraction: number) => void;
  onDone: () => void;
}

const MIC = 92;
const QUESTION_GAP_MS = 1500;
const tone = tones.theme;

function MicButton({ listening, onPress }: { listening: boolean; onPress: () => void }) {
  const pulse = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    pulse.value = listening && !reduceMotion ? withRepeat(withTiming(1.3, { duration: 700 }), -1, true) : withTiming(1);
  }, [listening, pulse, reduceMotion]);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: listening ? 0.3 : 0 }));

  return (
    <Pressy onPress={onPress} accessibilityLabel={listening ? strings.activity.listening : strings.activity.tapToSpeak} style={styles.micWrap}>
      <Animated.View style={[styles.micRing, ring]} />
      <View style={[styles.mic, { backgroundColor: listening ? colors.danger : tone.c }]}>
        <Icon name="mic" size={44} color={colors.white} />
      </View>
    </Pressy>
  );
}

/** 팔레트: 이번 단계에서 입힌 색이 한 칸씩 찬다 */
function Palette({ rounds, index, solved }: { rounds: SpeakRound[]; index: number; solved: boolean }) {
  const mode = rounds[index].mode;
  const level = rounds.filter((r) => r.mode === mode);
  const position = level.findIndex((r) => r.id === rounds[index].id);

  return (
    <View style={styles.palette}>
      <AssetImage name="game/palette" size={46} />
      <View style={styles.levelChip}>
        <AppText variant="micro" color={colors.navActive}>
          {mode === 'word' ? strings.activity.game.levelWord : strings.activity.game.levelSentence}
        </AppText>
      </View>
      <View style={styles.wells}>
        {level.map((round, i) => {
          const done = i < position || (i === position && solved);
          const swatch = getWord(round.color).swatch ?? tone.c;
          return (
            <View key={round.id} style={[styles.well, done ? { backgroundColor: swatch, borderColor: swatch, borderStyle: 'solid' } : i === position ? { borderColor: tone.c, borderStyle: 'solid' } : null]}>
              {done ? <Icon name={mode === 'word' ? 'check' : 'star'} size={15} color={colors.white} strokeWidth={3.4} /> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

/**
 * 말하기 게임 ‘색깔 마법’. 영상에서 들은 색깔 말을 직접 말하면 그림에 색이 입혀진다.
 * 틀렸다는 말은 없다: 두 번 안 되면 함께 듣고 넘어가고, 마이크를 못 쓰면 어른이 들어 준다.
 */
export function SpeakPhase({ game, rounds, onAttempt, onProgress, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [tries, setTries] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [heard, setHeard] = useState('');
  const [levelUp, setLevelUp] = useState(false);
  const [helperMode, setHelperMode] = useState(!speechRecognizer.isAvailable());
  const questionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = rounds[index];
  const isWord = round.mode === 'word';
  const resolved = phase === 'pass' || phase === 'given';

  const playPrompt = useCallback(() => {
    if (questionTimer.current) clearTimeout(questionTimer.current);
    if (isWord) return playWord(round.color);
    // 묻는 말을 먼저 듣고, 이어서 따라 말할 대답을 듣는다
    playSentence(game.question.audio, game.question.text);
    questionTimer.current = setTimeout(() => playSentence(round.audio ?? '', round.say), QUESTION_GAP_MS);
  }, [game, isWord, round]);

  useEffect(() => {
    if (levelUp) return;
    const timer = setTimeout(playPrompt, 450);
    return () => {
      clearTimeout(timer);
      if (questionTimer.current) clearTimeout(questionTimer.current);
    };
  }, [playPrompt, levelUp]);

  const record = (result: SpeakResult, score: number, text: string) => onAttempt({ word: round.color, mode: round.mode, heard: text, score, result });

  const celebrate = () => {
    setPhase('pass');
    playSfx(isWord ? 'correct' : 'star');
    haptics.success();
  };

  const listen = async () => {
    if (phase === 'listening') return speechRecognizer.stop();
    if (phase === 'checking') return;
    if (questionTimer.current) clearTimeout(questionTimer.current);
    haptics.tap();
    setHeard('');
    setPhase('listening');
    try {
      if (!(await speechRecognizer.requestPermission())) throw new SpeechRecognitionError('permission');
      const word = getWord(round.color);
      const alternatives = await speechRecognizer.listen({ lang: config.speech.lang, timeoutMs: config.speech.listenTimeoutMs, hints: [round.say, round.color] });
      setPhase('checking');
      const verdict = judgeSpeech(round.color, alternatives, word.accept, config.speech.passThreshold);
      const attempt = tries + 1;
      setHeard(verdict.heard);
      setTries(attempt);
      if (verdict.passed) {
        record(attempt > 1 ? 'passAfterRetry' : 'pass', verdict.score, verdict.heard);
        celebrate();
      } else if (attempt < config.speech.maxTries) {
        setPhase('retry');
        playPrompt();
      } else {
        record('given', verdict.score, verdict.heard);
        setPhase('given');
        playPrompt();
      }
    } catch (error) {
      if (error instanceof SpeechRecognitionError && error.code !== 'aborted') setHelperMode(true);
      setPhase('idle');
    }
  };

  const next = () => {
    const following = index + 1;
    setTries(0);
    setHeard('');
    setPhase('idle');
    onProgress(following / rounds.length);
    if (following >= rounds.length) return onDone();
    if (following === firstSentenceIndex(rounds)) setLevelUp(true);
    setIndex(following);
  };

  if (levelUp) {
    return (
      <View style={styles.levelUp}>
        <AssetImage name="game/rainbow" size={210} />
        <AppText variant="sectionTitle" align="center">
          {strings.activity.game.levelUp}
        </AppText>
        <AppText variant="cardTitle" color={tone.c} align="center">
          {game.question.text}
        </AppText>
        <View style={styles.stretch}>
          <PrimaryButton label={strings.activity.continue} onPress={() => setLevelUp(false)} color={tone.c} />
        </View>
      </View>
    );
  }

  const { game: text } = strings.activity;
  const statusText = { idle: isWord ? text.sayIt : text.answerIt, listening: strings.activity.listening, checking: strings.activity.checking, pass: isWord ? text.painted : text.stamped, retry: strings.activity.retry, given: strings.activity.given }[phase];

  return (
    <View style={styles.root}>
      <View style={styles.titleRow}>
        <AppText variant="eyebrow" color={colors.inkMuted}>
          {game.titleEn.toUpperCase()}
        </AppText>
        <AppText variant="sectionTitle">{game.title}</AppText>
      </View>

      <MagicStage round={round} solved={resolved} prompt={isWord ? round.say : game.question.text} answer={isWord ? undefined : round.say} listening={phase === 'listening'} onReplay={playPrompt} />
      <Palette rounds={rounds} index={index} solved={resolved} />

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

      <View style={styles.controls}>
        {resolved ? (
          <View style={styles.stretch}>
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
            <PrimaryButton
              label={`✓ ${strings.activity.helperSaid}`}
              color={colors.brand}
              onPress={() => {
                record('passByParent', 1, '');
                celebrate();
              }}
            />
          </View>
        ) : (
          <MicButton listening={phase === 'listening'} onPress={listen} />
        )}
      </View>

      {!resolved ? (
        <Pressy
          onPress={() => {
            record('skipped', 0, '');
            next();
          }}
          style={styles.skip}
        >
          <AppText variant="label" color={colors.inkSoft}>
            {strings.activity.skip}
          </AppText>
        </Pressy>
      ) : (
        <View style={styles.skip} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  titleRow: { marginBottom: 12, gap: 2 },
  palette: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, height: 62, paddingHorizontal: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.daysBorder, backgroundColor: colors.surface },
  levelChip: { height: 24, paddingHorizontal: 10, borderRadius: 12, justifyContent: 'center', backgroundColor: colors.navActiveBg },
  wells: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  well: { width: 34, height: 34, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.dashed, alignItems: 'center', justifyContent: 'center' },
  status: { minHeight: 50, alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 6 },
  controls: { flex: 1, minHeight: MIC + 28, alignItems: 'center', justifyContent: 'center' },
  stretch: { alignSelf: 'stretch' },
  helper: { alignSelf: 'stretch', backgroundColor: colors.surface, borderRadius: radius.xl, padding: 16, gap: 8 },
  micWrap: { width: MIC + 36, height: MIC + 28, alignItems: 'center', justifyContent: 'center' },
  micRing: { position: 'absolute', width: MIC, height: MIC, borderRadius: MIC * 0.36, backgroundColor: tone.c },
  mic: { width: MIC, height: MIC, borderRadius: MIC * 0.36, alignItems: 'center', justifyContent: 'center' },
  skip: { minHeight: 40, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  levelUp: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
});
