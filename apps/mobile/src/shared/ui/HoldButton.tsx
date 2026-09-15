import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { haptics } from '@/shared/platform/haptics';
import { colors } from '@/shared/theme/tokens';

import { AppText } from './AppText';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  durationMs: number;
  size: number;
  label: string;
  releasedLabel: string;
  onComplete: () => void;
  color?: string;
}

/** 길게 눌러야 동작하는 원형 버튼 (부모 확인) */
export function HoldButton({ durationMs, size, label, releasedLabel, onComplete, color = colors.primary }: Props) {
  const progress = useSharedValue(0);
  const [released, setReleased] = useState(false);
  const done = useRef(false);
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  useEffect(() => () => cancelAnimation(progress), [progress]);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    haptics.success();
    onComplete();
  };

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - progress.value) }));

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPressIn={() => {
          setReleased(false);
          haptics.tap();
          progress.value = withTiming(1, { duration: durationMs * (1 - progress.value), easing: Easing.linear }, (finished) => {
            if (finished) runOnJS(finish)();
          });
        }}
        onPressOut={() => {
          if (done.current) return;
          cancelAnimation(progress);
          progress.value = withTiming(0, { duration: 250 });
          setReleased(true);
        }}
        style={{ width: size, height: size }}
      >
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.line} strokeWidth={stroke} fill={colors.primarySoft} />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <AppText variant="childBody" color="primaryDark">
            {label}
          </AppText>
        </View>
      </Pressable>
      <AppText variant="caption" color="textMuted" style={{ opacity: released ? 1 : 0 }}>
        {releasedLabel}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
