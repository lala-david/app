import { useEffect, useState } from 'react';
import { Modal, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssetImage } from '@/entities/content/ui/AssetImage';
import { useFeedbackStore } from '@/shared/feedback/feedbackStore';
import { colors, radius, shadows, sizes, spacing, type } from '@/shared/theme/tokens';

import { AppText } from './AppText';
import { BigButton } from './BigButton';

const TOAST_MS = 2200;

function DialogView() {
  const dialog = useFeedbackStore((s) => s.dialog);
  const close = useFeedbackStore((s) => s.closeDialog);
  const [typed, setTyped] = useState('');

  useEffect(() => setTyped(''), [dialog?.id]);

  if (!dialog) return null;
  const locked = !!dialog.typeToConfirm && typed.trim() !== dialog.typeToConfirm;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => close(null)} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View entering={ZoomIn.springify().damping(18)} style={styles.dialog} accessibilityRole="alert">
          {dialog.image ? <AssetImage name={dialog.image} size={112} style={styles.image} /> : null}
          <AppText variant="title" align="center">
            {dialog.title}
          </AppText>
          {dialog.body ? (
            <AppText variant="body" color="textSoft" align="center">
              {dialog.body}
            </AppText>
          ) : null}
          {dialog.typeToConfirm ? (
            <TextInput
              id="dialog-type-confirm"
              value={typed}
              onChangeText={setTyped}
              placeholder={dialog.typeToConfirm}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              autoCapitalize="none"
            />
          ) : null}
          <View style={styles.actions}>
            {dialog.actions.map((action) => (
              <BigButton
                key={action.value}
                label={action.label}
                variant={action.tone === 'danger' ? 'danger' : action.tone === 'ghost' ? 'ghost' : 'primary'}
                disabled={action.tone === 'danger' && locked}
                onPress={() => close(action.value)}
              />
            ))}
          </View>
        </Animated.View>
      </View>
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
    <View pointerEvents="none" style={[styles.toastLayer, { top: insets.top + spacing.sm }]}>
      <Animated.View key={toast.id} entering={FadeInUp.duration(200)} exiting={FadeOutUp.duration(200)} style={styles.toast} accessibilityLiveRegion="polite">
        <AppText variant="bodyStrong" color="textOnAccent" align="center">
          {toast.message}
        </AppText>
      </Animated.View>
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
  backdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  dialog: {
    width: '100%',
    maxWidth: sizes.appMaxWidth - spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    boxShadow: shadows.raised,
  },
  image: { alignSelf: 'center' },
  actions: { gap: spacing.xs, marginTop: spacing.xs },
  input: {
    ...type.body,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    textAlign: 'center',
  },
  toastLayer: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 100 },
  toast: {
    maxWidth: sizes.appMaxWidth - spacing.xl,
    backgroundColor: colors.text,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    boxShadow: shadows.raised,
  },
});
