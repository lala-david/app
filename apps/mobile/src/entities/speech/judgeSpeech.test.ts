import { describe, expect, it } from 'vitest';

import { judgeSpeech, levenshtein, normalizeSpeech } from './judgeSpeech';

describe('judgeSpeech', () => {
  it('passes exact and case-insensitive matches', () => {
    expect(judgeSpeech('red', ['Red.']).passed).toBe(true);
    expect(judgeSpeech('red', ['RED']).score).toBe(1);
  });

  it('finds the word inside a sentence', () => {
    expect(judgeSpeech('blue', ['it is blue']).passed).toBe(true);
  });

  it('accepts listed homophones', () => {
    expect(judgeSpeech('red', ['read'], ['read']).passed).toBe(true);
    expect(judgeSpeech('blue', ['blew'], ['blew']).passed).toBe(true);
  });

  it('uses the best of several alternatives', () => {
    const result = judgeSpeech('green', ['queen', 'green']);
    expect(result.passed).toBe(true);
    expect(result.heard).toBe('green');
  });

  it('rejects unrelated words and silence', () => {
    expect(judgeSpeech('yellow', ['banana']).passed).toBe(false);
    expect(judgeSpeech('yellow', []).passed).toBe(false);
  });
});

describe('helpers', () => {
  it('normalizes punctuation and apostrophes', () => {
    expect(normalizeSpeech("It's  RED!")).toBe('its red');
  });

  it('computes edit distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });
});
