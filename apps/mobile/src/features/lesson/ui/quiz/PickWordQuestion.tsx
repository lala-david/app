import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getWord } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { playWord } from '@/entities/content/voice';
import type { Question } from '@/entities/quiz/buildQuiz';
import { AppText } from '@/shared/ui/AppText';
import { Icon } from '@/shared/ui/icons';
import { colors, radius, spacing } from '@/shared/theme/tokens';

import { ChoiceTile } from './ChoiceTile';
import { tileStatus, type QuestionProps } from './questionProps';

type Props = QuestionProps<Extract<Question, { type: 'pickWord' }>>;

/** 그림을 보고 맞는 단어 고르기. 누르면 단어를 읽어준다 */
export function PickWordQuestion({ question, tone, locked, onAnswer }: Props) {
  const [chosen, setChosen] = useState<string | null>(null);
  const answer = getWord(question.answer);

  return (
    <View style={styles.root}>
      <View style={[styles.picture, { backgroundColor: tone.soft }]}>
        <AssetImage name={answer.image} size={190} />
      </View>
      <View style={styles.options}>
        {question.options.map((option) => (
          <ChoiceTile
            key={option}
            status={tileStatus(option, question.answer, chosen, locked)}
            disabled={locked}
            style={styles.option}
            onPress={() => {
              playWord(option);
              setChosen(option);
              onAnswer({ correct: option === question.answer });
            }}
          >
            <View style={styles.row}>
              <Icon name="speaker" size={24} color={colors.textMuted} />
              <AppText variant="childWord">{option}</AppText>
            </View>
          </ChoiceTile>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: spacing.lg, justifyContent: 'center' },
  picture: { alignSelf: 'center', borderRadius: radius.xl, padding: spacing.md },
  options: { gap: spacing.sm },
  option: { minHeight: 72 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
