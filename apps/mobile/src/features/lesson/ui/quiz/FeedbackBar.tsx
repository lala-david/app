import { StyleSheet, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';

import { getWord } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { strings } from '@/shared/i18n/strings.ko';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { Icon } from '@/shared/ui/icons';
import { colors, radius, spacing } from '@/shared/theme/tokens';

interface Props {
  correct: boolean;
  answerWord?: string;
  onContinue: () => void;
}

/** 답을 고른 뒤 아래에서 올라오는 결과 띠 */
export function FeedbackBar({ correct, answerWord, onContinue }: Props) {
  const word = answerWord ? getWord(answerWord) : null;

  return (
    <Animated.View entering={SlideInDown.springify().damping(18)} style={[styles.bar, { backgroundColor: correct ? colors.successSoft : colors.dangerSoft }]}>
      <View style={styles.row}>
        <View style={[styles.mark, { backgroundColor: correct ? colors.success : colors.danger }]}>
          <Icon name={correct ? 'check' : 'heart'} size={24} color={colors.textOnAccent} strokeWidth={3} />
        </View>
        <AppText variant="childBody" tint={correct ? colors.successDark : colors.danger} style={styles.flex}>
          {correct ? strings.quiz.correct : strings.quiz.wrong}
        </AppText>
        {!correct && word ? (
          <View style={styles.answer}>
            <AssetImage name={word.image} size={44} />
            <AppText variant="childBody">{word.id}</AppText>
          </View>
        ) : null}
      </View>
      <BigButton label={strings.quiz.continue} variant={correct ? 'success' : 'primary'} size="child" onPress={onContinue} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: { borderRadius: radius.xl, padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mark: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  answer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: radius.pill, paddingRight: spacing.sm },
});
