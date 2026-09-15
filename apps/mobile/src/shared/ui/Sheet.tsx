import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, sizes, spacing } from '@/shared/theme/tokens';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  dismissable?: boolean;
}

/** 아래에서 올라오는 시트 */
export function Sheet({ visible, onClose, children, dismissable = true }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View entering={FadeIn.duration(180)} style={StyleSheet.absoluteFill}>
          <Pressable style={styles.backdrop} onPress={dismissable ? onClose : undefined} accessibilityLabel="close" />
        </Animated.View>
        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(180)}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
        >
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    width: '100%',
    maxWidth: sizes.appMaxWidth,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.md,
  },
  handle: { alignSelf: 'center', width: sizes.sheetHandle, height: 5, borderRadius: 3, backgroundColor: colors.line, marginBottom: spacing.xxs },
});
