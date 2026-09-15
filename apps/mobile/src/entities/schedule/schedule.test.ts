import { describe, expect, it } from 'vitest';

import { displayTime, findOrderViolation, pickUpcoming, shiftTime, toMinutes, type RoutineSchedule } from './schedule';

const schedules: RoutineSchedule[] = [
  { routine: 'morning', time: '07:30', enabled: true },
  { routine: 'theme', time: '17:30', enabled: true },
  { routine: 'dinner', time: '18:30', enabled: true },
  { routine: 'bedtime', time: '20:30', enabled: true },
];
const order = ['morning', 'theme', 'dinner', 'bedtime'] as const;

describe('schedule', () => {
  it('shifts time with wrap-around', () => {
    expect(shiftTime('23:50', 20)).toBe('00:10');
    expect(shiftTime('00:05', -10)).toBe('23:55');
  });

  it('displays 12-hour Korean time', () => {
    expect(displayTime('07:30', { am: '오전', pm: '오후' })).toBe('오전 7:30');
    expect(displayTime('12:00', { am: '오전', pm: '오후' })).toBe('오후 12:00');
    expect(displayTime('00:15', { am: '오전', pm: '오후' })).toBe('오전 12:15');
  });

  it('detects out-of-order routines', () => {
    expect(findOrderViolation(schedules, [...order])).toBeNull();
    const broken = schedules.map((s) => (s.routine === 'dinner' ? { ...s, time: '17:00' } : s));
    expect(findOrderViolation(broken, [...order])).toEqual({ routine: 'dinner', previous: 'theme' });
  });

  it('picks the latest overdue routine first', () => {
    const now = toMinutes('19:00');
    expect(pickUpcoming(schedules, [...order], new Set(['morning']), now)).toEqual({ routine: 'dinner', minutesUntil: -30 });
  });

  it('picks the next future routine when nothing is overdue', () => {
    const now = toMinutes('06:00');
    expect(pickUpcoming(schedules, [...order], new Set(), now)).toEqual({ routine: 'morning', minutesUntil: 90 });
  });

  it('returns null when everything is done', () => {
    expect(pickUpcoming(schedules, [...order], new Set(order), 0)).toBeNull();
  });
});
