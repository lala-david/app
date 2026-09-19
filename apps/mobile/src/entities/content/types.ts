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

export type SpeakMode = 'word' | 'sentence';

/** 말하기 게임: 색 단어를 말하면 그림(paint)에 그 색이 입혀진다 */
export interface SpeakGameDef {
  title: string;
  titleEn: string;
  intro: string;
  question: { text: string; audio: string };
  rounds: { color: string; paint: string }[];
  levelsByAge: Record<AgeBand, SpeakMode[]>;
}

export interface ActivityDef {
  title: string;
  words: string[];
  focusWords: string[];
  sentences: SentenceItem[];
  speakGame: SpeakGameDef;
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
  /** 보호자가 생활 속에서 건넬 말. 장면(when)과 묻는 말·대답 */
  parentGuide: { tips: { when: string; ask: string; answer: string }[] };
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
