import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

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

  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit={fit} nativeControls={false} pointerEvents="none" />;
}
