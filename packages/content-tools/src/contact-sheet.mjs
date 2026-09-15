// 생성된 그림을 그룹별 모아보기 한 장으로 만든다 (검수용)
import { readdir } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES = resolve(ROOT, '../../apps/mobile/assets/images');
const OUT = resolve(ROOT, '../../docs/assets/contact');
const CELL = 220, LABEL = 26, COLS = 6;

for (const group of ['words', 'mascot', 'stickers', 'routines', 'onboarding', 'guides', 'celebrate', 'frames', 'brand']) {
  const files = (await readdir(join(IMAGES, group))).filter((f) => f.endsWith('.png')).sort();
  const rows = Math.ceil(files.length / COLS);
  const tiles = await Promise.all(files.map(async (file, i) => {
    const img = await sharp(join(IMAGES, group, file)).resize(CELL - 10, CELL - 10, { fit: 'contain', background: '#E8E4DC' }).flatten({ background: '#E8E4DC' }).toBuffer();
    const label = Buffer.from(`<svg width="${CELL}" height="${LABEL}"><rect width="100%" height="100%" fill="#fff"/><text x="6" y="18" font-size="15" font-family="Arial">${file.replace('.png', '')}</text></svg>`);
    const x = (i % COLS) * CELL, y = Math.floor(i / COLS) * (CELL + LABEL);
    return [{ input: img, left: x + 5, top: y + 5 }, { input: label, left: x, top: y + CELL }];
  }));
  await sharp({ create: { width: COLS * CELL, height: rows * (CELL + LABEL), channels: 3, background: '#ffffff' } })
    .composite(tiles.flat()).jpeg({ quality: 82 }).toFile(join(OUT, `${group}.jpg`));
  console.log(group, files.length);
}
