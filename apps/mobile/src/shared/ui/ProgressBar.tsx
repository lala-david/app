import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { colors, motion, radius } from '@/shared/theme/tokens';

interface Props {
  progress: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ progress, color = colors.success, height = 14 }: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const fill = useAnimatedStyle(() => ({ width: withTiming(`${clamped * 100}%`, { duration: motion.base }) }));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}>
      <Animated.View style={[styles.fill, { backgroundColor: color, borderRadius: height / 2 }, fill]}>
        <View style={[styles.shine, { borderRadius: radius.pill }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flex: 1, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: '100%' },
  shine: { position: 'absolute', top: 3, left: 8, right: 8, height: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
});
