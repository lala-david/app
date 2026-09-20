import { describe, expect, it } from 'vitest';

import { parseMessage, playerHtml, playerVars, stateFromCode, thumbnailUrl } from './youtubeEmbed';

describe('youtubeEmbed', () => {
  it('영상 하나는 videoId 로, 재생목록은 list 로 연다', () => {
    expect(playerVars({ videoId: 'abc' }, 'https://x').list).toBeUndefined();
    expect(playerVars({ playlistId: 'PL1' }, 'https://x')).toMatchObject({ listType: 'playlist', list: 'PL1' });
  });

  it('화면 안에서 재생하고 다른 채널 추천은 끈다', () => {
    expect(playerVars({ videoId: 'abc' }, 'https://x')).toMatchObject({ playsinline: 1, rel: 0, origin: 'https://x' });
  });

  it('유튜브 상태 번호를 읽는다', () => {
    expect(stateFromCode(1)).toBe('playing');
    expect(stateFromCode(2)).toBe('paused');
    expect(stateFromCode(0)).toBe('ended');
    expect(stateFromCode(-1)).toBeNull();
  });

  it('플레이어가 보낸 말을 해석하고, 모르는 말은 버린다', () => {
    expect(parseMessage('{"type":"ready"}')).toEqual({ type: 'state', state: 'ready' });
    expect(parseMessage('{"type":"state","code":1}')).toEqual({ type: 'state', state: 'playing' });
    expect(parseMessage('{"type":"error","code":150}')).toEqual({ type: 'error', code: 150 });
    expect(parseMessage('{"type":"state","code":-1}')).toBeNull();
    expect(parseMessage('not json')).toBeNull();
  });

  it('재생목록에는 미리보기 그림이 없다', () => {
    expect(thumbnailUrl({ videoId: 'abc' })).toContain('/abc/');
    expect(thumbnailUrl({ playlistId: 'PL1' })).toBeNull();
  });

  it('앱용 페이지에 영상과 유튜브 API 가 들어간다', () => {
    const html = playerHtml({ videoId: 'abc' });
    expect(html).toContain('"videoId":"abc"');
    expect(html).toContain('iframe_api');
  });
});
