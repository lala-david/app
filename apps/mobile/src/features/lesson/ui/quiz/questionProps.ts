import type { Question } from '@/entities/quiz/buildQuiz';
import type { Tone } from '@/shared/theme/tokens';

export interface AnswerEvent {
  correct: boolean;
}

export interface QuestionProps<Q extends Question = Question> {
  question: Q;
  tone: Tone;
  locked: boolean;
  onAnswer: (event: AnswerEvent) => void;
}

export const tileStatus = (option: string, answer: string, chosen: string | null, locked: boolean) => {
  if (!locked) return 'idle' as const;
  if (option === answer) return 'correct' as const;
  if (option === chosen) return 'wrong' as const;
  return 'dimmed' as const;
};
