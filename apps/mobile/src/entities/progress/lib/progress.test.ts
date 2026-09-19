import { describe, expect, it } from 'vitest';

import { cellStatus, completionRate, createRoutineRecord, earnedStickers, elapsedSec, minutesOn, stationState, streakDays } from './progress';

const done = (date: string, routine: 'morning' | 'theme' = 'morning', patch = {}) =>
  createRoutineRecord(date, routine, { completedAt: 1, listenedMin: 20, completion: 'timer', ...patch });

describe('elapsedSec', () => {
  it('adds the running stretch to accumulated time', () => {
    const record = createRoutineRecord('2026-09-19', 'morning', { accumulatedSec: 60, runningSince: 1_000 });
    expect(elapsedSec(record, 31_000)).toBe(90);
    expect(elapsedSec({ ...record, runningSince: null }, 31_000)).toBe(60);
    expect(elapsedSec(undefined, 5)).toBe(0);
  });
});

describe('stationState', () => {
  it('covers done, upcoming, missed, running and open', () => {
    expect(stationState(done('2026-09-18'), '2026-09-18', '2026-09-19')).toBe('done');
    expect(stationState(undefined, '2026-09-20', '2026-09-19')).toBe('upcoming');
    expect(stationState(undefined, '2026-09-18', '2026-09-19')).toBe('missed');
    expect(stationState(createRoutineRecord('2026-09-19', 'morning', { runningSince: 5 }), '2026-09-19', '2026-09-19')).toBe('running');
    expect(stationState(createRoutineRecord('2026-09-19', 'morning', { accumulatedSec: 30 }), '2026-09-19', '2026-09-19')).toBe('running');
    expect(stationState(undefined, '2026-09-19', '2026-09-19')).toBe('open');
  });
});

describe('streakDays', () => {
  it('counts consecutive days and keeps yesterday when today is empty', () => {
    expect(streakDays([done('2026-09-17'), done('2026-09-18'), done('2026-09-19')], '2026-09-19')).toBe(3);
    expect(streakDays([done('2026-09-18')], '2026-09-19')).toBe(1);
    expect(streakDays([done('2026-09-16'), done('2026-09-19')], '2026-09-19')).toBe(1);
    expect(streakDays([], '2026-09-19')).toBe(0);
  });
});

describe('cells, minutes, stickers', () => {
  it('separates app and parent completions', () => {
    expect(cellStatus(done('2026-09-19'), '2026-09-19', '2026-09-19')).toBe('app');
    expect(cellStatus(done('2026-09-19', 'morning', { completion: 'parent' }), '2026-09-19', '2026-09-19')).toBe('parent');
    expect(cellStatus(undefined, '2026-09-19', '2026-09-19')).toBe('empty');
    expect(cellStatus(undefined, '2026-09-20', '2026-09-19')).toBe('future');
  });

  it('only counts finished routines toward minutes and rates', () => {
    const records = [done('2026-09-19'), createRoutineRecord('2026-09-19', 'theme', { listenedMin: 10 })];
    expect(minutesOn(records, '2026-09-19')).toBe(20);
    expect(completionRate(records, 'morning', ['2026-09-18', '2026-09-19'])).toEqual({ done: 1, total: 2 });
    expect(completionRate(records, 'theme', ['2026-09-19'])).toEqual({ done: 0, total: 1 });
  });

  it('orders stickers by completion time', () => {
    const stickers = earnedStickers([done('2026-09-19', 'theme', { completedAt: 9 }), done('2026-09-18', 'morning', { completedAt: 3 })]);
    expect(stickers.map((s) => s.routine)).toEqual(['morning', 'theme']);
  });
});
