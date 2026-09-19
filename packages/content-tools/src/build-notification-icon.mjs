// 병아리 캐릭터의 윤곽으로 단색 아이콘을 만든다.
//  - notification-icon.png : 안드로이드 상태 표시줄·알림의 작은 아이콘 (흰색 + 투명, 96px)
//  - android-icon-monochrome.png : 테마 아이콘용 단색 전경 (1024px, 안전 영역 안)
// 눈동자처럼 어두운 곳은 뚫어서 작은 크기에서도 얼굴로 읽히게 한다.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES = resolve(ROOT, '../../apps/mobile/assets/images');
const SOURCE = join(IMAGES, 'characters/chick.webp');
const DARK = 70;

const { data, info } = await sharp(SOURCE).trim().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const mask = Buffer.alloc(info.width * info.height * 4);
for (let i = 0; i < info.width * info.height; i += 1) {
  const [r, g, b, a] = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3]];
  const dark = (r + g + b) / 3 < DARK;
  mask.fill(255, i * 4, i * 4 + 3);
  mask[i * 4 + 3] = a > 120 && !dark ? 255 : 0;
}
const silhouette = await sharp(mask, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();

async function place(size, inner, file) {
  const art = await sharp(silhouette).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: art, gravity: 'center' }])
    .png()
    .toFile(join(IMAGES, file));
  console.log('wrote', file);
}

await place(96, 84, 'notification-icon.png');
await place(1024, 520, 'android-icon-monochrome.png');
