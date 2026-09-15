import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/shared/theme/tokens';

export type IconName =
  | 'close'
  | 'back'
  | 'chevronRight'
  | 'chevronLeft'
  | 'check'
  | 'lock'
  | 'play'
  | 'speaker'
  | 'mic'
  | 'flame'
  | 'star'
  | 'map'
  | 'chart'
  | 'gear'
  | 'plus'
  | 'minus'
  | 'dice'
  | 'image'
  | 'external'
  | 'bell'
  | 'bellOff'
  | 'clock'
  | 'eye'
  | 'eyeOff'
  | 'heart'
  | 'book'
  | 'mail'
  | 'logout'
  | 'trash'
  | 'pencil'
  | 'sparkle';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** 선 아이콘 모음 (24 그리드). 그림이 아닌 기능 표시에만 쓴다 */
export function Icon({ name, size = 24, color = colors.text, strokeWidth = 2.4 }: Props) {
  const stroke = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const solid = { fill: color };

  const shapes: Record<IconName, React.ReactNode> = {
    close: <Path d="M6 6l12 12M18 6L6 18" {...stroke} />,
    back: <Path d="M15 5l-7 7 7 7" {...stroke} />,
    chevronLeft: <Path d="M15 5l-7 7 7 7" {...stroke} />,
    chevronRight: <Path d="M9 5l7 7-7 7" {...stroke} />,
    check: <Path d="M5 12.5l4.5 4.5L19 7.5" {...stroke} />,
    lock: (
      <>
        <Rect x={5} y={10.5} width={14} height={10} rx={2.5} {...stroke} />
        <Path d="M8 10.5V8a4 4 0 018 0v2.5" {...stroke} />
      </>
    ),
    play: <Path d="M8 5.5v13a1 1 0 001.5.87l11-6.5a1 1 0 000-1.74l-11-6.5A1 1 0 008 5.5z" {...solid} />,
    speaker: (
      <>
        <Path d="M4 9.5h3l5-4v13l-5-4H4z" {...solid} />
        <Path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" {...stroke} />
      </>
    ),
    mic: (
      <>
        <Rect x={8.5} y={3} width={7} height={12} rx={3.5} {...solid} />
        <Path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" {...stroke} />
      </>
    ),
    flame: (
      <Path
        d="M12 2.5c.6 3.2 4.5 5.2 4.5 10a4.5 4.5 0 01-9 0c0-2.3 1.2-3.6 2.2-4.6.2 1.6 1 2.6 2 2.9C11 8.3 11.2 5.2 12 2.5z"
        {...solid}
      />
    ),
    star: <Path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" {...solid} />,
    map: (
      <>
        <Path d="M4 6.5l5-2 6 2 5-2v13l-5 2-6-2-5 2z" {...stroke} />
        <Path d="M9 4.5v13M15 6.5v13" {...stroke} />
      </>
    ),
    chart: (
      <>
        <Rect x={4} y={12} width={4} height={8} rx={1.2} {...stroke} />
        <Rect x={10} y={7} width={4} height={13} rx={1.2} {...stroke} />
        <Rect x={16} y={4} width={4} height={16} rx={1.2} {...stroke} />
      </>
    ),
    gear: (
      <>
        <Circle cx={12} cy={12} r={3.2} {...stroke} />
        <Path
          d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5"
          {...stroke}
        />
      </>
    ),
    plus: <Path d="M12 5v14M5 12h14" {...stroke} />,
    minus: <Path d="M5 12h14" {...stroke} />,
    dice: (
      <>
        <Rect x={4} y={4} width={16} height={16} rx={4} {...stroke} />
        <Circle cx={9} cy={9} r={1.4} {...solid} />
        <Circle cx={15} cy={15} r={1.4} {...solid} />
        <Circle cx={15} cy={9} r={1.4} {...solid} />
        <Circle cx={9} cy={15} r={1.4} {...solid} />
      </>
    ),
    image: (
      <>
        <Rect x={3.5} y={5} width={17} height={14} rx={3} {...stroke} />
        <Circle cx={9} cy={10} r={1.8} {...solid} />
        <Path d="M4 17l5-4.5 3.5 3 3-2.5L20 17" {...stroke} />
      </>
    ),
    external: <Path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" {...stroke} />,
    bell: (
      <>
        <Path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z" {...stroke} />
        <Path d="M10 20.5a2 2 0 004 0" {...stroke} />
      </>
    ),
    bellOff: (
      <>
        <Path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z" {...stroke} />
        <Path d="M4 4l16 16" {...stroke} />
      </>
    ),
    clock: (
      <>
        <Circle cx={12} cy={12} r={8.5} {...stroke} />
        <Path d="M12 7.5V12l3 2" {...stroke} />
      </>
    ),
    eye: (
      <>
        <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" {...stroke} />
        <Circle cx={12} cy={12} r={3} {...stroke} />
      </>
    ),
    eyeOff: (
      <>
        <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" {...stroke} />
        <Path d="M4 4l16 16" {...stroke} />
      </>
    ),
    heart: <Path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0112 7.2 4.3 4.3 0 0119.5 10c0 5.4-7.5 10-7.5 10z" {...solid} />,
    book: (
      <>
        <Path d="M4 5.5A2 2 0 016 4h5v15H6a2 2 0 00-2 1.5z" {...stroke} />
        <Path d="M20 5.5A2 2 0 0018 4h-5v15h5a2 2 0 012 1.5z" {...stroke} />
      </>
    ),
    mail: (
      <>
        <Rect x={3} y={5.5} width={18} height={13} rx={2.5} {...stroke} />
        <Path d="M4 7l8 6 8-6" {...stroke} />
      </>
    ),
    logout: <Path d="M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4M10 16l-4-4 4-4M6 12h10" {...stroke} />,
    trash: <Path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" {...stroke} />,
    pencil: <Path d="M15.5 4.5l4 4L8 20H4v-4z" {...stroke} />,
    sparkle: <Path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" {...solid} />,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {shapes[name]}
    </Svg>
  );
}
