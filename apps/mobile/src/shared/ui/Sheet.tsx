import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/shared/i18n/strings.ko';
import { colors, radius, sizes } from '@/shared/theme/tokens';

import { Appear } from './Appear';
import { FitModalRoot } from './fit';
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
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <SheetBody minHeight={minHeight} onClose={onClose}>
        {children}
      </SheetBody>
    </Modal>
  );
}

/** 모달 창 안쪽. 화면 맞춤(FitModalRoot) 아래에서 기기 여백을 읽어야 해서 따로 둔다 */
function SheetBody({ minHeight, onClose, children }: Omit<Props, 'visible'>) {
  const insets = useSafeAreaInsets();
  return (
    <FitModalRoot>
      <View style={styles.root}>
        <Appear rise={0} duration={180} style={StyleSheet.absoluteFill}>
          <Pressable style={styles.shade} onPress={onClose} accessibilityLabel={strings.common.close} />
        </Appear>
        <Appear rise={28} style={[styles.sheet, { minHeight, paddingBottom: insets.bottom + 25 }]}>
          <View style={styles.handle} />
          <Pressy onPress={onClose} style={styles.close} accessibilityLabel={strings.common.close}>
            <Icon name="close" size={19} color={colors.dayLabel} strokeWidth={2.2} />
          </Pressy>
          {children}
        </Appear>
      </View>
    </FitModalRoot>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  shade: { flex: 1, backgroundColor: colors.shade },
  sheet: {
    width: '100%',
    paddingTop: 53,
    paddingHorizontal: 24,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.ground,
  },
  handle: { position: 'absolute', top: 15, alignSelf: 'center', width: 60, height: 5, borderRadius: 3, backgroundColor: colors.handle },
  close: { position: 'absolute', right: 14, top: 18, width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
});
