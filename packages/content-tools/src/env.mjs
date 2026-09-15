import { readFile } from 'node:fs/promises';

/** .env 파일을 읽어 process.env 위에 합친 객체를 돌려준다. */
export async function loadEnv(path) {
  const fromFile = {};
  try {
    const text = await readFile(path, 'utf8');
    for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match) fromFile[match[1]] = match[2];
    }
  } catch {
    // .env가 없으면 process.env만 사용
  }
  return { ...fromFile, ...process.env };
}
