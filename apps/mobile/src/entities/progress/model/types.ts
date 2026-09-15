import type { QuestionType, RoutineKey } from '@/entities/content/types';
import type { DateKey } from '@/entities/course/calendar';
import type { StepKey } from '@/entities/course/course';

export type VideoStatus = 'none' | 'auto' | 'manual';
export type RecordSource = 'app' | 'parentCheck';
export type SpeakResult = 'pass' | 'passAfterRetry' | 'passByParent' | 'given' | 'skipped';

export interface QuizAnswer {
  questionId: string;
  word: string;
  type: QuestionType;
  correct: boolean;
  ms: number;
}

export interface SpeakAttempt {
  word: string;
  heard: string;
  score: number;
  result: SpeakResult;
}

export interface LessonRecord {
  key: string;
  run: number;
  day: number;
  date: DateKey;
  routine: RoutineKey;
  source: RecordSource;
  videoStatus: VideoStatus;
  videoStartedAt: number | null;
  listenedMin: number;
  steps: StepKey[];
  quiz: QuizAnswer[];
  speak: SpeakAttempt[];
  stars: number;
  completedAt: number | null;
}

export type RewardKind = 'sticker' | 'dayBadge' | 'weekTrophy';

export interface Reward {
  id: string;
  kind: RewardKind;
  image: string;
  date: DateKey;
  lessonKey?: string;
  earnedAt: number;
}

export type NodeState = 'locked' | 'open' | 'inProgress' | 'done' | 'missed';
export type CellStatus = 'auto' | 'manual' | 'empty' | 'future';
