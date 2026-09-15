import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getWord } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { playSfx, playWord } from '@/entities/content/voice';
import { createRng, seedFrom, shuffle, type Question } from '@/entities/quiz/buildQuiz';
import { Icon } from '@/shared/ui/icons';
import { colors, spacing, tones, type ToneName } from '@/shared/theme/tokens';

import { ChoiceTile } from './ChoiceTile';
import type { QuestionProps } from './questionProps';

type Props = QuestionProps<Extract<Question, { type: 'match' }>>;

const SOUND_TONES: ToneName[] = ['sun', 'sky', 'lilac', 'leaf', 'coral', 'night'];

/** 소리 버튼과 그림을 짝짓기 */
export function MatchQuestion({ question, locked, onAnswer }: Props) {
  const pictures = useMemo(() => shuffle(question.pairs, createRng(seedFrom(`${question.id}:pictures`))), [question]);
  const [active, setActive] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<{ word: string; key: number } | null>(null);

  const pressSound = (word: string) => {
    if (locked || matched.includes(word)) return;
    setActive(word);
    playWord(word);
  };

  const pressPicture = (word: string) => {
    if (locked || matched.includes(word) || !active) return;
    if (word === active) {
      const next = [...matched, word];
      setMatched(next);
      setActive(null);
      if (next.length === question.pairs.length) onAnswer({ correct: mistakes === 0 });
      else playSfx('correct');
    } else {
      setMistakes((m) => m + 1);
      setWrong({ word, key: Date.now() });
      playSfx('wrong');
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.column}>
        {question.pairs.map((word, index) => {
          const tone = tones[SOUND_TONES[index % SOUND_TONES.length]];
          const done = matched.includes(word);
          return (
            <ChoiceTile
              key={word}
              status={done ? 'matched' : 'idle'}
              onPress={() => pressSound(word)}
              disabled={locked || done}
              style={styles.cell}
              accessibilityLabel={`sound ${index + 1}`}
            >
              <View style={[styles.sound, { backgroundColor: done ? colors.success : tone.base }, active === word && styles.soundActive]}>
                <Icon name={done ? 'check' : 'speaker'} size={30} color={colors.textOnAccent} strokeWidth={3} />
              </View>
            </ChoiceTile>
          );
        })}
      </View>
      <View style={styles.column}>
        {pictures.map((word) => {
          const done = matched.includes(word);
          return (
            <ChoiceTile
              key={word}
              status={done ? 'matched' : wrong?.word === word ? 'wrong' : 'idle'}
              shakeKey={wrong?.word === word ? wrong.key : 0}
              onPress={() => pressPicture(word)}
              disabled={locked || done}
              style={styles.cell}
              accessibilityLabel={getWord(word).ko}
            >
              <AssetImage name={getWord(word).image} size={64} />
            </ChoiceTile>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  column: { flex: 1, gap: spacing.sm },
  cell: { height: 84 },
  sound: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  soundActive: { borderWidth: 4, borderColor: colors.text },
});
