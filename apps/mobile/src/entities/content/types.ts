import type { ToneName } from '@/shared/theme/tokens';

export type RoutineKey = 'morning' | 'theme' | 'dinner' | 'bedtime' | 'faithSong' | 'faithStory';
export type CharacterKey = 'chick' | 'crocodile' | 'cat' | 'rabbit';
export type AgeBand = '6' | '7' | '8' | '9-10';
export type QuestionType = 'pickImage' | 'pickWord' | 'match' | 'sentenceColor';

export interface VideoRef {
  videoId?: string;
  playlistId?: string;
  title: string;
  channel: string;
  durationSec?: number;
}

export interface RoutineDef {
  key: RoutineKey;
  order: number;
  tone: ToneName;
  character: CharacterKey;
  title: string;
  shortTitle: string;
  titleEn: string;
  targetMinutes: number;
  guide: string;
  sentence: string;
  video: VideoRef;
  requiresFaith?: boolean;
}

export interface SentenceItem {
  text: string;
  answer: string;
  audio: string;
}

export interface ActivityDef {
  title: string;
  words: string[];
  focusWords: string[];
  sentences: SentenceItem[];
  quiz: {
    mix: Record<QuestionType, number>;
    optionsByAge: Record<AgeBand, Record<QuestionType, number>>;
    hideWordTextFor: AgeBand[];
  };
}

export interface WeekDef {
  id: string;
  week: number;
  theme: string;
  days: number;
  headline: string;
  subline: string;
  playlistId: string;
  routines: RoutineDef[];
  weekendExtras: RoutineDef[];
  activity: ActivityDef;
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
