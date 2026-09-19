import type { QuestionType, RoutineKey } from '@/entities/content/types';
import type { DateKey } from '@/entities/course/calendar';

/** timer: 앱 타이머로 목표 시간을 채움 · manual: ‘오늘 완료했어요’ · parent: 부모 탭에서 표시 */
export type CompletionKind = 'timer' | 'manual' | 'parent';

/** 하루의 루틴 하나에 대한 기록. (date, routine) 이 유일 키 */
export interface RoutineRecord {
  date: DateKey;
  routine: RoutineKey;
  /** 타이머가 도는 중이면 시작 시각(ms), 멈춰 있으면 null */
  runningSince: number | null;
  /** 멈추기 전까지 쌓인 초 */
  accumulatedSec: number;
  listenedMin: number;
  completion: CompletionKind | null;
  completedAt: number | null;
}

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
  /** 단어만 말했는지, 문장으로 말했는지. 예전 기록에는 없다(단어) */
  mode?: 'word' | 'sentence';
  heard: string;
  score: number;
  result: SpeakResult;
}

/** 이번 주 소리활동(단어 맞추기·말하기) 한 번의 기록. (week, date) 가 유일 키 */
export interface ActivityRecord {
  week: number;
  date: DateKey;
  quiz: QuizAnswer[];
  speak: SpeakAttempt[];
  stars: number;
  completedAt: number | null;
}

export type StationState = 'done' | 'open' | 'running' | 'upcoming' | 'missed';
export type CellStatus = 'app' | 'parent' | 'empty' | 'future' | 'none';

export const routineRecordKey = (date: DateKey, routine: RoutineKey) => `${date}:${routine}`;
export const activityRecordKey = (week: number, date: DateKey) => `w${week}:${date}`;
