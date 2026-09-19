import { useEffect, useRef, type CSSProperties } from 'react';
import { Image } from 'react-native';

import type { SplashVideoProps } from './SplashVideo.types';

const source = require('@/assets/video/splash.mp4');
const poster = require('@/assets/video/splash-poster.jpg');

const uriOf = (asset: unknown): string => (typeof asset === 'string' ? asset : ((asset as { uri?: string })?.uri ?? Image.resolveAssetSource?.(asset as number)?.uri ?? ''));

/** 폭에 맞춰 넣을 때 영상 위·아래 끝을 부드럽게 녹여 바탕색과의 이음매를 없앤다 */
const EDGE_FADE = 'linear-gradient(to bottom, transparent 0%, black 9%, black 91%, transparent 100%)';

const base: CSSProperties = { position: 'absolute', display: 'block', pointerEvents: 'none' };
const styles: Record<SplashVideoProps['fit'], CSSProperties> = {
  cover: { ...base, inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  contain: { ...base, left: 0, top: '50%', width: '100%', aspectRatio: '9 / 16', transform: 'translateY(-50%)', objectFit: 'cover', maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE },
};

/**
 * 웹은 브라우저의 자동재생 규칙을 그대로 따라야 한다: 태그에 muted·playsInline 이 있어야
 * 아이폰과 크롬이 소리 없는 자동재생을 허용한다. 그래서 표준 video 태그를 직접 쓴다.
 */
export function SplashVideo({ muted, fit }: SplashVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = muted;
    // 자동재생이 막힌 브라우저에서는 멈춘 첫 장면이 보이고, 소리 버튼을 누르면 다시 시도된다
    void video.play().catch(() => undefined);
  }, [muted]);

  return <video ref={ref} src={uriOf(source)} poster={uriOf(poster)} autoPlay muted playsInline preload="auto" style={styles[fit]} />;
}
