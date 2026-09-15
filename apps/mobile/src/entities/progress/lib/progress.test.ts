import { describe, expect, it } from 'vitest';

import { cellStatus, createRecord, minutesOn, nextStep, nodeState, quizAccuracy, speakSummary, streakDays } from './progress';

const base = { run: 1, routine: 'morning' as const };
const done = (date: string, extra = {}) =>
  createRecord({ ...base, key: `r1-${date}`, day: 1, date, completedAt: 1, listenedMin: 20, ...extra });

describe('nodeState', () => {
  it('locks future days and marks missed past days', () => {
    expect(nodeState(undefined, 3, 2)).toBe('locked');
    expect(nodeState(undefined, 1, 2)).toBe('missed');
  });

  it('distinguishes open, in progress and done today', () => {
    expect(nodeState(undefined, 2, 2)).toBe('open');
    expect(nodeState(createRecord({ ...base, key: 'k', day: 2, date: 'd', videoStartedAt: 5 }), 2, 2)).toBe('inProgress');
    expect(nodeState(done('2026-09-16'), 1, 5)).toBe('done');
  });
});

describe('nextStep', () => {
  it('returns the first unfinished step', () => {
    const record = createRecord({ ...base, key: 'k', day: 1, date: 'd', steps: ['video'] });
    expect(nextStep(record, ['video', 'quiz', 'speak'])).toBe('quiz');
    expect(nextStep(undefined, ['video'])).toBe('video');
    expect(nextStep({ ...record, steps: ['video'] }, ['video'])).toBeNull();
  });
});

describe('streakDays', () => {
  it('counts consecutive app-completed days up to today', () => {
    const records = [done('2026-09-14'), done('2026-09-15'), done('2026-09-16')];
    expect(streakDays(records, '2026-09-16')).toBe(3);
  });

  it('keeps yesterday’s streak when today is not done yet', () => {
    expect(streakDays([done('2026-09-15')], '2026-09-16')).toBe(1);
  });

  it('breaks on a gap and ignores parent checks', () => {
    expect(streakDays([done('2026-09-13'), done('2026-09-16')], '2026-09-16')).toBe(1);
    expect(streakDays([done('2026-09-16', { source: 'parentCheck' })], '2026-09-16')).toBe(0);
  });
});

describe('cellStatus', () => {
  it('reports future, empty, auto and manual', () => {
    expect(cellStatus(undefined, '2026-09-17', '2026-09-16')).toBe('future');
    expect(cellStatus(undefined, '2026-09-16', '2026-09-16')).toBe('empty');
    expect(cellStatus(done('2026-09-16', { videoStatus: 'auto' }), '2026-09-16', '2026-09-16')).toBe('auto');
    expect(cellStatus(done('2026-09-16', { source: 'parentCheck' }), '2026-09-16', '2026-09-16')).toBe('manual');
  });
});

describe('aggregates', () => {
  it('sums minutes and accuracy', () => {
    const record = done('2026-09-16', {
      quiz: [
        { questionId: 'q1', word: 'red', type: 'pickImage', correct: true, ms: 1 },
        { questionId: 'q2', word: 'blue', type: 'pickImage', correct: false, ms: 1 },
      ],
      speak: [
        { word: 'red', heard: 'red', score: 1, result: 'pass' },
        { word: 'blue', heard: '', score: 0, result: 'skipped' },
      ],
    });
    expect(minutesOn([record, done('2026-09-15')], '2026-09-16')).toBe(20);
    expect(quizAccuracy([record])).toEqual({ correct: 1, total: 2 });
    expect(speakSummary([record])).toEqual({ total: 2, attempted: 1, passed: 1 });
  });
});
