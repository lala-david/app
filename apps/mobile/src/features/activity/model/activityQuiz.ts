import { colorWordsOf } from '@/entities/content/content';
import type { ActivityDef, AgeBand, QuestionType } from '@/entities/content/types';
import { buildQuiz, seedFrom, type Question } from '@/entities/quiz/buildQuiz';

/** 날짜를 시드로 삼아 같은 날 다시 열어도 같은 문제가 나온다 */
export function quizFor(activity: ActivityDef, seedKey: string, ageBand: AgeBand): Question[] {
  const { mix, optionsByAge, hideWordTextFor } = activity.quiz;
  // 글자를 아직 못 읽는 연령은 “단어 고르기”를 “그림 고르기”로 바꾼다
  const adjusted: Record<QuestionType, number> = hideWordTextFor.includes(ageBand) ? { ...mix, pickImage: mix.pickImage + mix.pickWord, pickWord: 0 } : mix;

  return buildQuiz({
    words: activity.words,
    colorWords: colorWordsOf(activity.words),
    sentences: activity.sentences,
    mix: adjusted,
    options: optionsByAge[ageBand],
    seed: seedFrom(seedKey),
  });
}
