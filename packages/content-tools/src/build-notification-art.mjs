// 안드로이드 알림 오른쪽에 뜨는 큰 그림을 만든다: 루틴 색 바탕의 둥근 사각형 위에 캐릭터나 아이콘.
// 결과는 apps/mobile/assets/notifications/notif_<이름>.png — 빌드할 때 플러그인이 res/drawable 로 옮긴다.
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES = resolve(ROOT, '../../apps/mobile/assets/images');
const OUT = resolve(ROOT, '../../apps/mobile/assets/notifications');
const SIZE = 256;
const RADIUS = 72;

// 바탕색은 디자인 토큰의 루틴 파스텔과 같다
const ART = [
  { name: 'chick', source: 'characters/chick.webp', bg: '#FFF2A8', fill: 0.84 },
  { name: 'crocodile', source: 'characters/crocodile.webp', bg: '#BFEFE7', fill: 0.84 },
  { name: 'cat', source: 'characters/cat.webp', bg: '#FFD0D7', fill: 0.84 },
  { name: 'rabbit', source: 'characters/rabbit.webp', bg: '#EBC5FA', fill: 0.84 },
  { name: 'flame', source: 'icons/flame.webp', bg: '#FFE3D6', fill: 0.74 },
  { name: 'bell', source: 'icons/bell.webp', bg: '#DFF2ED', fill: 0.78 },
  { name: 'moon', source: 'icons/moon.webp', bg: '#E4DCF7', fill: 0.8 },
  { name: 'star', source: 'icons/star.webp', bg: '#FFF5C9', fill: 0.78 },
];

await mkdir(OUT, { recursive: true });
for (const art of ART) {
  const inner = Math.round(SIZE * art.fill);
  const picture = await sharp(join(IMAGES, art.source)).trim().resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  const plate = Buffer.from(`<svg width="${SIZE}" height="${SIZE}"><rect width="${SIZE}" height="${SIZE}" rx="${RADIUS}" fill="${art.bg}"/></svg>`);
  await sharp(plate).composite([{ input: picture, gravity: 'center' }]).png({ compressionLevel: 9 }).toFile(join(OUT, `notif_${art.name}.png`));
  console.log('wrote', `notif_${art.name}.png`);
}
