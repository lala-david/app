import { playSound, speakText } from '@/shared/platform/sound';

import { audioSource, sfx } from './assets';
import { config, getWord } from './content';

export type SfxName = keyof typeof sfx;

export function playSfx(name: SfxName): void {
  const source = sfx[name];
  if (source) playSound(source, { interrupt: false });
}

/** 캐릭터 대사. 음성 파일이 없으면 조용히 넘어간다 */
export function playMascot(line: string): void {
  const source = audioSource(`mascot/${line}`);
  if (source) playSound(source);
}

export function playWord(wordId: string): void {
  const word = getWord(wordId);
  const source = audioSource(word.audio);
  if (source) playSound(source);
  else speakText(word.id, config.speech.lang);
}

export function playSentence(audioKey: string, text: string): void {
  const source = audioSource(audioKey);
  if (source) playSound(source);
  else speakText(text, config.speech.lang);
}
