import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/shared/theme/tokens';

import type { SplashVideoProps } from './SplashVideo.types';

const source = require('@/assets/video/splash.mp4');

/** 앱(iOS·Android)의 시작 영상. 웹은 SplashVideo.web.tsx */
export function SplashVideo({ muted, fit }: SplashVideoProps) {
  const player = useVideoPlayer(source, (p) => {
    p.muted = true;
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    player.muted = muted;
    player.play();
  }, [player, muted]);

  if (fit === 'cover') return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} surfaceType="textureView" pointerEvents="none" />;

  // 세로로 긴 폰: 폭에 맞춰 가운데 놓고, 위·아래 끝을 바탕색으로 녹인다
  return (
    <View style={styles.center} pointerEvents="none">
      <View style={styles.frame}>
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} surfaceType="textureView" />
        <LinearGradient colors={[colors.splashTop, 'rgba(65,35,105,0)']} style={[styles.edge, styles.edgeTop]} />
        <LinearGradient colors={['rgba(104,62,162,0)', colors.splashBottom]} style={[styles.edge, styles.edgeBottom]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'center' },
  frame: { width: '100%', aspectRatio: 9 / 16 },
  edge: { position: 'absolute', left: 0, right: 0, height: '9%' },
  edgeTop: { top: 0 },
  edgeBottom: { bottom: 0 },
});
