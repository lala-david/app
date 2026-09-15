import { StyleSheet, View } from 'react-native';

import { strings } from '@/shared/i18n/strings.ko';
import { Icon } from '@/shared/ui/icons';
import { PressableScale } from '@/shared/ui/PressableScale';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { colors, spacing } from '@/shared/theme/tokens';

interface Props {
  progress: number;
  color: string;
  onClose: () => void;
}

export function LessonTopBar({ progress, color, onClose }: Props) {
  return (
    <View style={styles.bar}>
      <PressableScale onPress={onClose} style={styles.close} accessibilityLabel={strings.common.close}>
        <Icon name="close" size={28} color={colors.textMuted} strokeWidth={3} />
      </PressableScale>
      <ProgressBar progress={progress} color={color} height={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, minHeight: 56 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
