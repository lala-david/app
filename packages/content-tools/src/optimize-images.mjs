// 앱에서 쓰는 그림 PNG를 WebP로 바꿔 용량을 줄인다. 원본 PNG는 삭제한다.
// 아이콘·스플래시(앱 설정에서 PNG 필요)는 건드리지 않는다.
import { readdir, unlink, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES = resolve(ROOT, '../../apps/mobile/assets/images');
const GROUPS = ['words', 'mascot', 'stickers', 'routines', 'onboarding', 'guides', 'celebrate', 'frames'];
const QUALITY = 82;

let before = 0;
let after = 0;
for (const group of GROUPS) {
  const dir = join(IMAGES, group);
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.png'))) {
    const source = join(dir, file);
    const target = source.replace(/\.png$/, '.webp');
    before += (await stat(source)).size;
    await sharp(source).webp({ quality: QUALITY, alphaQuality: 90, effort: 5 }).toFile(target);
    after += (await stat(target)).size;
    await unlink(source);
  }
}
console.log(`optimized: ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB`);
