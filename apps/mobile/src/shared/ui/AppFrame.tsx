import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

import { colors, radius, shadows, sizes } from '@/shared/theme/tokens';

const FRAME_MAX_HEIGHT = 932;
const FRAME_MIN_ROOM = 760;

/**
 * 반응형 바탕. 폰에서는 화면 전체, 태블릿·PC처럼 넓은 화면에서는
 * 시안과 같은 최대 430 너비의 폰 모양으로 가운데에 놓는다.
 * 화면 크기가 바뀌어도 앱이 다시 시작되지 않도록 트리 구조는 항상 같다.
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const framed = width > sizes.appMaxWidth + 40;
  const roomy = framed && height > FRAME_MIN_ROOM;

  const phone = framed
    ? { width: sizes.appMaxWidth, height: roomy ? Math.min(FRAME_MAX_HEIGHT, Math.round(height * 0.94)) : height, borderRadius: roomy ? radius.sheet : 0 }
    : { width, height };

  return (
    <View style={[styles.backdrop, { backgroundColor: framed ? colors.frame : colors.ground }]}>
      <View style={[styles.phone, phone, framed && Platform.OS === 'web' ? ({ boxShadow: shadows.frame } as object) : null]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  phone: { overflow: 'hidden', backgroundColor: colors.ground },
});
