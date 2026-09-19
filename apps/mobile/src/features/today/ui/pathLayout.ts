import type { PathDay, Station } from '../model/todayState';

/** 길 배치 수치. 오늘 정거장은 크게, 다음 날들은 작게 */
export const PATH = {
  header: 58,
  today: { row: 138, stone: 104, character: 92, inset: 60 },
  future: { row: 96, stone: 62, character: 56, inset: 72 },
  bottomPad: 12,
} as const;

export type PathItem =
  | { kind: 'header'; key: string; y: number; height: number; day: PathDay }
  | { kind: 'station'; key: string; y: number; height: number; station: Station; big: boolean; side: 'left' | 'right'; cx: number; cy: number };

export interface PathLayout {
  items: PathItem[];
  height: number;
  /** 정거장 중심을 잇는 곡선 조각. done 이면 색을 채운다 */
  segments: { d: string; color: string | null }[];
}

/**
 * 폭에 맞춰 길을 배치한다. 정거장은 좌→우로 번갈아 놓여 굽이진 길이 되고,
 * 폭이 넓어지면 좌우 간격만 벌어진다 (반응형).
 */
export function layoutPath(days: readonly PathDay[], width: number, toneColor: (station: Station) => string): PathLayout {
  const items: PathItem[] = [];
  let y = 0;
  let turn = 0;

  for (const day of days) {
    items.push({ kind: 'header', key: `h${day.index}`, y, height: PATH.header, day });
    y += PATH.header;
    const big = day.offset === 0;
    const spec = big ? PATH.today : PATH.future;
    for (const station of day.stations) {
      const side = turn % 2 === 0 ? 'left' : 'right';
      const cx = side === 'left' ? spec.inset : width - spec.inset;
      items.push({ kind: 'station', key: station.id, y, height: spec.row, station, big, side, cx, cy: y + spec.row / 2 + (big ? 8 : 0) });
      y += spec.row;
      turn += 1;
    }
  }

  const stations = items.filter((i): i is Extract<PathItem, { kind: 'station' }> => i.kind === 'station');
  const segments = stations.slice(1).map((to, i) => {
    const from = stations[i];
    const bend = (to.cy - from.cy) * 0.55;
    return {
      d: `M ${from.cx} ${from.cy} C ${from.cx} ${from.cy + bend}, ${to.cx} ${to.cy - bend}, ${to.cx} ${to.cy}`,
      color: from.station.state === 'done' ? toneColor(from.station) : null,
    };
  });

  return { items, height: y + PATH.bottomPad, segments };
}
