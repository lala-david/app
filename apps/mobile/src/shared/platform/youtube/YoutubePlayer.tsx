import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { EMBED_ORIGIN, parseMessage, playerHtml, type YoutubePlayerProps } from './youtubeEmbed';

export type { YoutubePlayerHandle } from './youtubeEmbed';

const command = (playing: boolean) => `player && player.${playing ? 'playVideo' : 'pauseVideo'}(); true;`;

/** 앱에서는 WebView 안에 유튜브 플레이어를 띄운다 (웹은 YoutubePlayer.web.tsx) */
export function YoutubePlayer({ ref: handle, source, playing, onState, onError, onFullscreenDenied }: YoutubePlayerProps) {
  const ref = useRef<WebView>(null);
  useImperativeHandle(handle, () => ({ enterFullscreen: () => ref.current?.injectJavaScript('enterFullscreen(); true;') }), []);
  const [ready, setReady] = useState(false);
  const html = useMemo(() => playerHtml(source), [source]);

  useEffect(() => {
    if (ready) ref.current?.injectJavaScript(command(playing));
  }, [ready, playing]);

  const onMessage = (event: WebViewMessageEvent) => {
    const message = parseMessage(event.nativeEvent.data);
    if (!message) {
      // 플레이어 페이지 안에서 난 오류는 기기 로그에 남겨 둔다
      if (event.nativeEvent.data.includes('"log"')) console.warn('[youtube]', event.nativeEvent.data);
      return;
    }
    if (message.type === 'error') return onError(message.code);
    if (message.type === 'fullscreenDenied') return onFullscreenDenied?.();
    if (message.state === 'ready') setReady(true);
    onState(message.state);
  };

  return (
    <WebView
      ref={ref}
      source={{ html, baseUrl: EMBED_ORIGIN }}
      originWhitelist={['*']}
      onMessage={onMessage}
      onError={() => onError(0)}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      allowsFullscreenVideo
      mediaPlaybackRequiresUserAction={false}
      scrollEnabled={false}
      overScrollMode="never"
      setSupportMultipleWindows={false}
      style={styles.view}
    />
  );
}

const styles = StyleSheet.create({
  view: { flex: 1, backgroundColor: '#000' },
});
