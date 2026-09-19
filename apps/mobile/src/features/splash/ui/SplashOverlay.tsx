import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/shared/i18n/strings.ko';
import { AppText } from '@/shared/ui/AppText';
import { Pressy } from '@/shared/ui/Pressy';
import { colors } from '@/shared/theme/tokens';

import { useSplash } from '../model/splashStore';

const splashVideo = require('@/assets/video/splash.mp4');

/** 시안 00: 인트로 영상 위에 ‘화면을 눌러 시작해요’. 소리는 꺼진 채로 시작한다 */
export function SplashOverlay() {
  const visible = useSplash((s) => s.visible);
  return visible ? <SplashContent /> : null;
}

function SplashContent() {
  const dismiss = useSplash((s) => s.dismiss);
  const insets = useSafeAreaInsets();
  const [muted, setMuted] = useState(true);
  const reduceMotion = useReducedMotion();
  const hint = useSharedValue(0);

  const player = useVideoPlayer(splashVideo, (p) => {
    p.muted = true;
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    if (reduceMotion) return;
    hint.value = withDelay(3600, withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [hint, reduceMotion]);

  const hintStyle = useAnimatedStyle(() => ({ opacity: 0.65 + 0.35 * hint.value, transform: [{ translateY: -3 * hint.value }] }));

  const toggleSound = () => {
    player.muted = !muted;
    setMuted(!muted);
    player.play();
  };

  return (
    <Animated.View exiting={FadeOut.duration(260)} style={styles.root}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityRole="button" accessibilityLabel={strings.splash.hint}>
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} pointerEvents="none" />
      </Pressable>

      <Pressy onPress={toggleSound} style={[styles.sound, { top: insets.top + 16 }]} accessibilityLabel={muted ? strings.splash.soundOn : strings.splash.soundOff}>
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

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 100, backgroundColor: colors.splash },
  sound: { position: 'absolute', right: 16, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(27,13,66,0.56)' },
  hintWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  hint: { paddingVertical: 9, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.33)', backgroundColor: 'rgba(33,16,74,0.6)' },
});
