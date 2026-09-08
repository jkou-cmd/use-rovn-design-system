import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapping = JSON.parse(await fs.readFile(path.join(root, 'design/paper/assets.json')));
const templates = {};
for (const name of (await fs.readdir(path.join(root, 'design/paper/selected'))).filter(n => n.endsWith('.jsx')).sort()) {
  let source = await fs.readFile(path.join(root, 'design/paper/selected', name), 'utf8');
  for (const [url, asset] of Object.entries(mapping)) source = source.replaceAll(url, '/' + asset.path);
  if (source.includes('https://app.paper.design/file-assets/')) throw new Error('Unmapped asset in ' + name);
  const { code } = await transform(source, { loader: 'jsx', jsxFactory: 'React.createElement' });
  const element = vm.runInNewContext(code, { React }, { timeout: 3000 });
  const dom = new JSDOM(renderToStaticMarkup(element));
  const page = dom.window.document.body.firstElementChild;
  function tag(node, p = '') {
    node.setAttribute('data-p', p);
    [...node.children].forEach((child, i) => tag(child, p ? `${p}.${i}` : `${i}`));
  }
  tag(page);
  templates[name.replace('.jsx', '')] = page.outerHTML;
}
await fs.mkdir(path.join(root, 'templates/report-v1'), { recursive: true });
await fs.writeFile(path.join(root, 'templates/report-v1/paper.json'), JSON.stringify(templates, null, 2) + '\n');
const files = ['design/paper/assets.json', 'templates/report-v1/paper.json', 'templates/report-v1/fonts.css', 'templates/report-v1/print.css', 'src/template-normalization.js', 'src/browser.js', 'src/icons.mjs', 'package-lock.json', 'licenses/lucide.txt'];
for (const directory of ['design/paper/selected', 'assets/paper']) for (const name of await fs.readdir(path.join(root, directory))) files.push(`${directory}/${name}`);
for (const asset of Object.values(mapping)) files.push(asset.path);
const css = await fs.readFile(path.join(root, 'templates/report-v1/fonts.css'), 'utf8');
for (const match of css.matchAll(/url\('\/(.*?)'\)/g)) files.push(match[1]);
const hashes = {};
for (const filename of [...new Set(files)].sort()) hashes[filename] = createHash('sha256').update(await fs.readFile(path.join(root, filename))).digest('hex');
await fs.writeFile(path.join(root, 'templates/report-v1/manifest.json'), JSON.stringify({ version: 'report-v1', source: 'https://app.paper.design/file/01M0CHJM5K1AGXGCG2NP449W97/8-0', hashes }, null, 2) + '\n');
console.log(`Built ${Object.keys(templates).length} local Paper templates.`);
