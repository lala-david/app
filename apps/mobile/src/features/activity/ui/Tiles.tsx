import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { Icon } from '@/shared/ui/icons';
import { Pressy } from '@/shared/ui/Pressy';
import { colors, radius, tones } from '@/shared/theme/tokens';

export type TileStatus = 'idle' | 'correct' | 'wrong' | 'dimmed' | 'matched' | 'active';

const LOOK: Record<TileStatus, { border: string; bg: string; opacity: number }> = {
  idle: { border: colors.lineSoft, bg: colors.surface, opacity: 1 },
  active: { border: tones.theme.c, bg: tones.theme.p, opacity: 1 },
  correct: { border: colors.brand, bg: '#E0F3EA', opacity: 1 },
  matched: { border: colors.brand, bg: '#E0F3EA', opacity: 0.6 },
  wrong: { border: colors.danger, bg: '#FDE7E2', opacity: 1 },
  dimmed: { border: colors.lineSoft, bg: colors.surface, opacity: 0.4 },
};

interface Props {
  status: TileStatus;
  onPress: () => void;
  children: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  label: string;
}

/** 퀴즈 선택지. 오답이면 좌우로 한 번 흔들린다 */
export function ChoiceTile({ status, onPress, children, disabled, style, label }: Props) {
  const x = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const look = LOOK[status];

  useEffect(() => {
    if (status !== 'wrong' || reduceMotion) return;
    x.value = withSequence(withTiming(-9, { duration: 60 }), withTiming(9, { duration: 80 }), withTiming(-5, { duration: 70 }), withTiming(0, { duration: 60 }));
  }, [status, reduceMotion, x]);

  const shake = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <Animated.View style={[style, shake]}>
      <Pressy onPress={onPress} disabled={disabled} accessibilityLabel={label} style={styles.flex}>
        <View style={[styles.tile, { borderColor: look.border, backgroundColor: look.bg, opacity: look.opacity }]}>
          {children}
          {status === 'correct' ? (
            <View style={styles.badge}>
              <Icon name="check" size={16} color={colors.white} strokeWidth={3.2} />
            </View>
          ) : null}
        </View>
      </Pressy>
    </Animated.View>
  );
}

export function SpeakerButton({ onPress, size = 92, label, color = tones.theme.c }: { onPress: () => void; size?: number; label: string; color?: string }) {
  return (
    <Pressy onPress={onPress} accessibilityLabel={label} style={styles.center}>
      <View style={{ width: size, height: size, borderRadius: size * 0.36, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="speaker" size={size * 0.46} color={colors.white} />
      </View>
    </Pressy>
  );
}

export const tileStatus = (option: string, answer: string, chosen: string | null, locked: boolean): TileStatus => {
  if (!locked) return 'idle';
  if (option === answer) return 'correct';
  return option === chosen ? 'wrong' : 'dimmed';
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignSelf: 'center' },
  tile: { flex: 1, borderWidth: 2.5, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', padding: 8 },
  badge: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
});
