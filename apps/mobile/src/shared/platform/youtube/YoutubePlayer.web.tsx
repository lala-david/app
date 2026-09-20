import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { playerVars, stateFromCode, type YoutubePlayerProps } from './youtubeEmbed';

interface Player {
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
}

interface YoutubeApi {
  Player: new (
    element: HTMLElement,
    options: { width: string; height: string; videoId?: string; playerVars: Record<string, string | number>; events: Record<string, (event: { data: number }) => void> },
  ) => Player;
}

type ApiWindow = Window & { YT?: YoutubeApi; onYouTubeIframeAPIReady?: () => void };

const API_SRC = 'https://www.youtube.com/iframe_api';
let api: Promise<YoutubeApi> | null = null;

/** 유튜브 IFrame API 는 페이지에 한 번만 싣는다 */
function loadApi(): Promise<YoutubeApi> {
  api ??= new Promise((resolve) => {
    const host = window as ApiWindow;
    if (host.YT?.Player) return resolve(host.YT);
    host.onYouTubeIframeAPIReady = () => resolve(host.YT as YoutubeApi);
    const script = document.createElement('script');
    script.src = API_SRC;
    document.head.appendChild(script);
  });
  return api;
}

const fill: CSSProperties = { width: '100%', height: '100%', background: '#000' };

export function YoutubePlayer({ source, playing, onState, onError }: YoutubePlayerProps) {
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<Player | null>(null);
  const [ready, setReady] = useState(false);
  const handlers = useRef({ onState, onError });
  useEffect(() => {
    handlers.current = { onState, onError };
  });

  useEffect(() => {
    let cancelled = false;
    void loadApi().then((YT) => {
      if (cancelled || !holder.current) return;
      // API 가 넘겨받은 요소를 iframe 으로 바꿔치기하므로, React 가 관리하지 않는 요소를 만들어 넘긴다
      const mount = document.createElement('div');
      holder.current.appendChild(mount);
      player.current = new YT.Player(mount, {
        width: '100%',
        height: '100%',
        videoId: source.videoId,
        playerVars: playerVars(source, window.location.origin),
        events: {
          onReady: () => {
            setReady(true);
            handlers.current.onState('ready');
          },
          onStateChange: (event) => {
            const state = stateFromCode(event.data);
            if (state) handlers.current.onState(state);
          },
          onError: (event) => handlers.current.onError(event.data),
        },
      });
    });
    return () => {
      cancelled = true;
      player.current?.destroy();
      player.current = null;
      setReady(false);
    };
  }, [source]);

  useEffect(() => {
    if (!ready) return;
    if (playing) player.current?.playVideo();
    else player.current?.pauseVideo();
  }, [ready, playing]);

  return <div ref={holder} style={fill} />;
}
