import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/shared/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './icons';
import { PressableScale } from './PressableScale';

interface Props {
  title?: string;
  onLeftPress?: () => void;
  leftIcon?: IconName;
  leftLabel?: string;
  right?: ReactNode;
  center?: ReactNode;
}

export function TopBar({ title, onLeftPress, leftIcon = 'back', leftLabel, right, center }: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {onLeftPress ? (
          <PressableScale onPress={onLeftPress} style={styles.iconButton} accessibilityLabel={leftLabel ?? title}>
            <Icon name={leftIcon} size={26} color={colors.textSoft} />
          </PressableScale>
        ) : null}
      </View>
      <View style={styles.center}>
        {center ?? (title ? <AppText variant="heading" numberOfLines={1}>{title}</AppText> : null)}
      </View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: spacing.xs },
  side: { width: 56, justifyContent: 'center' },
  right: { alignItems: 'flex-end', width: 'auto', minWidth: 56 },
  center: { flex: 1, alignItems: 'center' },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
});
