// 마스코트 그림으로 앱 아이콘·파비콘·스플래시를 합성한다 (Recraft 크레딧 사용 없음).
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES = resolve(ROOT, '../../apps/mobile/assets/images');
const BRAND = { coral: '#FF7A59', cream: '#FFF8EA' };

const mascot = join(IMAGES, 'mascot', 'sori-idle.png');
const wave = join(IMAGES, 'mascot', 'sori-wave.png');

async function onBackground(source, size, scale, background, out, round = false) {
  const inner = Math.round(size * scale);
  const figure = await sharp(source).trim().resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  let canvas = sharp({ create: { width: size, height: size, channels: 4, background } }).composite([{ input: figure, gravity: 'center' }]);
  if (round) {
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`);
    canvas = sharp(await canvas.png().toBuffer()).composite([{ input: mask, blend: 'dest-in' }]);
  }
  await canvas.png().toFile(out);
  console.log('brand', out.replace(IMAGES, 'images'));
}

await mkdir(join(IMAGES, 'brand'), { recursive: true });
await onBackground(mascot, 1024, 0.78, BRAND.coral, join(IMAGES, 'icon.png'));
await onBackground(mascot, 1024, 0.62, { r: 0, g: 0, b: 0, alpha: 0 }, join(IMAGES, 'android-icon-foreground.png'));
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: BRAND.coral } }).png().toFile(join(IMAGES, 'android-icon-background.png'));
await sharp(join(IMAGES, 'android-icon-foreground.png')).threshold(250).negate({ alpha: false }).png().toFile(join(IMAGES, 'android-icon-monochrome.png'));
await onBackground(mascot, 196, 0.86, BRAND.coral, join(IMAGES, 'favicon.png'), true);
await onBackground(wave, 512, 1, { r: 0, g: 0, b: 0, alpha: 0 }, join(IMAGES, 'splash-icon.png'));
await onBackground(mascot, 512, 0.8, BRAND.coral, join(IMAGES, 'brand', 'pwa-512.png'));
await onBackground(mascot, 192, 0.8, BRAND.coral, join(IMAGES, 'brand', 'pwa-192.png'));
