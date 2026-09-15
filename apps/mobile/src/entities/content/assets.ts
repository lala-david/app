import { audioAssets, imageAssets } from '@/content/generated/assets';

/** 콘텐츠 JSON의 그림·소리 키("words/red")를 번들된 파일로 바꾼다 */
export function imageSource(key: string | undefined): number | undefined {
  if (!key) return undefined;
  return (imageAssets as Record<string, number>)[key];
}

export function audioSource(key: string | undefined): number | undefined {
  if (!key) return undefined;
  return (audioAssets as Record<string, number>)[key];
}

export const sfx = {
  correct: audioSource('sfx/correct'),
  wrong: audioSource('sfx/wrong'),
  star: audioSource('sfx/star'),
  tap: audioSource('sfx/tap'),
  sticker: audioSource('sfx/sticker'),
  timer: audioSource('sfx/timer'),
  fanfare: audioSource('sfx/fanfare'),
  hold: audioSource('sfx/hold'),
};
