import { useEffect } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { characterImage } from '@/entities/content/content';
import type { CharacterKey } from '@/entities/content/types';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { motion, shadows, sizes } from '@/shared/theme/tokens';

interface Props {
  name: CharacterKey;
  /** 시안의 그림 상자 크기. 캐릭터는 상자보다 조금 작게 그려진다 */
  size: number;
  /** 시안의 hero-float: 위아래로 7, 살짝 기울며 떠 있는다 */
  float?: boolean;
  delay?: number;
  shadow?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Character({ name, size, float = false, delay = 0, shadow = false, style }: Props) {
  const t = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!float || reduceMotion) {
      t.value = 0;
      return;
    }
    const half = motion.float / 2;
    const ease = Easing.inOut(Easing.quad);
    t.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: half, easing: ease }), withTiming(0, { duration: half, easing: ease })), -1));
  }, [float, delay, reduceMotion, t]);

  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: -7 * t.value }, { rotate: `${-0.5 + 1.3 * t.value}deg` }] }));
  const dropShadow = shadow && Platform.OS === 'web' ? ({ filter: `drop-shadow(${shadows.character})` } as object) : null;

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, dropShadow, style, animated]}>
      <AssetImage name={characterImage(name)} size={Math.round(size * sizes.characterFill)} />
    </Animated.View>
  );
}
