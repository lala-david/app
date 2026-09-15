import { describe, expect, it } from 'vitest';

import week1 from '@/content/weeks/week1.json';
import type { ChildProfile } from '@/entities/child/model/types';
import type { WeekDef } from '@/entities/content/types';
import { createRecord } from '@/entities/progress/lib/progress';

import { buildUpcoming } from './buildUpcoming';

const week = week1 as WeekDef;

const child: ChildProfile = {
  nickname: '하늘',
  ageBand: '7',
  avatar: { kind: 'builder', seed: 's', options: {} },
  schedules: [
    { routine: 'morning', time: '07:30', enabled: true },
    { routine: 'theme', time: '17:30', enabled: true },
    { routine: 'dinner', time: '18:30', enabled: false },
    { routine: 'bedtime', time: '20:30', enabled: true },
    { routine: 'faithSong', time: '10:00', enabled: true },
    { routine: 'faithStory', time: '19:30', enabled: true },
  ],
  startDate: '2026-09-16',
  run: 1,
  runStartDate: '2026-09-16',
  faithEnabled: false,
  notificationsEnabled: true,
  eveningReminder: false,
  onboardingDone: true,
};

describe('buildUpcoming', () => {
  it('skips past times, disabled routines and completed lessons', () => {
    const now = new Date(2026, 8, 16, 12, 0);
    const records = { 'r1-d1-theme': createRecord({ key: 'r1-d1-theme', run: 1, day: 1, date: '2026-09-16', routine: 'theme', completedAt: 1 }) };
    const items = buildUpcoming({ week, child, records, now, days: 1 });
    expect(items.map((i) => i.id)).toEqual(['routine:r1-d1-bedtime']);
    expect(items[0].url).toBe('/home?lesson=r1-d1-bedtime');
  });

  it('stops at the end of the week', () => {
    const now = new Date(2026, 8, 21, 6, 0);
    const items = buildUpcoming({ week, child, records: {}, now, days: 7 });
    const dates = new Set(items.map((i) => i.at.getDate()));
    expect([...dates]).toEqual([21, 22]);
  });

  it('adds weekend faith routines and evening reminders when enabled', () => {
    const now = new Date(2026, 8, 19, 6, 0);
    const items = buildUpcoming({ week, child: { ...child, faithEnabled: true, eveningReminder: true }, records: {}, now, days: 1 });
    expect(items.some((i) => i.id === 'routine:r1-d4-faithSong')).toBe(true);
    expect(items.some((i) => i.id === 'routine:evening:2026-09-19')).toBe(true);
  });
});
