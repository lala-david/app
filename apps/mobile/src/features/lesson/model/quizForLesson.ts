import { colorWordsOf } from '@/entities/content/content';
import type { AgeBand, QuestionType, RoutineDef } from '@/entities/content/types';
import { buildQuiz, seedFrom, type Question } from '@/entities/quiz/buildQuiz';

/** 레슨 키를 시드로 삼아 같은 날 다시 열어도 같은 문제가 나온다 */
export function quizForLesson(routine: RoutineDef, lessonKey: string, ageBand: AgeBand): Question[] {
  if (!routine.quiz || !routine.words?.length) return [];
  const { mix, optionsByAge, hideWordTextFor } = routine.quiz;
  const hideText = hideWordTextFor.includes(ageBand);

  // 글자를 아직 못 읽는 연령은 “단어 고르기”를 “그림 고르기”로 바꾼다
  const adjustedMix: Record<QuestionType, number> = hideText
    ? { ...mix, pickImage: mix.pickImage + mix.pickWord, pickWord: 0 }
    : mix;

  return buildQuiz({
    words: routine.words,
    colorWords: colorWordsOf(routine.words),
    sentences: routine.sentences ?? [],
    mix: adjustedMix,
    options: optionsByAge[ageBand],
    seed: seedFrom(lessonKey),
  });
}
