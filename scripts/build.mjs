import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const outDir = 'dist';
const buildId = Date.now().toString(36);

try {
  await mkdir(outDir, { recursive: true });
  await copyFile(join('src', 'styles.css'), join(outDir, 'styles.css'));
  await copyFile(join('src', 'assets', 'body-outline.svg'), join(outDir, 'body-outline.svg'));
  await copyFile(join('src', 'assets', 'anatomy-model.svg'), join(outDir, 'anatomy-model.svg'));
  const anatomyAssets=['body-front.svg','body-back.svg','body-side.svg','scale-front.svg','head-front.svg','head-side.svg','neck-front.svg','neck-side.svg','torso-front.svg','torso-back.svg','torso-side.svg','upper-limb-front.svg','upper-limb-side.svg','hand-palm.svg','hand-side.svg','finger-detail.svg','lower-limb-front.svg','lower-limb-back.svg','lower-limb-side.svg','ankle-detail.svg','foot-top.svg','foot-side.svg'];
  for(const family of ['neutral','masculine','feminine']){const familyDir=join(outDir,'anatomy',family);await mkdir(familyDir,{recursive:true});for(const asset of anatomyAssets)await copyFile(join('src','assets','anatomy',family,asset),join(familyDir,asset));}

  const iconDir = join(outDir, 'assets', 'icons');
  await mkdir(iconDir, { recursive: true });
  for (const icon of ['icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'favicon-64.png']) {
    await copyFile(join('src', 'assets', 'icons', icon), join(iconDir, icon));
  }

  const manifest = await readFile(join('src', 'manifest.json'), 'utf8');
  await writeFile(join(outDir, 'manifest.json'), manifest.replaceAll('__BUILD_ID__', buildId));

  const html = await readFile('index.html', 'utf8');
  const productionHtml = html
    .replace('/src/main.ts', '/main.js')
    .replace('/src/main.tsx', '/main.js')
    .replaceAll('__BUILD_ID__', buildId);
  await writeFile(join(outDir, 'index.html'), productionHtml);
} catch (error) {
  console.error('Failed to prepare static build assets.');
  console.error(error);
  process.exitCode = 1;
}
