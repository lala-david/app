import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, sizes, spacing, type Tone } from '@/shared/theme/tokens';

import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  tone?: Tone;
  size?: 'child' | 'parent' | 'compact';
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

const VARIANTS: Record<ButtonVariant, { bg: string; depth: string; text: string; border?: string }> = {
  primary: { bg: colors.primary, depth: colors.primaryDark, text: colors.textOnAccent },
  success: { bg: colors.success, depth: colors.successDark, text: colors.textOnAccent },
  danger: { bg: colors.danger, depth: '#B63E2B', text: colors.textOnAccent },
  secondary: { bg: colors.surface, depth: colors.lineStrong, text: colors.text, border: colors.lineStrong },
  ghost: { bg: 'transparent', depth: 'transparent', text: colors.textSoft },
};

const HEIGHTS = { child: sizes.buttonChild, parent: sizes.buttonParent, compact: 44 };

/** 아래쪽 두께가 있는 큰 버튼. 누르면 두께만큼 내려간다 */
export function BigButton({
  label,
  onPress,
  variant = 'primary',
  tone,
  size = 'parent',
  icon,
  disabled,
  loading,
  fullWidth = true,
  style,
  accessibilityHint,
}: Props) {
  const palette = tone ? { bg: tone.base, depth: tone.dark, text: tone.ink } : VARIANTS[variant];
  const inactive = disabled || loading;
  const depth = variant === 'ghost' ? 0 : sizes.buttonDepth;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={[fullWidth && styles.full, style]}
      pressedScale={0.98}
    >
      <View
        style={[
          styles.base,
          {
            minHeight: HEIGHTS[size],
            backgroundColor: inactive ? colors.locked : palette.bg,
            borderBottomWidth: depth,
            borderBottomColor: inactive ? colors.lockedDark : palette.depth,
            borderColor: palette.border ?? 'transparent',
            borderWidth: palette.border ? 2 : 0,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={palette.text} />
        ) : (
          <>
            {icon}
            <AppText
              variant={size === 'child' ? 'childBody' : 'bodyStrong'}
              tint={inactive ? colors.textMuted : palette.text}
              numberOfLines={1}
            >
              {label}
            </AppText>
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch' },
  base: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
