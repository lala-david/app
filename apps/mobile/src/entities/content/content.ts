import appConfig from '@/content/app-config.json';
import week1 from '@/content/weeks/week1.json';
import wordBook from '@/content/words.json';

import type { AgeBand, RoutineKey, WeekDef, WordBook, WordDef } from './types';

const WEEKS: Record<number, WeekDef> = {
  1: week1 as WeekDef,
};

export const config = appConfig;

export function getWeek(week: number = config.currentWeek): WeekDef {
  const found = WEEKS[week];
  if (!found) throw new Error(`Week ${week} content is missing`);
  return found;
}

export const words = wordBook as WordBook;

export function getWord(id: string): WordDef {
  const word = words[id];
  if (!word) throw new Error(`Word "${id}" is missing in words.json`);
  return word;
}

export function colorWordsOf(ids: readonly string[]): string[] {
  return ids.filter((id) => words[id]?.group === 'color');
}

export const ageBands = config.ageBands as AgeBand[];

export const coreRoutineOrder = (week: WeekDef): RoutineKey[] =>
  [...week.routines].sort((a, b) => a.order - b.order).map((r) => r.key);
