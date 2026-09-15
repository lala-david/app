/** 날짜 키(YYYY-MM-DD, 기기 시간대 기준)를 다루는 순수 함수 */

export type DateKey = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: DateKey, days: number): DateKey {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** to - from (일) */
export function diffDays(from: DateKey, to: DateKey): number {
  const utc = (k: DateKey) => {
    const [y, m, d] = k.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

/** 0 = 일요일 */
export function weekdayOf(key: DateKey): number {
  return fromDateKey(key).getDay();
}

export function isWeekend(key: DateKey): boolean {
  const day = weekdayOf(key);
  return day === 0 || day === 6;
}

/** 월요일 시작 주의 첫날 */
export function startOfWeek(key: DateKey): DateKey {
  const offset = (weekdayOf(key) + 6) % 7;
  return addDays(key, -offset);
}

export function weekDates(weekStart: DateKey): DateKey[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/** 월요일 시작 달력. 해당 월이 아닌 칸은 null */
export function monthGrid(year: number, month0: number): (DateKey | null)[][] {
  const first = toDateKey(new Date(year, month0, 1));
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const lead = (weekdayOf(first) + 6) % 7;
  const cells: (DateKey | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => addDays(first, i)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, row) => cells.slice(row * 7, row * 7 + 7));
}

export function compareDateKeys(a: DateKey, b: DateKey): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}
