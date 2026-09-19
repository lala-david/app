import { describe, expect, it } from 'vitest';

import { getWeek } from '@/entities/content/content';

import { buildSpeakRounds, firstSentenceIndex } from './speakGame';

const { activity } = getWeek(1);

describe('buildSpeakRounds', () => {
  it('runs the word level first, then the same pictures as sentences', () => {
    const rounds = buildSpeakRounds(activity, '7');
    expect(rounds.map((r) => r.id)).toEqual(['word:red', 'word:yellow', 'word:green', 'word:blue', 'sentence:red', 'sentence:yellow', 'sentence:green', 'sentence:blue']);
    expect(rounds[0]).toMatchObject({ say: 'red', paint: 'apple' });
    expect(rounds[4]).toMatchObject({ say: "It's red.", paint: 'apple', audio: 'sentences/its-red' });
    expect(firstSentenceIndex(rounds)).toBe(4);
  });

  it('keeps six-year-olds on single words', () => {
    const rounds = buildSpeakRounds(activity, '6');
    expect(rounds).toHaveLength(4);
    expect(rounds.every((r) => r.mode === 'word')).toBe(true);
    expect(firstSentenceIndex(rounds)).toBe(-1);
  });

  it('paints every focus colour onto a picture from this week', () => {
    for (const round of buildSpeakRounds(activity, '9-10')) {
      expect(activity.focusWords).toContain(round.color);
      expect(activity.words).toContain(round.paint);
    }
  });
});
