import { describe, expect, it } from 'vitest';

import type { ActivityRecord } from '@/entities/progress/model/types';

import { hardWords, hasActivity } from './insights';

const activity = (patch: Partial<ActivityRecord>): ActivityRecord => ({ week: 1, date: '2026-09-21', quiz: [], speak: [], stars: 0, completedAt: null, ...patch });

describe('hardWords', () => {
  it('adds up wrong answers and unfinished speaking across days', () => {
    const records = [
      activity({
        quiz: [
          { questionId: 'q1', word: 'green', type: 'pickImage', correct: false, ms: 1 },
          { questionId: 'q2', word: 'red', type: 'pickWord', correct: true, ms: 1 },
        ],
        speak: [{ word: 'green', mode: 'word', heard: '', score: 0.2, result: 'given' }],
      }),
      activity({ date: '2026-09-22', quiz: [{ questionId: 'q1', word: 'blue', type: 'pickImage', correct: false, ms: 1 }], speak: [{ word: 'blue', mode: 'sentence', heard: '', score: 0, result: 'skipped' }] }),
      activity({ date: '2026-09-23', speak: [{ word: 'green', heard: 'green', score: 1, result: 'pass' }] }),
    ];
    expect(hardWords(records, 1, 3)).toEqual([
      { word: 'blue', misses: 2 },
      { word: 'green', misses: 2 },
    ]);
  });

  it('ignores other weeks and respects the limit', () => {
    const records = [activity({ week: 2, quiz: [{ questionId: 'q1', word: 'mom', type: 'pickImage', correct: false, ms: 1 }] })];
    expect(hardWords(records, 1, 3)).toEqual([]);
    expect(hasActivity(records, 1)).toBe(false);
    expect(hasActivity(records, 2)).toBe(true);
  });
});
