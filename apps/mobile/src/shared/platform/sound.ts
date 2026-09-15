import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioSource } from 'expo-audio';
import * as Speech from 'expo-speech';

import { isAudioUnlocked } from './audioUnlock';

const players = new Map<AudioSource, AudioPlayer>();
let current: AudioPlayer | null = null;

export async function initAudio(): Promise<void> {
  await setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
}

/** 짧은 소리 재생. 앞 소리를 끊고 새 소리를 낸다 */
export function playSound(source: AudioSource, { interrupt = true }: { interrupt?: boolean } = {}): void {
  if (!isAudioUnlocked()) return;
  try {
    let player = players.get(source);
    if (!player) {
      player = createAudioPlayer(source);
      players.set(source, player);
    }
    if (interrupt && current && current !== player) current.pause();
    player.seekTo(0);
    player.play();
    current = player;
  } catch {
    // 소리는 부가 기능이라 실패해도 흐름을 막지 않는다
  }
}

/** 파일이 없을 때 기기 음성으로 대체 */
export function speakText(text: string, language: string): void {
  if (!isAudioUnlocked()) return;
  Speech.stop();
  Speech.speak(text, { language, rate: 0.85 });
}

export function stopAllSounds(): void {
  current?.pause();
  Speech.stop();
}
