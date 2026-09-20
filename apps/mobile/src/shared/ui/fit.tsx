import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

import { sizes } from '@/shared/theme/tokens';

/**
 * 화면 자동 맞춤.
 * 앱의 모든 치수는 시안의 폭 390을 기준으로 적혀 있다. 폰마다 화면 폭(과 ‘화면 크게 보기’ 설정)이 달라서
 * 그대로 그리면 글자가 넘치거나 그림이 겹친다. 그래서 화면을 폭 390짜리로 그린 뒤 통째로 늘이거나 줄여
 * 어떤 폰에서도 시안과 같은 비율로 보이게 한다.
 */
interface Fit {
  /** 실제 화면 폭 ÷ 390 */
  scale: number;
  /** 맞춤 공간(폭 390) 안에서의 높이 */
  height: number;
}

const FitContext = createContext<Fit>({ scale: 1, height: 0 });
/** 맞춤 전의 기기 여백. 모달처럼 새 창에서 다시 맞출 때 두 번 나누지 않으려고 따로 들고 있는다 */
const RawInsetsContext = createContext<EdgeInsets | null>(null);

export const useFit = () => useContext(FitContext);

export function FitRoot({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  const current = useSafeAreaInsets();
  const raw = useContext(RawInsetsContext) ?? current;
  const scale = width / sizes.designWidth;

  const fit = useMemo(() => ({ scale, height: height / scale }), [scale, height]);
  const insets = useMemo(() => ({ top: raw.top / scale, right: raw.right / scale, bottom: raw.bottom / scale, left: raw.left / scale }), [raw, scale]);

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <RawInsetsContext.Provider value={raw}>
        <SafeAreaInsetsContext.Provider value={insets}>
          <FitContext.Provider value={fit}>
            <View style={{ width: sizes.designWidth, height: fit.height, transform: [{ scale }], transformOrigin: 'top left' }}>{children}</View>
          </FitContext.Provider>
        </SafeAreaInsetsContext.Provider>
      </RawInsetsContext.Provider>
    </View>
  );
}

/** Modal 안에서 쓴다: 모달은 새 창이라 앱 틀 밖에 그려지므로 같은 맞춤을 다시 건다 */
export function FitModalRoot({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  return (
    <View style={styles.modal}>
      <FitRoot width={Math.min(width, sizes.appMaxWidth)} height={height}>
        {children}
      </FitRoot>
    </View>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, alignItems: 'center' },
});
