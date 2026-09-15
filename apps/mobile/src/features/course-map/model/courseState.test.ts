import { describe, expect, it } from 'vitest';

import week1 from '@/content/weeks/week1.json';
import type { ChildProfile } from '@/entities/child/model/types';
import type { WeekDef } from '@/entities/content/types';
import { createRecord } from '@/entities/progress/lib/progress';

import { computeCourseState } from './courseState';

const week = week1 as WeekDef;

const child: ChildProfile = {
  nickname: '하늘',
  ageBand: '7',
  avatar: { kind: 'builder', seed: 's', options: {} },
  schedules: [
    { routine: 'morning', time: '07:30', enabled: true },
    { routine: 'theme', time: '17:30', enabled: true },
    { routine: 'dinner', time: '18:30', enabled: true },
    { routine: 'bedtime', time: '20:30', enabled: true },
  ],
  startDate: '2026-09-16',
  run: 1,
  runStartDate: '2026-09-16',
  faithEnabled: false,
  notificationsEnabled: true,
  eveningReminder: true,
  onboardingDone: true,
};

const at = (date: string, time: string) => {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
};

describe('computeCourseState', () => {
  it('opens today and locks the rest on day one', () => {
    const state = computeCourseState(week, child, {}, at('2026-09-16', '06:00'));
    expect(state.todayIndex).toBe(1);
    expect(state.days[0].nodes.every((n) => n.state === 'open')).toBe(true);
    expect(state.days[1].nodes.every((n) => n.state === 'locked')).toBe(true);
    expect(state.upcoming?.node.routine.key).toBe('morning');
    expect(state.todayTargetMinutes).toBe(90);
  });

  it('marks yesterday as missed and tracks progress', () => {
    const records = {
      'r1-d2-morning': createRecord({ key: 'r1-d2-morning', run: 1, day: 2, date: '2026-09-17', routine: 'morning', steps: ['video'], listenedMin: 20, completedAt: 1 }),
      'r1-d2-theme': createRecord({ key: 'r1-d2-theme', run: 1, day: 2, date: '2026-09-17', routine: 'theme', steps: ['video'], listenedMin: 30 }),
    };
    const state = computeCourseState(week, child, records, at('2026-09-17', '19:00'));
    expect(state.days[0].nodes[0].state).toBe('missed');
    expect(state.todayNodes.find((n) => n.routine.key === 'morning')?.state).toBe('done');
    const theme = state.todayNodes.find((n) => n.routine.key === 'theme');
    expect(theme?.state).toBe('inProgress');
    expect(theme?.progress).toBeCloseTo(1 / 3);
    expect(state.todayMinutes).toBe(50);
    expect(state.streak).toBe(1);
    expect(state.upcoming?.node.routine.key).toBe('dinner');
  });

  it('reports a finished week after the last day', () => {
    const state = computeCourseState(week, child, {}, at('2026-09-23', '08:00'));
    expect(state.weekFinished).toBe(true);
    expect(state.todayNodes).toHaveLength(0);
  });

  it('flags a future start date', () => {
    const state = computeCourseState(week, { ...child, runStartDate: '2026-09-18' }, {}, at('2026-09-16', '08:00'));
    expect(state.beforeStart).toBe(true);
  });
});
