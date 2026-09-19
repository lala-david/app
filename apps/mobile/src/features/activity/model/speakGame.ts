import type { ActivityDef, AgeBand, SpeakMode } from '@/entities/content/types';

export interface SpeakRound {
  id: string;
  mode: SpeakMode;
  /** 말해야 할 색 단어이자 채점 기준 */
  color: string;
  /** 색이 입혀질 그림(단어 id) */
  paint: string;
  /** 화면에 보이고 들려주는 말: "red" 또는 "It's red." */
  say: string;
  /** 문장일 때의 녹음 파일 키 */
  audio?: string;
}

/**
 * 말하기 게임의 차례. 단어 단계를 모두 지난 뒤 같은 그림으로 문장 단계를 한다:
 * 영상에서 들은 말을 단어 → 문장 순서로 직접 써 보게 하는 흐름이다. 나이에 따라 문장 단계는 빠진다.
 */
export function buildSpeakRounds(activity: ActivityDef, ageBand: AgeBand): SpeakRound[] {
  const { rounds, levelsByAge } = activity.speakGame;
  return levelsByAge[ageBand].flatMap((mode) =>
    rounds.flatMap((round): SpeakRound[] => {
      if (mode === 'word') return [{ id: `word:${round.color}`, mode, color: round.color, paint: round.paint, say: round.color }];
      const sentence = activity.sentences.find((s) => s.answer === round.color);
      return sentence ? [{ id: `sentence:${round.color}`, mode, color: round.color, paint: round.paint, say: sentence.text, audio: sentence.audio }] : [];
    }),
  );
}

/** 첫 문장 차례의 위치. 없으면 -1 */
export const firstSentenceIndex = (rounds: SpeakRound[]): number => rounds.findIndex((r) => r.mode === 'sentence');
