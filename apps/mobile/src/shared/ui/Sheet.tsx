import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/shared/i18n/strings.ko';
import { colors, radius, sizes } from '@/shared/theme/tokens';

import { Icon } from './icons';
import { Pressy } from './Pressy';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  minHeight?: number;
}

/** 시안 05A~D의 바닥 시트: 위 모서리 32, 손잡이, 오른쪽 위 닫기 */
export function Sheet({ visible, onClose, children, minHeight }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View entering={FadeIn.duration(180)} style={StyleSheet.absoluteFill}>
          <Pressable style={styles.shade} onPress={onClose} accessibilityLabel={strings.common.close} />
        </Animated.View>
        <Animated.View entering={SlideInDown.springify().damping(22).stiffness(190)} style={[styles.sheet, { minHeight, paddingBottom: insets.bottom + 25 }]}>
          <View style={styles.handle} />
          <Pressy onPress={onClose} style={styles.close} accessibilityLabel={strings.common.close}>
            <Icon name="close" size={22} color={colors.inkMuted} strokeWidth={2.4} />
          </Pressy>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  shade: { flex: 1, backgroundColor: colors.shade },
  sheet: {
    width: '100%',
    maxWidth: sizes.appMaxWidth,
    paddingTop: 50,
    paddingHorizontal: 24,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.ground,
  },
  handle: { position: 'absolute', top: 16, alignSelf: 'center', width: 60, height: 5, borderRadius: 3, backgroundColor: colors.handle },
  close: { position: 'absolute', right: 14, top: 12, width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
});
