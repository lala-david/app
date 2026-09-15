import { describe, expect, it } from 'vitest';

import { buildQuiz, createRng, seedFrom, typeSequence, type QuizSpec } from './buildQuiz';

const spec: QuizSpec = {
  words: ['red', 'yellow', 'green', 'blue', 'apple', 'sun', 'clover', 'sky'],
  colorWords: ['red', 'yellow', 'green', 'blue'],
  sentences: [
    { text: "It's red.", answer: 'red', audio: 'a' },
    { text: "It's blue.", answer: 'blue', audio: 'b' },
  ],
  mix: { pickImage: 3, pickWord: 2, match: 1, sentenceColor: 2 },
  options: { pickImage: 4, pickWord: 3, match: 4, sentenceColor: 4 },
  seed: 42,
};

describe('buildQuiz', () => {
  it('follows the mix counts', () => {
    const quiz = buildQuiz(spec);
    expect(quiz).toHaveLength(8);
    const count = (type: string) => quiz.filter((q) => q.type === type).length;
    expect([count('pickImage'), count('pickWord'), count('match'), count('sentenceColor')]).toEqual([3, 2, 1, 2]);
  });

  it('is deterministic for the same seed', () => {
    expect(buildQuiz(spec)).toEqual(buildQuiz(spec));
    expect(buildQuiz({ ...spec, seed: 7 })).not.toEqual(buildQuiz(spec));
  });

  it('always includes the answer once among distinct options', () => {
    for (const question of buildQuiz(spec)) {
      if (question.type === 'match') {
        expect(new Set(question.pairs).size).toBe(4);
        continue;
      }
      expect(question.options.filter((o) => o === question.answer)).toHaveLength(1);
      expect(new Set(question.options).size).toBe(question.options.length);
    }
  });

  it('uses only color words for sentence questions', () => {
    for (const question of buildQuiz(spec)) {
      if (question.type === 'sentenceColor') expect(question.options.every((o) => spec.colorWords.includes(o))).toBe(true);
    }
  });

  it('interleaves question types', () => {
    expect(typeSequence(spec.mix).slice(0, 4)).toEqual(['pickImage', 'pickWord', 'sentenceColor', 'match']);
  });

  it('produces stable seeds and rng values in range', () => {
    expect(seedFrom('r1-d1-theme')).toBe(seedFrom('r1-d1-theme'));
    const rng = createRng(1);
    for (let i = 0; i < 100; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
