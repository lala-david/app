import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/shared/ui/icons';
import { Pop, Shake } from '@/shared/ui/Motion';
import { PressableScale } from '@/shared/ui/PressableScale';
import { colors, radius } from '@/shared/theme/tokens';

export type TileStatus = 'idle' | 'correct' | 'wrong' | 'dimmed' | 'matched';

interface Props {
  status: TileStatus;
  onPress: () => void;
  children: ReactNode;
  disabled?: boolean;
  shakeKey?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const LOOK: Record<TileStatus, { border: string; bg: string; depth: string; opacity: number }> = {
  idle: { border: colors.line, bg: colors.surface, depth: colors.lineStrong, opacity: 1 },
  correct: { border: colors.success, bg: colors.successSoft, depth: colors.successDark, opacity: 1 },
  matched: { border: colors.success, bg: colors.successSoft, depth: colors.success, opacity: 0.7 },
  wrong: { border: colors.danger, bg: colors.dangerSoft, depth: colors.danger, opacity: 1 },
  dimmed: { border: colors.line, bg: colors.surface, depth: colors.line, opacity: 0.45 },
};

export function ChoiceTile({ status, onPress, children, disabled, shakeKey = 0, style, accessibilityLabel }: Props) {
  const look = LOOK[status];
  return (
    <Shake trigger={status === 'wrong' ? shakeKey || 1 : 0} style={style}>
      <PressableScale onPress={onPress} disabled={disabled} accessibilityLabel={accessibilityLabel} style={styles.flex}>
        <View style={[styles.tile, { borderColor: look.border, backgroundColor: look.bg, borderBottomColor: look.depth, opacity: look.opacity }]}>
          {children}
          {status === 'correct' ? (
            <Pop style={styles.badge}>
              <View style={[styles.badgeCircle, { backgroundColor: colors.success }]}>
                <Icon name="check" size={18} color={colors.textOnAccent} strokeWidth={3.2} />
              </View>
            </Pop>
          ) : null}
        </View>
      </PressableScale>
    </Shake>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tile: {
    flex: 1,
    borderWidth: 3,
    borderBottomWidth: 6,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  badge: { position: 'absolute', top: 6, right: 6 },
  badgeCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
