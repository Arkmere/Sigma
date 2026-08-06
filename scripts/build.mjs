import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const outDir = 'dist';

try {
  await mkdir(outDir, { recursive: true });
  await copyFile(join('src', 'styles.css'), join(outDir, 'styles.css'));
  await copyFile(join('src', 'assets', 'body-outline.svg'), join(outDir, 'body-outline.svg'));
  await copyFile(join('src', 'assets', 'anatomy-model.svg'), join(outDir, 'anatomy-model.svg'));
  const anatomyDir=join(outDir,'anatomy','masculine');
  await mkdir(anatomyDir,{recursive:true});
  for(const asset of ['body-front.svg','body-back.svg','body-side.svg'])await copyFile(join('src','assets','anatomy','masculine',asset),join(anatomyDir,asset));
  const feminineDir=join(outDir,'anatomy','feminine');
  await mkdir(feminineDir,{recursive:true});
  for(const asset of ['body-front.svg','body-back.svg','body-side.svg','head-front.svg','head-side.svg'])await copyFile(join('src','assets','anatomy','feminine',asset),join(feminineDir,asset));
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
