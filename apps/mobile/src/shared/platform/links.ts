import { Linking, Platform } from 'react-native';

import appConfig from '@/content/app-config.json';
import type { VideoRef } from '@/entities/content/types';

export function youtubeUrl(video: VideoRef): string {
  if (video.videoId) return `${appConfig.links.youtubeWatch}${video.videoId}`;
  return `${appConfig.links.youtubePlaylist}${video.playlistId ?? ''}`;
}

/** 외부 링크 열기. 성공 여부를 돌려준다 */
export async function openExternal(url: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      const opened = window.open(url, '_blank', 'noopener');
      return opened !== null;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export function mailto(email: string, subject: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
