import { describe, expect, it } from 'vitest';

import week1 from '@/content/weeks/week1.json';
import type { ChildProfile } from '@/entities/child/model/types';
import type { WeekDef } from '@/entities/content/types';
import { createRoutineRecord } from '@/entities/progress/lib/progress';
import { routineRecordKey, type RoutineRecord } from '@/entities/progress/model/types';

import { monthView, stickerBoard, summaryStats, weekGlance, weekTable } from './report';

const week = week1 as WeekDef;

const child: ChildProfile = {
  nickname: '하이',
  ageBand: '7',
  avatar: { kind: 'character', character: 'chick' },
  schedules: [],
  startDate: '2026-09-16',
  run: 1,
  runStartDate: '2026-09-16',
  faithEnabled: false,
  notificationsEnabled: true,
  eveningReminder: true,
  onboardingDone: true,
};

function rec(date: string, routine: RoutineRecord['routine'], completion: RoutineRecord['completion'], completedAt: number) {
  return [routineRecordKey(date, routine), createRoutineRecord(date, routine, { completedAt, listenedMin: routine === 'theme' ? 30 : 20, completion })] as const;
}

const map = Object.fromEntries([rec('2026-09-16', 'morning', 'timer', 1), rec('2026-09-16', 'theme', 'parent', 2), rec('2026-09-17', 'morning', 'manual', 3)]);

describe('weekTable', () => {
  it('mirrors the paper routine chart', () => {
    const table = weekTable(week, child, map, '2026-09-14', '2026-09-17');
    expect(table.rows[0].cells.map((c) => c.status)).toEqual(['none', 'none', 'app', 'app', 'future', 'future', 'future']);
    expect(table.rows[1].cells[2].status).toBe('parent');
    expect(table.rows.map((r) => r.routine.shortTitle)).toEqual(['아침', '주제', '저녁', '잠자리']);
  });
});

describe('summaries', () => {
  it('computes the four stat tiles', () => {
    const stats = summaryStats(week, child, map, '2026-09-17', '2026-09-14');
    expect(stats).toMatchObject({ todayMinutes: 20, todayTarget: 90, streak: 2, weekDone: 3, weekTotal: 20, totalMinutes: 70 });
  });

  it('computes per-routine completion over elapsed days', () => {
    const glance = weekGlance(week, child, map, '2026-09-14', '2026-09-17');
    expect(glance.map((g) => `${g.done}/${g.total}`)).toEqual(['2/2', '1/2', '0/2', '0/2']);
  });

  it('marks partial days and lists stickers in completion order', () => {
    const view = monthView(week, map, 2026, 8);
    expect(view.partial.has('2026-09-16')).toBe(true);
    expect(view.full.size).toBe(0);
    const board = stickerBoard(week, map);
    expect(board.earned.map((s) => s.character)).toEqual(['chick', 'crocodile', 'chick']);
    // 시안처럼 6칸씩 3줄에서 시작하고, 넘치면 한 줄씩 늘어난다
    expect(board.slots).toBe(18);
    expect(board.slots % 6).toBe(0);
  });
});
