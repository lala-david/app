import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { EMBED_ORIGIN, parseMessage, playerHtml, type YoutubePlayerProps } from './youtubeEmbed';

const command = (playing: boolean) => `player && player.${playing ? 'playVideo' : 'pauseVideo'}(); true;`;

/** 앱에서는 WebView 안에 유튜브 플레이어를 띄운다 (웹은 YoutubePlayer.web.tsx) */
export function YoutubePlayer({ source, playing, onState, onError }: YoutubePlayerProps) {
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const html = useMemo(() => playerHtml(source), [source]);

  useEffect(() => {
    if (ready) ref.current?.injectJavaScript(command(playing));
  }, [ready, playing]);

  const onMessage = (event: WebViewMessageEvent) => {
    const message = parseMessage(event.nativeEvent.data);
    if (!message) return;
    if (message.type === 'error') return onError(message.code);
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
