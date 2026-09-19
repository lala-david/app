import { describe, expect, it } from 'vitest';

import week1 from '@/content/weeks/week1.json';
import type { WeekDef } from '@/entities/content/types';

import { addDays, diffDays, monthGrid, startOfWeek } from './calendar';
import { buildCourse, dayIndexOf, isCourseDay, routinesForDate } from './course';

const week = week1 as WeekDef;

describe('calendar', () => {
  it('handles month boundaries, week starts and month grids', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(diffDays('2026-09-19', '2026-09-26')).toBe(7);
    expect(startOfWeek('2026-09-20')).toBe('2026-09-14');
    const grid = monthGrid(2026, 8);
    expect(grid[0][1]).toBe('2026-09-01');
    expect(grid.flat().filter(Boolean)).toHaveLength(30);
  });
});

describe('course', () => {
  it('maps dates to day indexes and course days', () => {
    expect(dayIndexOf('2026-09-19', '2026-09-19')).toBe(1);
    expect(isCourseDay(week, '2026-09-19', '2026-09-25')).toBe(true);
    expect(isCourseDay(week, '2026-09-19', '2026-09-26')).toBe(false);
    expect(isCourseDay(week, '2026-09-19', '2026-09-18')).toBe(false);
  });

  it('adds faith routines only on weekends when enabled', () => {
    expect(routinesForDate(week, '2026-09-19', true)).toHaveLength(6);
    expect(routinesForDate(week, '2026-09-19', false)).toHaveLength(4);
    expect(routinesForDate(week, '2026-09-21', true)).toHaveLength(4);
  });

  it('builds seven ordered days matching the design order', () => {
    const course = buildCourse(week, '2026-09-19', false);
    expect(course).toHaveLength(7);
    expect(course[0].routines.map((r) => r.title)).toEqual(['아침 노래', '오늘의 주제', '저녁 노래', '잠자리 이야기']);
    expect(course[0].routines.map((r) => r.character)).toEqual(['chick', 'crocodile', 'cat', 'rabbit']);
  });
});
