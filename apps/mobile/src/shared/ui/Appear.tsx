import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { motion } from '@/shared/theme/tokens';

const SETTLE_MARGIN_MS = 80;

interface Props {
  children: ReactNode;
  /** 아래에서 이만큼 떠오르며 나타난다. 0이면 그냥 서서히 보인다 */
  rise?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'auto' | 'none' | 'box-none';
  accessibilityRole?: 'alert';
  accessibilityLiveRegion?: 'polite';
}

/**
 * 앱에서 쓰는 단 하나의 등장 효과: 살짝 떠오르며 서서히 나타난다.
 * 튕기거나 날아다니는 효과는 쓰지 않는다. 사라질 때는 효과 없이 바로 없어진다
 * (Reanimated의 entering/exiting 레이아웃 애니메이션은 실제 기기에서 튀거나 화면에 남는 일이 있었다).
 */
export function Appear({ children, rise = 10, duration = motion.base, style, ...rest }: Props) {
  const t = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      t.value = 1;
      return;
    }
    t.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
    // 기기의 ‘애니메이션 끄기’ 설정에서는 전환이 끝나지 않는 일이 있다. 그래도 내용은 반드시 보이게 한다
    const settle = setTimeout(() => {
      t.value = 1;
    }, duration + SETTLE_MARGIN_MS);
    return () => clearTimeout(settle);
  }, [t, duration, reduceMotion]);

  const animated = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: rise * (1 - t.value) }] }));

  return (
    <Animated.View {...rest} style={[style, animated]}>
      {children}
    </Animated.View>
  );
}
