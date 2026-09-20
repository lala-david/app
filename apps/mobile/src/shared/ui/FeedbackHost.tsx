import { useEffect, useState, type ReactNode } from 'react';
import { Modal, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFeedbackStore } from '@/shared/feedback/feedbackStore';
import { useKeyboardHeight } from '@/shared/lib/useKeyboardHeight';
import { colors, radius, sizes, type } from '@/shared/theme/tokens';

import { Appear } from './Appear';
import { AppText } from './AppText';
import { FitModalRoot, useFit } from './fit';
import { Pressy } from './Pressy';

const TOAST_MS = 2200;

const ACTION_LOOK = {
  primary: { bg: colors.brand, ink: colors.white },
  danger: { bg: colors.danger, ink: colors.white },
  ghost: { bg: colors.completeBg, ink: colors.completeInk },
} as const;

/** 모달 안쪽: 화면 맞춤 아래에서 키보드만큼 위로 비켜 준다 */
function DialogBackdrop({ children }: { children: ReactNode }) {
  const keyboard = useKeyboardHeight();
  const { scale } = useFit();
  return <View style={[styles.backdrop, { paddingBottom: 24 + keyboard / scale }]}>{children}</View>;
}

function DialogView() {
  const dialog = useFeedbackStore((s) => s.dialog);
  const close = useFeedbackStore((s) => s.closeDialog);
  const [typed, setTyped] = useState('');

  useEffect(() => setTyped(''), [dialog?.id]);
  if (!dialog) return null;
  const locked = !!dialog.typeToConfirm && typed.trim() !== dialog.typeToConfirm;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => close(null)} statusBarTranslucent>
      <FitModalRoot>
        <DialogBackdrop>
          <Appear style={styles.dialog} accessibilityRole="alert">
          <AppText variant="sectionTitle" align="center">
            {dialog.title}
          </AppText>
          {dialog.body ? (
            <AppText variant="body" color={colors.inkSoft} align="center">
              {dialog.body}
            </AppText>
          ) : null}
          {dialog.typeToConfirm ? (
            <TextInput allowFontScaling={false} id="dialog-type-confirm" value={typed} onChangeText={setTyped} placeholder={dialog.typeToConfirm} placeholderTextColor={colors.inkFaint} style={styles.input} autoCapitalize="none" />
          ) : null}
          <View style={styles.actions}>
            {dialog.actions.map((action) => {
              const look = ACTION_LOOK[action.tone ?? 'primary'];
              const disabled = action.tone === 'danger' && locked;
              return (
                <Pressy key={action.value} disabled={disabled} onPress={() => close(action.value)} style={[styles.action, { backgroundColor: disabled ? colors.dayIdle : look.bg }]}>
                  <AppText variant="bodyStrong" color={disabled ? colors.inkFaint : look.ink}>
                    {action.label}
                  </AppText>
                </Pressy>
              );
            })}
          </View>
          </Appear>
        </DialogBackdrop>
      </FitModalRoot>
    </Modal>
  );
}

function ToastView() {
  const toast = useFeedbackStore((s) => s.toast);
  const hide = useFeedbackStore((s) => s.hideToast);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => hide(toast.id), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast, hide]);

  if (!toast) return null;
  return (
    <View pointerEvents="none" style={[styles.toastLayer, { top: insets.top + 12 }]}>
      <Appear key={toast.id} rise={-8} duration={200} style={styles.toast} accessibilityLiveRegion="polite">
        <AppText variant="bodyStrong" color={colors.white} align="center">
          {toast.message}
        </AppText>
      </Appear>
    </View>
  );
}

/** 앱 전체에서 한 번만 그리는 팝업·토스트 자리 */
export function FeedbackHost() {
  return (
    <>
      <DialogView />
      <ToastView />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.shade, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', backgroundColor: colors.ground, borderRadius: radius.sheet, padding: 24, gap: 12 },
  actions: { gap: 10, marginTop: 6 },
  action: { height: 54, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  input: { ...type.body, color: colors.ink, borderWidth: 1, borderColor: colors.lineSoft, borderRadius: radius.md, backgroundColor: colors.surface, minHeight: 50, textAlign: 'center' } as object,
  toastLayer: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 100 },
  toast: { maxWidth: sizes.appMaxWidth - 48, backgroundColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 12 },
});
