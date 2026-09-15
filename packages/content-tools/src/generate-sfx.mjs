// 효과음을 코드로 합성해 WAV로 저장한다 (라이선스 걱정 없음).
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, '../../apps/mobile/assets/audio/sfx');
const RATE = 22050;

const NOTE = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568, C4: 261.63, G4: 392, E4: 329.63 };

/** 음 하나: 주파수, 시작(초), 길이(초), 음량, 파형 */
const tone = (freq, start, length, volume = 0.5, wave = 'sine') => ({ freq, start, length, volume, wave });

const SOUNDS = {
  correct: [tone(NOTE.E5, 0, 0.12, 0.45), tone(NOTE.C6, 0.1, 0.22, 0.45)],
  wrong: [tone(NOTE.G4, 0, 0.16, 0.35, 'triangle'), tone(NOTE.E4, 0.14, 0.24, 0.3, 'triangle')],
  star: [tone(NOTE.C6, 0, 0.08, 0.3), tone(NOTE.E6, 0.06, 0.08, 0.3), tone(NOTE.G6, 0.12, 0.18, 0.3)],
  tap: [tone(NOTE.A5, 0, 0.04, 0.25, 'triangle')],
  sticker: [tone(NOTE.G5, 0, 0.06, 0.4, 'square'), tone(NOTE.C6, 0.05, 0.14, 0.35)],
  timer: [tone(NOTE.C6, 0, 0.5, 0.35), tone(NOTE.G5, 0.25, 0.6, 0.3), tone(NOTE.E5, 0.5, 0.8, 0.28)],
  fanfare: [
    tone(NOTE.C5, 0, 0.14, 0.4, 'triangle'),
    tone(NOTE.E5, 0.14, 0.14, 0.4, 'triangle'),
    tone(NOTE.G5, 0.28, 0.14, 0.4, 'triangle'),
    tone(NOTE.C6, 0.42, 0.5, 0.45, 'triangle'),
    tone(NOTE.E6, 0.42, 0.5, 0.2),
  ],
  hold: [tone(NOTE.C5, 0, 0.1, 0.3), tone(NOTE.G5, 0.08, 0.16, 0.3)],
};

function oscillator(wave, phase) {
  switch (wave) {
    case 'square':
      return Math.sin(phase) >= 0 ? 0.6 : -0.6;
    case 'triangle':
      return (2 / Math.PI) * Math.asin(Math.sin(phase));
    default:
      return Math.sin(phase);
  }
}

function render(notes) {
  const seconds = Math.max(...notes.map((n) => n.start + n.length)) + 0.05;
  const samples = new Float32Array(Math.ceil(seconds * RATE));
  for (const note of notes) {
    const from = Math.floor(note.start * RATE);
    const count = Math.floor(note.length * RATE);
    for (let i = 0; i < count; i++) {
      const t = i / RATE;
      const attack = Math.min(1, t / 0.01);
      const release = Math.pow(1 - i / count, 2);
      samples[from + i] += oscillator(note.wave, 2 * Math.PI * note.freq * t) * note.volume * attack * release;
    }
  }
  return samples;
}

function toWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

await mkdir(OUT, { recursive: true });
for (const [name, notes] of Object.entries(SOUNDS)) {
  await writeFile(join(OUT, `${name}.wav`), toWav(render(notes)));
  console.log('sfx', name);
}
