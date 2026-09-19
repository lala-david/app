import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/shared/i18n/strings.ko';
import { AppText } from '@/shared/ui/AppText';
import { Pressy } from '@/shared/ui/Pressy';
import { colors } from '@/shared/theme/tokens';

import { useSplash } from '../model/splashStore';

import { SplashVideo } from './SplashVideo';

/** 시안 00: 디자이너의 시작 영상(soundsfun_splash)이 재생되고, 화면을 누르면 들어간다. 소리는 꺼진 채로 시작한다 */
export function SplashOverlay() {
  const visible = useSplash((s) => s.visible);
  return visible ? <SplashContent /> : null;
}

function SplashContent() {
  const dismiss = useSplash((s) => s.dismiss);
  const insets = useSafeAreaInsets();
  const [muted, setMuted] = useState(true);
  const [fit, setFit] = useState<'cover' | 'contain'>('contain');
  const reduceMotion = useReducedMotion();
  const hint = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    hint.value = withDelay(3600, withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [hint, reduceMotion]);

  const hintStyle = useAnimatedStyle(() => ({ opacity: 0.65 + 0.35 * hint.value, transform: [{ translateY: -3 * hint.value }] }));

  return (
    <Animated.View
      exiting={FadeOut.duration(260)}
      style={styles.root}
      onLayout={({ nativeEvent: { layout } }) => setFit(layout.width / layout.height < VIDEO_ASPECT ? 'contain' : 'cover')}
    >
      {/* 영상의 위·아래 가장자리 색. 폭에 맞춰 넣었을 때 남는 자리가 영상과 이어져 보인다 */}
      <View style={styles.backdropTop} />
      <View style={styles.backdropBottom} />
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityRole="button" accessibilityLabel={strings.splash.hint}>
        <SplashVideo muted={muted} fit={fit} />
      </Pressable>

      <Pressy onPress={() => setMuted(!muted)} style={[styles.sound, { top: insets.top + 16 }]} accessibilityLabel={muted ? strings.splash.soundOn : strings.splash.soundOff}>
        <AppText variant="captionStrong" color={colors.white}>
          {muted ? strings.splash.soundOn : strings.splash.soundOff}
        </AppText>
      </Pressy>

      <View pointerEvents="none" style={[styles.hintWrap, { bottom: insets.bottom + 20 }]}>
        <Animated.View style={[styles.hint, hintStyle]}>
          <AppText variant="label" color={colors.white}>
            {strings.splash.hint}
          </AppText>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const VIDEO_ASPECT = 9 / 16;

const styles = StyleSheet.create({
  backdropTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: colors.splashTop },
  backdropBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: colors.splashBottom },
  root: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 100, overflow: 'hidden', backgroundColor: colors.splash },
  sound: { position: 'absolute', right: 16, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(27,13,66,0.56)' },
  hintWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  hint: { paddingVertical: 9, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.33)', backgroundColor: 'rgba(33,16,74,0.6)' },
});
