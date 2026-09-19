import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/shared/theme/tokens';

/** 선 아이콘. 경로는 디자인 시안·라이브 사이트와 같다 (24 그리드) */
const ICONS = {
  today: [{ d: 'm3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z' }],
  journey: [{ d: 'M5 20V9M10 20V4M15 20V7M20 20v-8' }],
  parent: [{ circle: [12, 8, 4] }, { d: 'M4.5 21a7.5 7.5 0 0 1 15 0' }],
  settings: [{ circle: [12, 12, 3] }, { d: 'M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3' }],
  bell: [{ d: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9' }, { d: 'M10 21h4' }],
  clock: [{ circle: [12, 12, 9] }, { d: 'M12 7v5l3 2' }],
  moon: [{ d: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z' }],
  user: [{ circle: [12, 8, 4] }, { d: 'M4 21a8 8 0 0 1 16 0' }],
  heart: [{ d: 'M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.2 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z' }],
  book: [{ d: 'M5 4h14v12H8l-3 3z' }, { d: 'M9 8h6M9 12h4' }],
  help: [{ circle: [12, 12, 9] }, { d: 'M9.5 9a2.6 2.6 0 1 1 4.4 1.9c-1.1.8-1.9 1.3-1.9 2.6M12 17h.01' }],
  image: [{ rect: [3, 5, 18, 14, 2] }, { circle: [9, 10, 1.6] }, { d: 'm4 17 5-4.5 3.5 3 3-2.5L20 17' }],
  sparkle: [{ d: 'M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4' }],
  mail: [{ rect: [3, 5, 18, 14, 2] }, { d: 'm3 7 9 6 9-6' }],
  logout: [{ d: 'M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6' }],
  trash: [{ d: 'M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6' }],
  close: [{ d: 'M6 6l12 12M18 6 6 18' }],
  back: [{ d: 'M15 5l-7 7 7 7' }],
  chevronRight: [{ d: 'M9 5l7 7-7 7' }],
  chevronLeft: [{ d: 'M15 5l-7 7 7 7' }],
  check: [{ d: 'M5 12.5l4.5 4.5L19 7.5' }],
  plus: [{ d: 'M12 5v14M5 12h14' }],
  minus: [{ d: 'M5 12h14' }],
  camera: [{ d: 'M4 8h3l2-3h6l2 3h3v11H4z' }, { circle: [12, 13, 3.5] }],
} as const;

const SOLID_ICONS = {
  play: 'M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5z',
  star: 'M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z',
  speaker: 'M4 9.5h3l5-4v13l-5-4H4zM15.5 9a4 4 0 0 1 0 6l1 1.2a5.6 5.6 0 0 0 0-8.4z',
  mic: 'M12 3a3.5 3.5 0 0 0-3.5 3.5v5a3.5 3.5 0 0 0 7 0v-5A3.5 3.5 0 0 0 12 3zM5.5 11a1 1 0 0 1 1 1 5.5 5.5 0 0 0 11 0 1 1 0 1 1 2 0 7.5 7.5 0 0 1-6.5 7.4V21a1 1 0 1 1-2 0v-1.6A7.5 7.5 0 0 1 4.5 12a1 1 0 0 1 1-1z',
  flame: 'M12 2.5c.6 3.2 4.5 5.2 4.5 10a4.5 4.5 0 0 1-9 0c0-2.3 1.2-3.6 2.2-4.6.2 1.6 1 2.6 2 2.9C11 8.3 11.2 5.2 12 2.5z',
} as const;

export type IconName = keyof typeof ICONS | keyof typeof SOLID_ICONS;

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

type Shape = { d: string } | { circle: readonly [number, number, number] } | { rect: readonly [number, number, number, number, number] };

export function Icon({ name, size = 24, color = colors.ink, strokeWidth = 2 }: Props) {
  const stroke = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name in SOLID_ICONS ? (
        <Path d={SOLID_ICONS[name as keyof typeof SOLID_ICONS]} fill={color} />
      ) : (
        (ICONS[name as keyof typeof ICONS] as readonly Shape[]).map((shape, i) => {
          if ('d' in shape) return <Path key={i} d={shape.d} {...stroke} />;
          if ('circle' in shape) return <Circle key={i} cx={shape.circle[0]} cy={shape.circle[1]} r={shape.circle[2]} {...stroke} />;
          const [x, y, w, h, r] = shape.rect;
          return <Rect key={i} x={x} y={y} width={w} height={h} rx={r} {...stroke} />;
        })
      )}
    </Svg>
  );
}
