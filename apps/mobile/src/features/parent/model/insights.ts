import type { ActivityRecord } from '@/entities/progress/model/types';

export interface HardWord {
  word: string;
  /** 맞추기에서 틀린 횟수 + 말하기에서 끝내 못 했거나 건너뛴 횟수 */
  misses: number;
}

const SPEAK_MISS = new Set(['given', 'skipped']);

/**
 * 이번 주에 아이가 어려워한 말. 지원서의 ‘보호자가 어려운 항목을 확인한다’를 위한 계산이다.
 * 같은 단어는 여러 날의 기록을 합친다. 많이 놓친 순서로, 같으면 알파벳 순서로 돌려준다.
 */
export function hardWords(activities: ActivityRecord[], week: number, limit: number): HardWord[] {
  const misses = new Map<string, number>();
  const bump = (word: string) => misses.set(word, (misses.get(word) ?? 0) + 1);

  for (const activity of activities) {
    if (activity.week !== week) continue;
    for (const answer of activity.quiz) if (!answer.correct && answer.word) bump(answer.word);
    for (const attempt of activity.speak) if (SPEAK_MISS.has(attempt.result)) bump(attempt.word);
  }
  return [...misses.entries()]
    .map(([word, count]) => ({ word, misses: count }))
    .sort((a, b) => b.misses - a.misses || a.word.localeCompare(b.word))
    .slice(0, limit);
}

/** 이번 주에 소리활동을 한 번이라도 했는지 */
export const hasActivity = (activities: ActivityRecord[], week: number): boolean => activities.some((a) => a.week === week && (a.quiz.length > 0 || a.speak.length > 0));
