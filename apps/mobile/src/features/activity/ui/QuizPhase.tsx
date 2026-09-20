import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getWord } from '@/entities/content/content';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { playSfx, playWord } from '@/entities/content/voice';
import type { QuizAnswer } from '@/entities/progress/model/types';
import { questionWord, type Question } from '@/entities/quiz/buildQuiz';
import { strings } from '@/shared/i18n/strings.ko';
import { clock } from '@/shared/lib/clock';
import { haptics } from '@/shared/platform/haptics';
import { Appear } from '@/shared/ui/Appear';
import { AppText } from '@/shared/ui/AppText';
import { PrimaryButton } from '@/shared/ui/Form';
import { Icon } from '@/shared/ui/icons';
import { colors, radius } from '@/shared/theme/tokens';

import { QuestionView } from './Questions';

interface Props {
  questions: Question[];
  startIndex: number;
  onAnswer: (answer: QuizAnswer) => void;
  onProgress: (fraction: number) => void;
  onDone: () => void;
}

/** 결과 띠가 올라와도 문제가 움직이지 않게 아래를 미리 비워 둔다 */
const FEEDBACK_SPACE = 150;

const answerOf = (q: Question) => (q.type === 'match' ? undefined : q.answer);

export function QuizPhase({ questions, startIndex, onAnswer, onProgress, onDone }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [result, setResult] = useState<boolean | null>(null);
  const shownAt = useRef(clock.now());
  const question = questions[index];

  const answer = (correct: boolean) => {
    if (result !== null) return;
    onAnswer({ questionId: question.id, word: questionWord(question), type: question.type, correct, ms: clock.now() - shownAt.current });
    setResult(correct);
    playSfx(correct ? 'correct' : 'wrong');
    if (correct) haptics.success();
    else {
      haptics.warning();
      const target = answerOf(question);
      if (target) setTimeout(() => playWord(target), 500);
    }
  };

  const next = () => {
    setResult(null);
    shownAt.current = clock.now();
    onProgress((index + 1) / questions.length);
    if (index + 1 < questions.length) setIndex(index + 1);
    else onDone();
  };

  const target = answerOf(question);

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <QuestionView key={question.id} question={question} locked={result !== null} onAnswer={answer} />
      </View>
      {result !== null ? (
        <Appear rise={14} style={[styles.feedback, { backgroundColor: result ? colors.feedbackGood : colors.feedbackTry }]}>
          <View style={styles.feedbackRow}>
            <View style={[styles.mark, { backgroundColor: result ? colors.brand : colors.danger }]}>
              <Icon name={result ? 'check' : 'heart'} size={20} color={colors.white} strokeWidth={3} />
            </View>
            <AppText variant="cardTitle" color={result ? colors.navActive : colors.danger} style={styles.flex}>
              {result ? strings.activity.correct : strings.activity.wrong}
            </AppText>
            {!result && target ? (
              <View style={styles.answer}>
                <AssetImage name={getWord(target).image} size={40} />
                <AppText variant="bodyStrong">{target}</AppText>
              </View>
            ) : null}
          </View>
          <PrimaryButton label={strings.activity.continue} onPress={next} color={result ? colors.brand : colors.danger} />
        </Appear>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  body: { flex: 1, paddingBottom: FEEDBACK_SPACE },
  feedback: { position: 'absolute', left: 0, right: 0, bottom: 0, borderRadius: radius.hero, padding: 16, gap: 12 },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mark: { width: 36, height: 36, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  answer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: radius.pill, paddingRight: 14, paddingLeft: 4 },
});
