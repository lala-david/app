// 말하기 게임 ‘색깔 마법’의 그림을 준비한다.
//  1) Recraft로 만든 game/·scenes/ PNG → WebP
//  2) 색칠하기 전 모습: 이번 주 그림의 흑백판을 gray/ 에 만든다 (같은 윤곽이라 색이 입혀지는 연출이 가능하다)
import { mkdir, readFile, readdir, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP = resolve(ROOT, '../../apps/mobile');
const IMAGES = join(APP, 'assets/images');
const SCENE_WIDTH = 900;

for (const [group, width, quality] of [['game', 512, 84], ['icons', 320, 86], ['scenes', SCENE_WIDTH, 76]]) {
  const dir = join(IMAGES, group);
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.png'))) {
    const source = join(dir, file);
    await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality, alphaQuality: 90, effort: 5 }).toFile(source.replace(/\.png$/, '.webp'));
    await unlink(source);
    console.log('webp', group, file);
  }
}

const config = JSON.parse(await readFile(join(APP, 'src/content/app-config.json'), 'utf8'));
const week = JSON.parse(await readFile(join(APP, `src/content/weeks/week${config.currentWeek}.json`), 'utf8'));
const paintIds = [...new Set(week.activity.speakGame.rounds.map((r) => r.paint))];

await mkdir(join(IMAGES, 'gray'), { recursive: true });
for (const id of paintIds) {
  // 연필로 그린 밑그림처럼: 흑백으로 바꾸고 밝게 띄운다
  await sharp(join(IMAGES, 'words', `${id}.webp`)).grayscale().linear(0.55, 118).webp({ quality: 82, alphaQuality: 90 }).toFile(join(IMAGES, 'gray', `${id}.webp`));
  console.log('gray', id);
}
