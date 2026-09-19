// Recraft로 assets.manifest.json의 그림을 생성한다. 이미 있는 파일은 건너뛴다.
//   node src/generate-images.mjs                 전체
//   node src/generate-images.mjs --group words   그룹 하나
//   node src/generate-images.mjs --force         덮어쓰기
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { loadEnv } from './env.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://external.api.recraft.ai/v1';
const CONCURRENCY = 3;
const RETRIES = 3;

const args = process.argv.slice(2);
const onlyGroup = args.includes('--group') ? args[args.indexOf('--group') + 1] : null;
const force = args.includes('--force');

const env = await loadEnv(resolve(ROOT, '../../.env'));
const apiKey = env.RECRAFT_API_KEY;
if (!apiKey) throw new Error('RECRAFT_API_KEY is missing in .env');

const manifest = JSON.parse(await readFile(join(ROOT, 'assets.manifest.json'), 'utf8'));
const outputRoot = resolve(ROOT, manifest.outputRoot);

const exists = (p) => access(p).then(() => true, () => false);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(label, fn) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= RETRIES) throw err;
      console.warn(`  retry ${attempt} ${label}: ${err.message}`);
      await sleep(2000 * attempt);
    }
  }
}

async function generate(prompt, size) {
  const body = {
    prompt,
    style: manifest.style,
    size,
    n: 1,
    response_format: 'url',
    ...(manifest.model && { model: manifest.model }),
    ...(manifest.negativePrompt && { negative_prompt: manifest.negativePrompt }),
  };
  const res = await fetch(`${API}/images/generations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`generate ${res.status} ${await res.text()}`);
  const { data } = await res.json();
  return download(data[0].url);
}

async function removeBackground(buffer) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'image/png' }), 'image.png');
  form.append('response_format', 'url');
  const res = await fetch(`${API}/images/removeBackground`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) throw new Error(`removeBackground ${res.status} ${await res.text()}`);
  const { image } = await res.json();
  return download(image.url);
}

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function buildPrompt(group, item) {
  const subject = group.useMascot ? `${manifest.mascotPrompt}, ${item.prompt}` : item.prompt;
  return `${subject}. ${group.stylePrompt ?? manifest.stylePrompt}`;
}

async function produce(group, item) {
  const out = join(outputRoot, group.name, `${item.id}.png`);
  // 앱에 넣을 때 WebP로 바꾸고 PNG는 지우므로, WebP가 있어도 이미 만든 것으로 본다
  if (!force && ((await exists(out)) || (await exists(out.replace(/\.png$/, '.webp'))))) return { id: item.id, skipped: true };

  let image = await withRetry(`${group.name}/${item.id}`, () => generate(buildPrompt(group, item), group.size));
  if (group.removeBackground) {
    image = await withRetry(`${group.name}/${item.id} bg`, () => removeBackground(image));
  }
  const resized = await sharp(image)
    .resize(group.resize, group.resize, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, resized);
  return { id: item.id, bytes: resized.length };
}

async function runPool(tasks) {
  const results = [];
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const task = tasks[next++];
      try {
        const r = await task.run();
        console.log(r.skipped ? `  skip ${task.label}` : `  done ${task.label} (${Math.round(r.bytes / 1024)}KB)`);
        results.push({ ...r, ok: true });
      } catch (err) {
        console.error(`  FAIL ${task.label}: ${err.message}`);
        results.push({ id: task.label, ok: false, error: err.message });
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return results;
}

const groups = manifest.groups.filter((g) => !onlyGroup || g.name === onlyGroup);
const tasks = groups.flatMap((group) =>
  group.items.map((item) => ({ label: `${group.name}/${item.id}`, run: () => produce(group, item) })),
);

console.log(`Generating ${tasks.length} images → ${outputRoot}`);
const results = await runPool(tasks);
const failed = results.filter((r) => !r.ok);
console.log(`\nfinished: ${results.length - failed.length} ok, ${failed.length} failed`);
if (failed.length) process.exitCode = 1;
