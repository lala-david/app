import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import guides from '@/content/guides.json';
import { AssetImage } from '@/entities/content/ui/AssetImage';
import { useSession } from '@/entities/session/model/sessionStore';
import { strings } from '@/shared/i18n/strings.ko';
import { AppText } from '@/shared/ui/AppText';
import { BigButton } from '@/shared/ui/BigButton';
import { Screen } from '@/shared/ui/Screen';
import { colors, spacing } from '@/shared/theme/tokens';

type Slide = (typeof guides.welcome)[number];

interface Props {
  mode: 'auth' | 'replay';
}

/** 앱 소개 3장. 첫 실행과 설정 › 앱 소개 다시 보기에서 쓴다 */
export function WelcomeScreen({ mode }: Props) {
  const router = useRouter();
  const markIntroSeen = useSession((s) => s.markIntroSeen);
  const listRef = useRef<FlatList<Slide>>(null);
  /** 버튼으로 넘기는 중인 목표 페이지. 도착 전 스크롤 이벤트가 페이지를 되돌리지 않게 막는다 */
  const targetPage = useRef<number | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [page, setPage] = useState(0);
  const slides = guides.welcome;
  const last = page === slides.length - 1;
  const { width, height } = size;

  const goTo = (index: number) => {
    targetPage.current = index;
    setPage(index);
    listRef.current?.scrollToOffset({ offset: index * width, animated: true });
  };

  const syncPage = (offsetX: number) => {
    const visible = Math.round(offsetX / width);
    if (targetPage.current !== null) {
      if (visible === targetPage.current) targetPage.current = null;
      return;
    }
    setPage(visible);
  };

  const primary = () => {
    if (!last) return goTo(page + 1);
    if (mode === 'replay') return router.back();
    markIntroSeen();
    router.push('/signup');
  };

  return (
    <Screen
      padded={false}
      footer={
        <>
          <View style={styles.dots}>
            {slides.map((slide, i) => (
              <View key={slide.title} style={[styles.dot, i === page && styles.dotOn]} />
            ))}
          </View>
          <BigButton label={last ? (mode === 'replay' ? strings.common.close : strings.welcome.start) : strings.common.next} size="child" onPress={primary} />
          {mode === 'auth' ? (
            <BigButton
              label={strings.welcome.haveAccount}
              variant="ghost"
              onPress={() => {
                markIntroSeen();
                router.push('/login');
              }}
            />
          ) : null}
        </>
      }
    >
      <View
        style={styles.flex}
        onLayout={(e: LayoutChangeEvent) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
      >
        {width > 0 ? (
          <FlatList
            ref={listRef}
            data={slides}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.title}
            onMomentumScrollEnd={(e) => syncPage(e.nativeEvent.contentOffset.x)}
            onScroll={(e) => syncPage(e.nativeEvent.contentOffset.x)}
            scrollEventThrottle={64}
            renderItem={({ item }) => (
              <View style={[styles.slide, { width, height }]}>
                <AssetImage name={item.image} width={width - spacing.lg * 2} height={(width - spacing.lg * 2) * 0.75} />
                <AppText variant="hero" align="center">
                  {item.title}
                </AppText>
                <AppText variant="body" color="textSoft" align="center" style={styles.body}>
                  {item.body}
                </AppText>
              </View>
            )}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  body: { maxWidth: 320 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line },
  dotOn: { width: 24, backgroundColor: colors.primary },
});
