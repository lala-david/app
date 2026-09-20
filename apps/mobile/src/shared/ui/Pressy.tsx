import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { haptics } from '@/shared/platform/haptics';
import { motion } from '@/shared/theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
}

/** 누르면 살짝 작아지는 누름 바탕. 모든 버튼·카드가 이것을 쓴다. 튕기지 않게 스프링은 쓰지 않는다 */
export function Pressy({ style, pressedScale = 0.97, onPressIn, onPressOut, onPress, disabled, ...rest }: Props) {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityRole={rest.accessibilityRole ?? 'button'}
      accessibilityState={{ disabled: !!disabled, ...rest.accessibilityState }}
      onPressIn={(e) => {
        if (!reduceMotion) scale.value = withTiming(pressedScale, { duration: motion.press, easing: Easing.out(Easing.quad) });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, { duration: motion.fast, easing: Easing.out(Easing.quad) });
        onPressOut?.(e);
      }}
      onPress={(e) => {
        haptics.tap();
        onPress?.(e);
      }}
      style={[style, animated]}
    />
  );
}
