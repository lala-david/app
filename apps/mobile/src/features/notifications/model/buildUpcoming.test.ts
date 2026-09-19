import { describe, expect, it } from 'vitest';

import week1 from '@/content/weeks/week1.json';
import type { ChildProfile } from '@/entities/child/model/types';
import type { WeekDef } from '@/entities/content/types';
import { createRoutineRecord } from '@/entities/progress/lib/progress';
import { routineRecordKey } from '@/entities/progress/model/types';

import { buildUpcoming } from './buildUpcoming';

const week = week1 as WeekDef;

const child: ChildProfile = {
  nickname: '하이',
  ageBand: '7',
  avatar: { kind: 'character', character: 'chick' },
  schedules: [
    { routine: 'morning', time: '07:30', enabled: true },
    { routine: 'theme', time: '17:30', enabled: true },
    { routine: 'dinner', time: '18:30', enabled: false },
    { routine: 'bedtime', time: '20:30', enabled: true },
    { routine: 'faithSong', time: '10:00', enabled: true },
  ],
  startDate: '2026-09-18',
  run: 1,
  runStartDate: '2026-09-18',
  faithEnabled: false,
  notificationsEnabled: true,
  eveningReminder: false,
  onboardingDone: true,
};

describe('buildUpcoming', () => {
  it('skips past times, disabled routines and finished routines', () => {
    const routineMap = { [routineRecordKey('2026-09-18', 'theme')]: createRoutineRecord('2026-09-18', 'theme', { completedAt: 1 }) };
    const items = buildUpcoming({ week, child, routineMap, now: new Date(2026, 8, 18, 12, 0), days: 1 });
    expect(items.map((i) => i.id)).toEqual(['routine:2026-09-18:bedtime']);
    expect(items[0].url).toBe('/today?open=bedtime');
    expect(items[0].title).toBe('잠자리 이야기 시간이에요');
    expect(items[0].art).toBe('rabbit');
    expect(items[0].body).toContain('토끼');
    expect(items[0].body).toContain('20분');
    expect(items[0].color).toBe('#B64FE0');
  });

  it('stops after the last course day', () => {
    const items = buildUpcoming({ week, child, routineMap: {}, now: new Date(2026, 8, 24, 6, 0), days: 7 });
    expect(new Set(items.map((i) => i.at.getDate()))).toEqual(new Set([24]));
  });

  it('adds weekend faith routines and the evening reminder when turned on', () => {
    const items = buildUpcoming({ week, child: { ...child, faithEnabled: true, eveningReminder: true }, routineMap: {}, now: new Date(2026, 8, 19, 6, 0), days: 1 });
    expect(items.some((i) => i.id === 'routine:2026-09-19:faithSong')).toBe(true);
    expect(items.some((i) => i.id === 'routine:evening:2026-09-19')).toBe(true);
  });
});
