// GitHub Pages는 모르는 경로에 404.html을 돌려준다. SPA 라우팅을 위해 index.html을 복사한다.
import { copyFile, writeFile } from 'node:fs/promises';

await copyFile('dist/index.html', 'dist/404.html');
await writeFile('dist/.nojekyll', '');
console.log('spa fallback: dist/404.html, dist/.nojekyll');
