import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getWord } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { playWord } from '@/entities/content/voice';
import type { Question } from '@/entities/quiz/buildQuiz';
import { spacing } from '@/shared/theme/tokens';

import { SpeakerButton } from '../SpeakerButton';

import { ChoiceTile } from './ChoiceTile';
import { tileStatus, type QuestionProps } from './questionProps';

type Props = QuestionProps<Extract<Question, { type: 'pickImage' }>>;

/** 소리를 듣고 맞는 그림 고르기 */
export function PickImageQuestion({ question, tone, locked, onAnswer }: Props) {
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(() => {
    setChosen(null);
    const timer = setTimeout(() => playWord(question.answer), 350);
    return () => clearTimeout(timer);
  }, [question.id, question.answer]);

  return (
    <View style={styles.root}>
      <SpeakerButton tone={tone} onPress={() => playWord(question.answer)} label={question.answer} />
      <View style={styles.grid}>
        {question.options.map((option) => (
          <ChoiceTile
            key={option}
            status={tileStatus(option, question.answer, chosen, locked)}
            disabled={locked}
            style={styles.cell}
            accessibilityLabel={getWord(option).ko}
            onPress={() => {
              setChosen(option);
              onAnswer({ correct: option === question.answer });
            }}
          >
            <AssetImage name={getWord(option).image} size={116} />
          </ChoiceTile>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: spacing.lg, justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  cell: { width: '47%', aspectRatio: 1 },
});
