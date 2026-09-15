import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme/tokens';

interface Props {
  children: ReactNode;
  mode?: 'child' | 'parent';
  scroll?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
  keyboard?: boolean;
}

/** 화면 바탕: 안전 영역, 배경색, 스크롤, 하단 고정 영역 */
export function Screen({
  children,
  mode = 'child',
  scroll = false,
  header,
  footer,
  edges = ['top', 'bottom'],
  contentStyle,
  padded = true,
  keyboard = false,
}: Props) {
  const background = { backgroundColor: mode === 'child' ? colors.bgChild : colors.bgParent };
  const inner = [padded && styles.padded, contentStyle];

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[inner, styles.scrollContent]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, inner]}>{children}</View>
  );

  const content = (
    <>
      {header}
      {body}
      {footer ? <View style={[styles.footer, background]}>{footer}</View> : null}
    </>
  );

  return (
    <SafeAreaView style={[styles.flex, background]} edges={edges}>
      {keyboard ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { paddingHorizontal: spacing.md },
  scrollContent: { paddingBottom: spacing.xl, flexGrow: 1 },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.xs },
});
