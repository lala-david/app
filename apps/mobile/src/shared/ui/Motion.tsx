import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '@/shared/theme/tokens';

/** 위아래로 둥실 떠 있는 효과 */
export function Float({ children, active = true, distance = 4, style }: { children: ReactNode; active?: boolean; distance?: number; style?: StyleProp<ViewStyle> }) {
  const y = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!active || reduceMotion) {
      y.value = 0;
      return;
    }
    y.value = withRepeat(withSequence(withTiming(-distance, { duration: motion.float / 2, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: motion.float / 2, easing: Easing.inOut(Easing.quad) })), -1);
  }, [active, distance, reduceMotion, y]);

  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/** 등장할 때 튕기며 커지는 효과 */
export function Pop({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      opacity.value = withTiming(1, { duration: motion.base });
      return;
    }
    opacity.value = withDelay(delay, withTiming(1, { duration: motion.fast }));
    scale.value = withDelay(delay, withSequence(withTiming(1.12, { duration: 220 }), withTiming(1, { duration: 160 })));
  }, [delay, opacity, reduceMotion, scale]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/** 오답일 때 좌우로 흔드는 효과. key가 바뀔 때마다 한 번 */
export function Shake({ children, trigger, style }: { children: ReactNode; trigger: number; style?: StyleProp<ViewStyle> }) {
  const x = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!trigger || reduceMotion) return;
    x.value = withSequence(withTiming(-10, { duration: 60 }), withTiming(10, { duration: 80 }), withTiming(-6, { duration: 70 }), withTiming(0, { duration: 60 }));
  }, [trigger, reduceMotion, x]);

  const animated = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

const CONFETTI_COLORS = ['#FF7A59', '#FFD449', '#6BB37A', '#6C6FD4', '#7CC4F5', '#B08BE0'];

function Piece({ index, total }: { index: number; total: number }) {
  const progress = useSharedValue(0);
  const angle = (index / total) * Math.PI * 2;
  const distance = 110 + (index % 5) * 22;

  useEffect(() => {
    progress.value = withDelay(index * 8, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [index, progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * progress.value,
    transform: [
      { translateX: Math.cos(angle) * distance * progress.value },
      { translateY: Math.sin(angle) * distance * progress.value + 80 * progress.value * progress.value },
      { rotate: `${progress.value * 540}deg` },
    ],
  }));

  return <Animated.View style={[styles.piece, { backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length] }, animated]} />;
}

/** 한 번 터지는 색종이 */
export function Confetti({ count = 28 }: { count?: number }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  return (
    <View pointerEvents="none" style={styles.confetti}>
      {Array.from({ length: count }, (_, i) => (
        <Piece key={i} index={i} total={count} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  confetti: { position: 'absolute', top: '35%', left: '50%', width: 0, height: 0 },
  piece: { position: 'absolute', width: 10, height: 14, borderRadius: 3 },
});
