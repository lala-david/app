import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getWord } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { playSentence } from '@/entities/content/voice';
import type { Question } from '@/entities/quiz/buildQuiz';
import { AppText } from '@/shared/ui/AppText';
import { spacing } from '@/shared/theme/tokens';

import { SpeakerButton } from '../SpeakerButton';

import { ChoiceTile } from './ChoiceTile';
import { tileStatus, type QuestionProps } from './questionProps';

type Props = QuestionProps<Extract<Question, { type: 'sentenceColor' }>>;

/** “It's red.” 를 듣고 색 찾기 */
export function SentenceColorQuestion({ question, tone, locked, onAnswer }: Props) {
  const [chosen, setChosen] = useState<string | null>(null);
  const play = () => playSentence(question.sentence.audio, question.sentence.text);

  useEffect(() => {
    setChosen(null);
    const timer = setTimeout(() => playSentence(question.sentence.audio, question.sentence.text), 350);
    return () => clearTimeout(timer);
  }, [question.id, question.sentence]);

  return (
    <View style={styles.root}>
      <SpeakerButton tone={tone} onPress={play} label={question.sentence.text} />
      {locked ? (
        <AppText variant="childWord" align="center">
          {question.sentence.text}
        </AppText>
      ) : null}
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
            <AssetImage name={getWord(option).image} size={104} />
          </ChoiceTile>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: spacing.md, justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  cell: { width: '47%', aspectRatio: 1.1 },
});
