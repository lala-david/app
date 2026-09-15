import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '@/shared/theme/tokens';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
  tint?: string;
}

export function Card({ children, style, padded = true, elevated = true, tint }: Props) {
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        elevated ? { boxShadow: shadows.card } : styles.flat,
        tint ? { backgroundColor: tint } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg },
  padded: { padding: spacing.md },
  flat: { borderWidth: 1, borderColor: colors.line },
});
