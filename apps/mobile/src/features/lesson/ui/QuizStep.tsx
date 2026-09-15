import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { config } from '@/entities/content/content';
import { playSfx, playWord } from '@/entities/content/voice';
import { progressActions } from '@/entities/progress/model/progressStore';
import { questionWord, type Question } from '@/entities/quiz/buildQuiz';
import { MascotGuide } from '@/features/guides/ui/MascotGuide';
import { track } from '@/shared/analytics/analytics';
import { strings } from '@/shared/i18n/strings.ko';
import { clock } from '@/shared/lib/clock';
import { fmt } from '@/shared/lib/format';
import { haptics } from '@/shared/platform/haptics';
import { BigButton } from '@/shared/ui/BigButton';
import { Screen } from '@/shared/ui/Screen';
import { spacing, tones } from '@/shared/theme/tokens';

import { hrefAfter, type LessonContext } from '../model/lessonContext';
import { quizForLesson } from '../model/quizForLesson';

import { confirmQuitLesson } from './confirmQuit';
import { LessonTopBar } from './LessonTopBar';
import { FeedbackBar } from './quiz/FeedbackBar';
import { MatchQuestion } from './quiz/MatchQuestion';
import { PickImageQuestion } from './quiz/PickImageQuestion';
import { PickWordQuestion } from './quiz/PickWordQuestion';
import type { AnswerEvent, QuestionProps } from './quiz/questionProps';
import { SentenceColorQuestion } from './quiz/SentenceColorQuestion';
import { StepResult } from './StepResult';

function QuestionView(props: QuestionProps) {
  const { question } = props;
  switch (question.type) {
    case 'pickImage':
      return <PickImageQuestion {...props} question={question} />;
    case 'pickWord':
      return <PickWordQuestion {...props} question={question} />;
    case 'sentenceColor':
      return <SentenceColorQuestion {...props} question={question} />;
    case 'match':
      return <MatchQuestion {...props} question={question} />;
  }
}

const answerOf = (question: Question) => (question.type === 'match' ? undefined : question.answer);

export function QuizStep({ context }: { context: LessonContext }) {
  const router = useRouter();
  const { identity, routine, child, record } = context;
  const tone = tones[routine.tone];
  const questions = useMemo(() => quizForLesson(routine, identity.key, child.ageBand), [routine, identity.key, child.ageBand]);

  const alreadyAnswered = record?.quiz.length ?? 0;
  const [index, setIndex] = useState(alreadyAnswered < questions.length ? alreadyAnswered : 0);
  const [feedback, setFeedback] = useState<AnswerEvent | null>(null);
  const [results, setResults] = useState<boolean[]>(() => record?.quiz.map((a) => a.correct) ?? []);
  const [finished, setFinished] = useState(false);
  const shownAt = useRef(clock.now());

  const question = questions[index];
  const correctCount = results.filter(Boolean).length;
  const starsEarned = correctCount * config.stars.quizCorrect;

  const answer = (event: AnswerEvent) => {
    if (!question || feedback) return;
    const ms = clock.now() - shownAt.current;
    progressActions.addQuizAnswer(identity, { questionId: question.id, word: questionWord(question), type: question.type, correct: event.correct, ms });
    track('quiz_answer', { key: identity.key, type: question.type, word: questionWord(question), correct: event.correct, ms });
    setResults((prev) => [...prev.slice(0, index), event.correct]);
    setFeedback(event);
    if (event.correct) {
      playSfx('correct');
      haptics.success();
    } else {
      playSfx('wrong');
      haptics.warning();
      const target = answerOf(question);
      if (target) setTimeout(() => playWord(target), 500);
    }
  };

  const next = () => {
    setFeedback(null);
    shownAt.current = clock.now();
    if (index + 1 < questions.length) setIndex(index + 1);
    else setFinished(true);
  };

  const complete = () => {
    progressActions.completeStep(identity, 'quiz', { stars: starsEarned });
    router.replace(hrefAfter(context, 'quiz'));
  };

  const close = async () => {
    if (await confirmQuitLesson()) router.back();
  };

  if (!question && !finished) {
    return (
      <Screen>
        <BigButton label={strings.quiz.continue} onPress={complete} />
      </Screen>
    );
  }

  const progress = (1 + (finished ? 1 : index / questions.length)) / context.steps.length;

  return (
    <Screen
      header={<LessonTopBar progress={progress} color={tone.base} onClose={close} />}
      footer={finished ? <BigButton label={strings.quiz.continue} variant="success" size="child" onPress={complete} /> : null}
    >
      <MascotGuide id="quiz" />
      <View style={styles.body}>
        {finished ? (
          <StepResult title={strings.quiz.resultTitle} score={fmt(strings.quiz.result, { correct: correctCount, total: questions.length })} stars={starsEarned} />
        ) : (
          <QuestionView key={question.id} question={question} tone={tone} locked={!!feedback} onAnswer={answer} />
        )}
      </View>
      {!finished && feedback ? (
        <View style={styles.feedback}>
          <FeedbackBar correct={feedback.correct} answerWord={answerOf(question)} onContinue={next} />
        </View>
      ) : null}
    </Screen>
  );
}

/** 결과 띠가 올라와도 문제 위치가 움직이지 않도록 아래 공간을 미리 비워 둔다 */
const FEEDBACK_SPACE = 164;

const styles = StyleSheet.create({
  body: { flex: 1, paddingTop: spacing.md, paddingBottom: FEEDBACK_SPACE },
  feedback: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md },
});
