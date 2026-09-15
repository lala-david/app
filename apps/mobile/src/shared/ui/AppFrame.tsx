import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

import { colors, radius, shadows, sizes } from '@/shared/theme/tokens';

/** 모바일 전용 앱: 넓은 화면(웹)에서는 가운데 폰 크기로 보여준다 */
export function AppFrame({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const framed = Platform.OS === 'web' && width > sizes.appMaxWidth + 80;

  if (!framed) return <View style={styles.fill}>{children}</View>;

  return (
    <View style={styles.backdrop}>
      <View style={styles.phone}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bgChild },
  backdrop: { flex: 1, backgroundColor: colors.frameBackdrop, alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  phone: {
    flex: 1,
    width: sizes.appMaxWidth,
    maxHeight: 920,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bgChild,
    boxShadow: shadows.frame,
  },
});
