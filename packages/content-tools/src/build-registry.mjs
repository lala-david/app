// assets/images, assets/audio 폴더를 읽어 require() 등록 파일을 만든다.
// Metro는 동적 require를 못 하므로, 콘텐츠 JSON의 키("words/red")를 이 표로 실제 파일에 연결한다.
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, relative, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP = resolve(ROOT, '../../apps/mobile');
const OUT = join(APP, 'src/content/generated/assets.ts');

const IMAGE_GROUPS = ['characters', 'brand', 'words', 'gray', 'game', 'scenes', 'icons'];
const IMAGE_EXT = new Set(['.webp', '.png', '.jpg']);
const AUDIO_EXT = new Set(['.mp3', '.wav']);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])));
  return files.flat();
}

function toEntries(files, base, extensions) {
  return files
    .filter((f) => extensions.has(extname(f)))
    .map((f) => {
      const rel = relative(base, f).split('\\').join('/');
      return { key: rel.replace(/\.[^.]+$/, ''), path: `@/assets/${relative(join(APP, 'assets'), f).split('\\').join('/')}` };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

const imageBase = join(APP, 'assets/images');
const imageFiles = (await Promise.all(IMAGE_GROUPS.map((g) => walk(join(imageBase, g))))).flat();
const images = toEntries(imageFiles, imageBase, IMAGE_EXT);

const audioBase = join(APP, 'assets/audio');
const audio = toEntries(await walk(audioBase), audioBase, AUDIO_EXT);

const lines = (entries) => entries.map((e) => `  '${e.key}': require('${e.path}'),`).join('\n');
const source = `// 자동 생성 파일입니다. 직접 고치지 마세요.
// 다시 만들기: packages/content-tools 에서 npm run registry

export const imageAssets = {
${lines(images)}
} as const;

export const audioAssets = {
${lines(audio)}
} as const;

export type ImageKey = keyof typeof imageAssets;
export type AudioKey = keyof typeof audioAssets;
`;

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, source);
console.log(`registry: ${images.length} images, ${audio.length} audio -> ${relative(APP, OUT)}`);
