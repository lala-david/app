import type { ToneName } from '@/shared/theme/tokens';

export type RoutineKey = 'morning' | 'theme' | 'dinner' | 'bedtime' | 'faithSong' | 'faithStory';
export type RoutineKind = 'listen' | 'play';
export type AgeBand = '6' | '7' | '8' | '9-10';
export type QuestionType = 'pickImage' | 'pickWord' | 'match' | 'sentenceColor';

export interface VideoRef {
  provider: 'youtube';
  videoId?: string;
  playlistId?: string;
  title: string;
  channel: string;
  durationSec?: number;
}

export interface SentenceItem {
  text: string;
  answer: string;
  audio: string;
}

export interface QuizDef {
  mix: Record<QuestionType, number>;
  optionsByAge: Record<AgeBand, Record<QuestionType, number>>;
  hideWordTextFor: AgeBand[];
}

export interface RoutineDef {
  key: RoutineKey;
  kind: RoutineKind;
  order: number;
  tone: ToneName;
  icon: string;
  sticker: string;
  targetMinutes: number;
  video: VideoRef;
  titleKo: string;
  /** 표처럼 좁은 곳에 쓰는 짧은 이름 */
  shortKo: string;
  parentTip: string;
  phrases: string[];
  words?: string[];
  sentences?: SentenceItem[];
  quiz?: QuizDef;
  speakWords?: string[];
  requiresFaith?: boolean;
}

export interface WeekDef {
  id: string;
  week: number;
  theme: string;
  themeKo: string;
  days: number;
  routines: RoutineDef[];
  weekendExtras: RoutineDef[];
}

export interface WordDef {
  id: string;
  ko: string;
  image: string;
  audio: string;
  group: 'color' | 'thing' | 'routine';
  swatch?: string;
  accept?: string[];
}

export type WordBook = Record<string, WordDef>;
