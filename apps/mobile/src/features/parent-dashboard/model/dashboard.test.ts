import { describe, expect, it } from 'vitest';

import week1 from '@/content/weeks/week1.json';
import type { ChildProfile } from '@/entities/child/model/types';
import type { WeekDef } from '@/entities/content/types';
import { createRecord } from '@/entities/progress/lib/progress';

import { dayDetail, monthCounts, summary, weekTable } from './dashboard';

const week = week1 as WeekDef;

const child: ChildProfile = {
  nickname: '하늘',
  ageBand: '7',
  avatar: { kind: 'builder', seed: 's', options: {} },
  schedules: [],
  startDate: '2026-09-16',
  run: 1,
  runStartDate: '2026-09-16',
  faithEnabled: false,
  notificationsEnabled: true,
  eveningReminder: false,
  onboardingDone: true,
};

const records = [
  createRecord({ key: 'r1-d1-morning', run: 1, day: 1, date: '2026-09-16', routine: 'morning', videoStatus: 'auto', listenedMin: 20, completedAt: 1 }),
  createRecord({ key: 'r1-d1-dinner', run: 1, day: 1, date: '2026-09-16', routine: 'dinner', source: 'parentCheck', videoStatus: 'manual', listenedMin: 20, completedAt: 2 }),
  createRecord({
    key: 'r1-d1-theme',
    run: 1,
    day: 1,
    date: '2026-09-16',
    routine: 'theme',
    listenedMin: 30,
    quiz: [{ questionId: 'q1', word: 'red', type: 'pickImage', correct: true, ms: 1 }],
  }),
];

describe('weekTable', () => {
  it('lays out routines by weekday like the paper chart', () => {
    const table = weekTable(week, child, records, '2026-09-14', '2026-09-16');
    expect(table.dates[0]).toBe('2026-09-14');
    const morning = table.rows.find((r) => r.routine.key === 'morning')!;
    expect(morning.cells.map((c) => c.status)).toEqual(['outside', 'outside', 'auto', 'future', 'future', 'future', 'future']);
    const dinner = table.rows.find((r) => r.routine.key === 'dinner')!;
    expect(dinner.cells[2].status).toBe('manual');
    expect(dinner.cells[2].key).toBe('r1-d1-dinner');
  });

  it('shows faith rows only on weekend cells', () => {
    const table = weekTable(week, { ...child, faithEnabled: true }, records, '2026-09-14', '2026-09-20');
    const faith = table.rows.find((r) => r.routine.key === 'faithSong')!;
    expect(faith.cells[2].status).toBe('none');
    expect(faith.cells[5].status).not.toBe('none');
  });
});

describe('summaries', () => {
  it('counts month completions', () => {
    const { counts } = monthCounts(records, 2026, 8);
    expect(counts['2026-09-16']).toBe(2);
    expect(counts['2026-09-17']).toBe(0);
  });

  it('builds a day detail with words met', () => {
    const detail = dayDetail(week, child, records, '2026-09-16');
    expect(detail.rows.filter((r) => r.done)).toHaveLength(2);
    expect(detail.words).toEqual(['red']);
    expect(detail.minutes).toBe(70);
  });

  it('summarises the current week', () => {
    const result = summary(week, child, records, '2026-09-16', '2026-09-14');
    expect(result.todayMinutes).toBe(70);
    expect(result.todayTarget).toBe(90);
    expect(result.weekDone).toBe(2);
    expect(result.weekTotal).toBe(20);
    expect(result.streak).toBe(1);
  });
});
