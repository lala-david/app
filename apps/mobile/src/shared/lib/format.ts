/** "{n}분" 같은 템플릿에 값을 채운다 */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

export function splitMinutes(total: number): { h: number; m: number } {
  return { h: Math.floor(total / 60), m: total % 60 };
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

export function weekdayLabel(dayIndex: number): string {
  return WEEKDAYS_KO[dayIndex];
}

export const WEEKDAY_LABELS_MON_FIRST = [...WEEKDAYS_KO.slice(1), WEEKDAYS_KO[0]];

/** "9/17 (수)" */
export function shortDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  return `${m}/${d} (${WEEKDAYS_KO[weekday]})`;
}
