import { describe, expect, it } from 'vitest';

import week1 from '@/content/weeks/week1.json';
import type { WeekDef } from '@/entities/content/types';

import { addDays, diffDays, isWeekend, monthGrid, startOfWeek, toDateKey } from './calendar';
import { buildCourse, dayIndexOf, lessonKey, parseLessonKey, routinesForDate, stepsOf } from './course';

const week = week1 as WeekDef;

describe('calendar', () => {
  it('adds days across month boundaries', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts days between keys', () => {
    expect(diffDays('2026-09-16', '2026-09-23')).toBe(7);
    expect(diffDays('2026-09-16', '2026-09-15')).toBe(-1);
  });

  it('starts weeks on Monday', () => {
    expect(startOfWeek('2026-09-20')).toBe('2026-09-14');
    expect(startOfWeek('2026-09-14')).toBe('2026-09-14');
  });

  it('builds a Monday-first month grid', () => {
    const grid = monthGrid(2026, 8);
    expect(grid[0][1]).toBe('2026-09-01');
    expect(grid.flat().filter(Boolean)).toHaveLength(30);
    expect(grid.every((row) => row.length === 7)).toBe(true);
  });

  it('formats local dates', () => {
    expect(toDateKey(new Date(2026, 8, 5))).toBe('2026-09-05');
    expect(isWeekend('2026-09-19')).toBe(true);
    expect(isWeekend('2026-09-16')).toBe(false);
  });
});

describe('course', () => {
  it('maps dates to day indexes', () => {
    expect(dayIndexOf('2026-09-16', '2026-09-16')).toBe(1);
    expect(dayIndexOf('2026-09-16', '2026-09-22')).toBe(7);
    expect(dayIndexOf('2026-09-16', '2026-09-15')).toBe(0);
  });

  it('round-trips lesson keys', () => {
    const key = lessonKey(2, 5, 'theme');
    expect(key).toBe('r2-d5-theme');
    expect(parseLessonKey(key)).toEqual({ run: 2, day: 5, routine: 'theme' });
    expect(parseLessonKey('nope')).toBeNull();
  });

  it('gives listen routines one step and play routines three', () => {
    expect(stepsOf('listen')).toEqual(['video']);
    expect(stepsOf('play')).toEqual(['video', 'quiz', 'speak']);
  });

  it('adds faith routines only on weekends when enabled', () => {
    expect(routinesForDate(week, '2026-09-19', true)).toHaveLength(6);
    expect(routinesForDate(week, '2026-09-19', false)).toHaveLength(4);
    expect(routinesForDate(week, '2026-09-16', true)).toHaveLength(4);
  });

  it('builds seven ordered days', () => {
    const course = buildCourse(week, '2026-09-16', false);
    expect(course).toHaveLength(7);
    expect(course[6].date).toBe('2026-09-22');
    expect(course[0].routines.map((r) => r.key)).toEqual(['morning', 'theme', 'dinner', 'bedtime']);
  });
});
