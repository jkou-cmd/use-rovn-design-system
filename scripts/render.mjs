#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { loadInput } from '../src/input.mjs';
import { documentIcons } from '../src/icons.mjs';
import { root, localizeDocument, serve, inlineAssets } from '../src/runtime.mjs';

const args = process.argv.slice(2); const input = args.shift();
const options = {}; for (let i = 0; i < args.length; i++) {
  if (['--out', '--prepare', '--title', '--author', '--dark-pages'].includes(args[i])) {
    const key = args[i].slice(2); if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Missing value for ' + args[i]);
    options[key] = args[++i];
  }
  else if (args[i] === '--screenshots') options.screenshots = true;
  else throw new Error('Unknown argument: ' + args[i]);
}
if (!input) { console.log('Usage: npm run render -- document.md [--out output/pdf/document.pdf] [--prepare document.rovn.json] [--dark-pages on|off] [--screenshots]'); process.exit(0); }
let browser, server;
try {
  let doc = await loadInput(path.resolve(input));
  if (options.title) doc.metadata.title = options.title;
  if (options.author) doc.metadata.author = options.author;
  if (options['dark-pages'] != null) {
    if (!['on', 'off'].includes(options['dark-pages'])) throw new Error('--dark-pages must be on or off.');
    doc.options.darkPages = options['dark-pages'] === 'on';
  }
  if (options.prepare) { doc = await localizeDocument(doc, input); await fs.mkdir(path.dirname(path.resolve(options.prepare)), { recursive: true }); await fs.writeFile(options.prepare, JSON.stringify(doc, null, 2) + '\n'); console.log('Prepared ' + options.prepare); process.exit(0); }
  const out = path.resolve(options.out || path.join('output/pdf', path.basename(input).replace(/\.[^.]+$/, '') + '.pdf'));
  if (path.extname(out).toLowerCase() !== '.pdf') throw new Error('--out must end in .pdf');
  await fs.mkdir(path.dirname(out), { recursive: true });
  doc = await localizeDocument(doc, input);
  const templates = JSON.parse(await fs.readFile(path.join(root, 'templates/report-v1/paper.json'), 'utf8'));
  const fonts = await fs.readFile(path.join(root, 'templates/report-v1/fonts.css'), 'utf8');
  const print = await fs.readFile(path.join(root, 'templates/report-v1/print.css'), 'utf8');
  const iconLicense = await fs.readFile(path.join(root, 'licenses/lucide.txt'), 'utf8');
  const payload = JSON.stringify({ document: doc, templates, icons: documentIcons(doc) }).replaceAll('<', '\\u003c');
  server = await serve(`<!doctype html><html lang="en"><head><!-- Lucide icon license\n${iconLicense}\n--><meta charset="utf-8"><style>${fonts}\n${print}</style></head><body><script>window.ROVN=${payload}</script><script type="module" src="/src/browser.js"></script></body></html>`);
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`Asset ${response.status()}: ${response.url()}`); });
  await page.route('**/*', route => route.request().url().startsWith(server.url) || route.request().url().startsWith('data:') ? route.continue() : route.abort());
  await page.goto(server.url);
  await page.waitForFunction(() => window.ROVN_DONE || window.ROVN_ERROR, null, { timeout: 60000 });
  const failure = await page.evaluate(() => window.ROVN_ERROR); if (failure) throw new Error(failure);
  await page.evaluate(async () => {
    const urls = [...new Set([...document.querySelectorAll('*')].map(n => getComputedStyle(n).backgroundImage).flatMap(s => [...s.matchAll(/url\("?([^"()]+)"?\)/g)].map(m => m[1])))];
    await Promise.all(urls.map(url => new Promise((resolve, reject) => { const im = new Image(); im.onload = resolve; im.onerror = () => reject(new Error('Missing image ' + url)); im.src = url; })));
  });
  if (errors.length) throw new Error(errors.join('\n'));
  const report = await page.evaluate(() => window.ROVN_RESULT);
  report.chromiumVersion = browser.version();
  report.templateManifestHash = createHash('sha256').update(await fs.readFile(path.join(root, 'templates/report-v1/manifest.json'))).digest('hex');
  await page.evaluate(title => { document.title = title; document.querySelectorAll('script').forEach(n => n.remove()); }, doc.metadata.title);
  const html = await inlineAssets(await page.content());
  await fs.writeFile(out.replace(/\.pdf$/, '.html'), '<!doctype html>\n' + html.replace(/^<!DOCTYPE html>/i, ''));
  await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true, tagged: true, outline: true, displayHeaderFooter: false });
  if (options.screenshots) {
    const dir = out.replace(/\.pdf$/, '-pages'); await fs.mkdir(dir, { recursive: true });
    const all = page.locator('.page');
    for (let i = 0; i < await all.count(); i++) await all.nth(i).screenshot({ path: path.join(dir, `${String(i + 1).padStart(3, '0')}.png`) });
  }
  await fs.writeFile(out.replace(/\.pdf$/, '.qa.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ pdf: out, pages: report.pageCount, bodyPages: report.bodyPageCount, darkPages: report.darkBodyIndices.length, warnings: report.warnings }, null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await browser?.close(); await server?.close(); }
