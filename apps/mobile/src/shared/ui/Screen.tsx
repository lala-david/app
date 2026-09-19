import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, sizes } from '@/shared/theme/tokens';

interface Props {
  children: ReactNode;
  ground?: string;
  /** 하단 탭 바에 가리지 않게 아래 여백을 둔다 */
  withNav?: boolean;
  scroll?: boolean;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

/** 화면 바탕: 시안의 좌우 20, 위 22 여백. 스크롤·하단 고정 영역·키보드 처리 */
export function Screen({ children, ground = colors.ground, withNav = false, scroll = true, footer, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + sizes.screenPaddingTop,
    paddingHorizontal: sizes.screenPaddingX,
    paddingBottom: withNav ? sizes.navClearance + insets.bottom : sizes.screenPaddingTop + (footer ? 0 : insets.bottom),
  };

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: ground }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {scroll ? (
        <ScrollView style={styles.flex} contentContainerStyle={[padding, contentStyle]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padding, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: ground }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: { paddingHorizontal: sizes.screenPaddingX, paddingTop: 10, gap: 10 },
});
