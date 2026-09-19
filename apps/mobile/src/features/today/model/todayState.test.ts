import { describe, expect, it } from 'vitest';

import week1 from '@/content/weeks/week1.json';
import type { ChildProfile } from '@/entities/child/model/types';
import type { WeekDef } from '@/entities/content/types';
import { createRoutineRecord } from '@/entities/progress/lib/progress';
import { routineRecordKey } from '@/entities/progress/model/types';

import { layoutPath } from '../ui/pathLayout';

import { computeTodayState } from './todayState';

const week = week1 as WeekDef;

const child: ChildProfile = {
  nickname: '하이',
  ageBand: '7',
  avatar: { kind: 'character', character: 'chick' },
  schedules: [],
  startDate: '2026-09-18',
  run: 1,
  runStartDate: '2026-09-18',
  faithEnabled: false,
  notificationsEnabled: true,
  eveningReminder: true,
  onboardingDone: true,
};

function at(date: string, hour = 9): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, hour);
}

describe('computeTodayState', () => {
  it('shows today plus three preview days, numbered 1 to 4', () => {
    const state = computeTodayState(week, child, {}, at('2026-09-18'));
    expect(state.days.map((d) => d.index)).toEqual([1, 2, 3, 4]);
    expect(state.days[0].stations.map((s) => s.number)).toEqual([1, 2, 3, 4]);
    expect(state.days[0].stations.every((s) => s.state === 'open')).toBe(true);
    expect(state.days[1].stations.every((s) => s.state === 'upcoming')).toBe(true);
    expect(state).toMatchObject({ doneCount: 0, totalCount: 4, minutes: 0, percent: 0 });
  });

  it('tracks minutes and percent from finished routines', () => {
    const key = routineRecordKey('2026-09-18', 'theme');
    const map = { [key]: createRoutineRecord('2026-09-18', 'theme', { completedAt: 1, listenedMin: 30, completion: 'timer' }) };
    const state = computeTodayState(week, child, map, at('2026-09-18'));
    expect(state).toMatchObject({ doneCount: 1, minutes: 30, percent: 33, streak: 1 });
  });

  it('flags before-start and finished weeks', () => {
    expect(computeTodayState(week, child, {}, at('2026-09-17')).beforeStart).toBe(true);
    expect(computeTodayState(week, child, {}, at('2026-09-25')).weekFinished).toBe(true);
    expect(computeTodayState(week, child, {}, at('2026-09-24')).days.map((d) => d.index)).toEqual([7]);
  });
});

describe('layoutPath', () => {
  it('alternates sides, stays inside the width and colours finished segments', () => {
    const key = routineRecordKey('2026-09-18', 'morning');
    const map = { [key]: createRoutineRecord('2026-09-18', 'morning', { completedAt: 1, listenedMin: 20, completion: 'timer' }) };
    const { days } = computeTodayState(week, child, map, at('2026-09-18'));

    for (const width of [320, 350, 390]) {
      const layout = layoutPath(days, width, () => '#F4BC16');
      const stations = layout.items.flatMap((item) => (item.kind === 'station' ? [item] : []));
      expect(stations).toHaveLength(16);
      expect(stations.slice(0, 4).map((s) => s.side)).toEqual(['left', 'right', 'left', 'right']);
      expect(stations.every((s) => s.cx > 0 && s.cx < width)).toBe(true);
      expect(layout.segments).toHaveLength(15);
      expect(layout.segments[0].color).toBe('#F4BC16');
      expect(layout.segments[1].color).toBeNull();
      expect(layout.height).toBeGreaterThan(1000);
    }
  });
});
