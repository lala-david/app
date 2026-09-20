import { useEffect, useRef, type ReactNode } from 'react';
import { ScrollView, StyleSheet, TextInput, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardHeight } from '@/shared/lib/useKeyboardHeight';
import { colors, sizes } from '@/shared/theme/tokens';

import { useFit } from './fit';

interface Props {
  children: ReactNode;
  ground?: string;
  /** 하단 탭 바에 가리지 않게 아래 여백을 둔다 */
  withNav?: boolean;
  scroll?: boolean;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** 부모·설정 시안은 좌우 여백이 16 */
  paddingX?: number;
}

const FIELD_CLEARANCE = 28;

/** 화면 바탕: 시안의 여백, 스크롤, 하단 고정 영역. 키보드가 올라오면 입력칸이 보이도록 비켜 준다 */
export function Screen({ children, ground = colors.ground, withNav = false, scroll = true, footer, contentStyle, paddingX = sizes.screenPaddingX }: Props) {
  const insets = useSafeAreaInsets();
  const { scale } = useFit();
  const window = useWindowDimensions();
  const keyboard = useKeyboardHeight();
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);

  const padding = {
    paddingTop: insets.top + sizes.screenPaddingTop,
    paddingHorizontal: paddingX,
    paddingBottom: withNav ? sizes.navClearance + insets.bottom : sizes.screenPaddingTop + (footer ? 0 : insets.bottom),
  };

  // 입력 중인 칸이 키보드에 가리면 그만큼 올린다
  useEffect(() => {
    if (!keyboard || !scroll) return;
    const timer = setTimeout(() => {
      const field = TextInput.State.currentlyFocusedInput?.();
      field?.measureInWindow((_x, y, _w, h) => {
        const hidden = y + h + FIELD_CLEARANCE * scale - (window.height - keyboard);
        if (hidden > 0) scrollRef.current?.scrollTo({ y: scrollY.current + hidden / scale, animated: true });
      });
    }, 60);
    return () => clearTimeout(timer);
  }, [keyboard, scroll, scale, window.height]);

  return (
    <View style={[styles.flex, { backgroundColor: ground, paddingBottom: keyboard / scale }]}>
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[padding, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={32}
          onScroll={(e) => {
            scrollY.current = e.nativeEvent.contentOffset.y;
          }}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padding, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={[styles.footer, { paddingBottom: (keyboard ? 0 : insets.bottom) + 16, backgroundColor: ground }]}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: { paddingHorizontal: sizes.screenPaddingX, paddingTop: 10, gap: 10 },
});
