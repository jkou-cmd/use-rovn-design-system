import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { root, serve } from '../src/runtime.mjs';
const templates = JSON.parse(await fs.readFile(path.join(root, 'templates/report-v1/paper.json')));
const fonts = await fs.readFile(path.join(root, 'templates/report-v1/fonts.css'), 'utf8');
const dir = path.join(root, 'tmp/reference-render'); await fs.mkdir(dir, { recursive: true });
const server = await serve('<html><body></body></html>');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 1 });
  await page.goto(server.url);
  for (const [id, html] of Object.entries(templates)) {
    await page.setContent(`<html><head><style>${fonts}body{margin:0}</style></head><body>${html}</body></html>`);
    await page.evaluate(async id => {
      const { normalizeTemplate } = await import('/src/template-normalization.js');
      normalizeTemplate(document.body.firstElementChild, id);
      await document.fonts.ready;
      const urls = [...new Set([...document.querySelectorAll('*')].flatMap(n => [...getComputedStyle(n).backgroundImage.matchAll(/url\("?([^"()]+)"?\)/g)].map(m => m[1])))];
      await Promise.all(urls.map(url => new Promise((resolve, reject) => { const im = new Image(); im.onload = resolve; im.onerror = reject; im.src = url; })));
    }, id);
    await page.screenshot({ path: path.join(dir, `${id}.png`) });
  }
  console.log(`Rendered ${Object.keys(templates).length} reference pages to ${dir}`);
} finally { await browser.close(); await server.close(); }
