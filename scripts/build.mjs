import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const outDir = 'dist';

try {
  await mkdir(outDir, { recursive: true });
  await copyFile(join('src', 'styles.css'), join(outDir, 'styles.css'));
  const html = await readFile('index.html', 'utf8');
  const productionHtml = html
    .replace('/src/main.ts', '/main.js')
    .replace('/src/main.tsx', '/main.js');
  await writeFile(join(outDir, 'index.html'), productionHtml);
} catch (error) {
  console.error('Failed to prepare static build assets.');
  console.error(error);
  process.exitCode = 1;
}
