import type { Ref } from 'react';

import appConfig from '@/content/app-config.json';

export interface YoutubeSource {
  videoId?: string;
  playlistId?: string;
}

export type PlayerState = 'ready' | 'playing' | 'paused' | 'buffering' | 'ended';

export type PlayerMessage = { type: 'state'; state: PlayerState } | { type: 'error'; code: number } | { type: 'fullscreenDenied' };

export interface YoutubePlayerHandle {
  enterFullscreen: () => void;
}

export interface YoutubePlayerProps {
  ref?: Ref<YoutubePlayerHandle>;
  source: YoutubeSource;
  /** 바깥에서 정하는 재생 여부. 플레이어 안에서 바뀐 것은 onState 로 알려 준다 */
  playing: boolean;
  onState: (state: PlayerState) => void;
  onError: (code: number) => void;
  /** 기기가 바깥 버튼으로는 전체 화면을 허락하지 않았다 (안드로이드 앱) */
  onFullscreenDenied?: () => void;
}

/** 유튜브는 어디에 끼워 넣었는지(출처)를 확인한다. 앱에는 주소가 없어서 배포한 웹 주소를 쓴다 */
export const EMBED_ORIGIN = appConfig.links.embedOrigin;

/** 유튜브 IFrame API 의 상태 번호 */
const STATES: Record<number, PlayerState> = { 0: 'ended', 1: 'playing', 2: 'paused', 3: 'buffering', 5: 'ready' };

export const stateFromCode = (code: number): PlayerState | null => STATES[code] ?? null;

/** 아이가 보는 화면이라 다른 채널 추천과 주석은 끄고, 화면 안에서 재생한다 */
export function playerVars(source: YoutubeSource, origin: string): Record<string, string | number> {
  const vars: Record<string, string | number> = { playsinline: 1, rel: 0, iv_load_policy: 3, modestbranding: 1, origin };
  if (!source.videoId && source.playlistId) return { ...vars, listType: 'playlist', list: source.playlistId };
  return vars;
}

export function thumbnailUrl(source: YoutubeSource): string | null {
  return source.videoId ? appConfig.links.youtubeThumbnail.replace('{id}', source.videoId) : null;
}

export function parseMessage(raw: string): PlayerMessage | null {
  try {
    const data = JSON.parse(raw) as { type?: string; code?: number };
    if (data.type === 'ready') return { type: 'state', state: 'ready' };
    if (data.type === 'fullscreenDenied') return { type: 'fullscreenDenied' };
    if (typeof data.code !== 'number') return null;
    if (data.type === 'error') return { type: 'error', code: data.code };
    const state = data.type === 'state' ? stateFromCode(data.code) : null;
    return state ? { type: 'state', state } : null;
  } catch {
    return null;
  }
}

/** 앱(WebView) 안에서 띄우는 플레이어 쪽. 상태를 앱으로 보내고, 앱은 player.playVideo() 같은 명령을 넣는다 */
export function playerHtml(source: YoutubeSource): string {
  const options = { width: '100%', height: '100%', videoId: source.videoId, playerVars: playerVars(source, EMBED_ORIGIN) };
  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<style>html,body,#player{margin:0;width:100%;height:100%;background:#000;overflow:hidden}</style>
</head>
<body>
<div id="player"></div>
<script>
var player;
function enterFullscreen(){var f=document.querySelector('iframe')||document.getElementById('player');var go=f.requestFullscreen||f.webkitRequestFullscreen;var denied=function(){send({type:'fullscreenDenied'});};if(!go)return denied();var asked=go.call(f);if(asked&&asked.catch)asked.catch(denied);}
window.onerror=function(m){send({type:'log',text:String(m)});};
function send(message){window.ReactNativeWebView.postMessage(JSON.stringify(message));}
function onYouTubeIframeAPIReady(){
  var options=${JSON.stringify(options)};
  options.events={
    onReady:function(){send({type:'ready'});},
    onStateChange:function(e){send({type:'state',code:e.data});},
    onError:function(e){send({type:'error',code:e.data});}
  };
  player=new YT.Player('player',options);
}
</script>
<script src="https://www.youtube.com/iframe_api" onerror="send({type:'error',code:0})"></script>
</body>
</html>`;
}
