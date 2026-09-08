import { normalizeTemplate, symbol } from "./template-normalization.js";
/* Report v1. Components are cloned from Paper exports, not recreated from screenshots. */
const payload = window.ROVN;
const templates = new Map();
for (const [id, html] of Object.entries(payload.templates)) {
  const t = document.createElement('template'); t.innerHTML = html;
  const node = t.content.firstElementChild;
  normalizeTemplate(node, id);
  templates.set(id, node);
}
const doc = payload.document;
const themePairs = { 'TTI-0': 'P5W-0', 'U0I-0': 'QDS-0', 'TW7-0': 'PVO-0', 'UBS-0': 'RO3-0', 'U4R-0': 'S28-0', 'U9A-0': 'SEW-0', 'TZ3-0': 'QRC-0' };
const find = (el, p) => el.dataset.p === p ? el : el.querySelector(`[data-p="${p}"]`);
function clone(id, p = '', dark = false) {
  const base = templates.get(dark ? themePairs[id] || id : id);
  const el = find(base, p); if (!el) throw new Error(`Missing template component ${id}/${p}`);
  const result = el.cloneNode(true);
  for (const n of [result, ...result.querySelectorAll('[data-p]')]) n.dataset.source = id;
  return result;
}
function at(el, p, value, html = false) { const n = find(el, p); if (!n) throw new Error(`Missing slot ${p}`); n[html ? 'innerHTML' : 'textContent'] = value ?? ''; return n; }
function flex(el, styles = {}) { Object.assign(el.style, { minWidth: '0', minHeight: '0', ...styles }); return el; }
function flow(el, html, key) { el.innerHTML = html ?? ''; el.dataset.flow = key; flex(el, { height: 'auto', width: 'auto' }); return el; }
function textLeaves(el) { return [...el.querySelectorAll('div')].filter(n => n.style.fontSize && !n.querySelector('div,svg')); }
function margin(row, value = '') { if (row.firstElementChild) { const n = textLeaves(row.firstElementChild)[0]; if (n) n.textContent = value; else row.firstElementChild.textContent = value; } }
function autoHeight(row) { row.style.height = 'auto'; row.style.flexShrink = '0'; row.style.width = '816px'; return row; }
function bodyRow(dark, html, key, note) {
  const row = autoHeight(clone('TTI-0', '2.1.1', dark)); margin(row, note);
  flow(find(row, '2.1.1.1.0'), html, key); return row;
}
function localImage(image, src, contain = false) {
  if (src && typeof src === 'object') src = src.src;
  image.style.backgroundImage = `url("${src}")`; image.style.backgroundSize = contain ? 'contain' : 'cover'; image.style.backgroundRepeat = 'no-repeat';
  image.dataset.image = src; image.setAttribute('role', 'img');
}
function makeBlock(block, dark = false, nested = false) {
  let el;
  const key = block.id;
  switch (block.type) {
    case 'paragraph': el = bodyRow(dark, block.html, key, block.note); break;
    case 'lead': {
      el = autoHeight(clone('TTI-0', '2.0', dark)); flow(find(el, '2.0.1.0.1.0'), block.html, key); find(el, '2.0.1.0.1.0').style.width = '75%'; break;
    }
    case 'heading': {
      el = autoHeight(clone('TTI-0', '2.1.0', dark)); at(el, '2.1.0.0.0', block.number || '');
      const title = at(el, '2.1.0.1.0', block.text);
      if ((block.level || 1) > 1) {
        const style = clone('U9A-0', '1.0.1.0.2', dark).style.cssText; title.style.cssText = style;
      }
      el.dataset.heading = key; title.setAttribute('role', 'heading'); title.setAttribute('aria-level', Math.min(6, (block.level || 1) + 1)); break;
    }
    case 'list-item': {
      el = autoHeight(clone('TTI-0', '2.2.3', dark)); const line = find(el, '2.2.3.1.0');
      line.style.paddingLeft = `${8 + (block.depth || 0) * 16}px`;
      const marker = at(el, '2.2.3.1.0.0', block.marker || '•'); symbol(marker, block.marker, dark); flow(find(el, '2.2.3.1.0.1'), block.html, key); break;
    }
    case 'callout': {
      const p = '2.1.' + (block.variant + 1); el = autoHeight(clone('TW7-0', p, dark));
      // The amber sample accidentally adds a second left gutter; use the shared grid.
      el.style.paddingLeft = '0'; margin(el, block.note);
      const leaves = textLeaves(el.lastElementChild); const body = leaves.at(-1), title = leaves.at(-2);
      title.textContent = block.title || ''; if (!block.title) title.remove();
      const icon = el.querySelector('svg');
      if (icon && block.icon === 'none') { icon.style.visibility = 'hidden'; icon.parentElement.style.visibility = 'hidden'; }
      else if (icon && block.icon) {
        const source = payload.icons[block.icon]; if (!source) throw new Error('Missing Lucide icon ' + block.icon);
        const template = document.createElement('template'); template.innerHTML = source;
        const svg = template.content.querySelector('svg');
        icon.style.color = icon.querySelector('[stroke]').getAttribute('stroke');
        for (const attribute of ['viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']) icon.setAttribute(attribute, svg.getAttribute(attribute));
        icon.replaceChildren(...svg.children); icon.dataset.lucide = block.icon;
        icon.setAttribute('aria-hidden', 'true');
      }
      flow(body, block.html, key); break;
    }
    case 'cards': {
      const ruled = block.variant.startsWith('ruled'); const icons = block.variant.endsWith('icons');
      const id = ruled ? 'U4R-0' : 'UBS-0';
      const p = ruled ? (icons ? (block.items.length === 2 ? '1.0.7' : '1.0.3') : (block.items.length === 2 ? '1.0.5' : '1.0.1')) : (icons ? (block.items.length === 2 ? '1.0.8' : '1.0.4') : (block.items.length === 2 ? '1.0.6' : '1.0.2'));
      el = autoHeight(clone(id, p, dark)); margin(el, block.note);
      const cards = [...el.lastElementChild.children];
      cards.forEach((card, i) => {
        flex(card, { flex: '1 1 0', width: '0', alignSelf: 'stretch' });
        const leaves = textLeaves(card), title = leaves.at(-2), body = leaves.at(-1);
        title.textContent = block.items[i].title || ''; if (!icons && leaves[0] !== title) leaves[0].textContent = String(i + 1);
        flow(body, block.items[i].html, `${key}.${i}`);
      }); break;
    }
    case 'table': {
      const p = block.variant === 2 ? '1.2.3' : '1.2.2'; el = autoHeight(clone('U0I-0', p, dark)); margin(el, block.note);
      const table = el.lastElementChild.firstElementChild;
      const head = table.firstElementChild.cloneNode(true);
      const sampleBody = block.variant === 2 ? table.children[2] : table.children[1].firstElementChild;
      const rowStyle = sampleBody.cloneNode(true); table.replaceChildren();
      const widths = block.widths || (block.headers.length === 3 ? [72, 420, 112] : block.headers.map(() => 1));
      const makeRow = (values, header, rowIndex) => {
        const r = (header ? head : rowStyle).cloneNode(true), cells = [...r.children]; r.replaceChildren();
        values.forEach((html, i) => {
          const cell = cells[Math.min(i, cells.length - 1)].cloneNode(false);
          flex(cell, { width: '0', flex: `${widths[i]} 1 0` });
          if (header) cell.innerHTML = html; else flow(cell, html, `${key}.r${rowIndex}.c${i}`);
          r.append(cell);
        });
        r.dataset.tableRow = header ? 'head' : String(rowIndex); return r;
      };
      table.append(makeRow(block.headers, true, -1));
      if (block.variant === 2) table.append(clone('U0I-0', '1.2.3.1.0.1', dark));
      block.rows.forEach((r, i) => table.append(makeRow(r, false, (block.rowOffset || 0) + i)));
      table.setAttribute('role', 'table'); break;
    }
    case 'code': {
      el = autoHeight(clone('U0I-0', '1.4.2', dark)); margin(el, block.note);
      const body = textLeaves(el.lastElementChild).at(-1); body.textContent = block.text; body.dataset.flow = key; body.dataset.literal = 'true';
      flex(body, { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', height: 'auto', width: 'auto', tabSize: '4' }); break;
    }
    case 'image': {
      el = bodyRow(dark, '', key); const content = el.lastElementChild; content.replaceChildren();
      const image = document.createElement('img'); image.src = block.src; image.alt = block.alt || ''; image.dataset.image = block.src;
      Object.assign(image.style, { width: '100%', height: `${Math.min(block.height || 330, 540)}px`, objectFit: block.decorative || block.crop ? 'cover' : 'contain', borderRadius: '12px', display: 'block' });
      content.append(image);
      if (block.caption) { const caption = clone('U9A-0', '1.1.1.1.1.1', dark); flow(caption, block.caption, key + '.caption'); content.append(caption); }
      break;
    }
    case 'image-band': {
      el = autoHeight(clone('TZ3-0', '2.1', dark)); margin(el, block.caption);
      el.style.height = clone('TZ3-0', '2.1').style.height;
      const imgs = [...el.querySelectorAll('div')].filter(n => n.style.backgroundImage);
      localImage(imgs[0], block.src, !block.decorative && !block.crop); imgs[0].setAttribute('aria-label', block.alt || '');
      localImage(imgs[1], block.amberSrc || '/assets/bg2.png'); break;
    }
    case 'image-column': {
      el = autoHeight(clone('U9A-0', '1.0', dark)); margin(el, block.note);
      const main = el.lastElementChild, left = main.children[0], right = main.children[1];
      flex(left, { width: '329px', flex: '0 0 329px' }); left.replaceChildren();
      block.blocks.forEach(b => { const child = makeBlock(b, dark, true); left.append(child); });
      flex(right, { width: '259px', flex: '0 0 259px' });
      const imageStack = right.firstElementChild, captions = right.lastElementChild;
      imageStack.replaceChildren(); captions.replaceChildren();
      block.images.forEach((item, i) => {
        const img = document.createElement('img'); img.src = item.src; img.alt = item.alt || ''; img.dataset.image = item.src;
        Object.assign(img.style, { width: '259px', height: `${item.height || (block.images.length === 1 ? 330 : 166)}px`, objectFit: item.decorative || item.crop ? 'cover' : 'contain', borderRadius: '12px', flexShrink: '0' });
        imageStack.append(img);
        if (item.caption) { const cap = clone('U9A-0', '1.0.1.1.1.0', dark); flow(cap, item.caption, `${key}.caption${i}`); captions.append(cap); }
      }); break;
    }
    case 'rule': el = clone('SHE-0', '2.1.0'); break;
    case 'source': {
      el = autoHeight(clone('OR2-0', '2.1.1'));
      at(el, '2.1.1.0.0.0', String(block.index + 1).padStart(2, '0'));
      const title = at(el, '2.1.1.0.1.0', [block.title, block.item].filter(Boolean).join('\n'));
      title.dataset.flow = key + '.title';
      const url = at(el, '2.1.1.0.1.1', '');
      if (block.url) { const a = document.createElement('a'); a.href = block.url; a.textContent = block.label || block.url; url.append(a); url.style.maxWidth = '240px'; url.style.overflowWrap = 'anywhere'; }
      flow(find(el, '2.1.1.1.1.0'), block.description || '', key + '.description'); break;
    }
    default: throw new Error('Unsupported block ' + block.type);
  }
  el.dataset.block = key; el.dataset.type = block.type;
  el.style.flexShrink = '0'; el.style.minWidth = '0';
  if (nested) {
    if (el.children.length === 2 && el.firstElementChild.style.width === '116px') {
      const inner = el.lastElementChild; inner.style.width = '100%'; inner.style.paddingInline = '0'; el.firstElementChild.remove();
    }
    el.style.width = '100%';
  }
  return el;
}

function updateFooter(footer) {
  for (const el of textLeaves(footer)) {
    const val = el.textContent;
    if (val === 'Name of the artifact') el.textContent = doc.metadata.title;
    if (val === 'Version 1') el.textContent = `Version ${doc.metadata.version}`;
    if (val === 'Sep 7 2026') el.textContent = doc.metadata.date;
    if (val === 'Jerry Kou') el.textContent = doc.metadata.author || '';
  }
}
const pages = [];
const expectedFlows = new Map();
const literalFlows = new Set();
function rememberFlows(el) {
  for (const field of el.querySelectorAll('[data-flow]')) {
    const key = field.dataset.flow;
    if (expectedFlows.has(key)) throw new Error('Duplicate content field ' + key);
    expectedFlows.set(key, field.textContent);
    if (field.dataset.literal) literalFlows.add(key);
  }
}
function newPage(kind, section, opener = false, dark = false) {
  const template = kind === 'toc' ? 'SHE-0' : kind === 'appendix' && opener ? 'OR2-0' : opener ? 'TTI-0' : 'U9A-0';
  const el = clone(template, '', dark); el.classList.add('page'); el.dataset.kind = kind;
  if (section) { el.dataset.section = section.id; el.dataset.opener = String(opener); }
  const header = el.firstElementChild;
  let top = opener || kind === 'toc' ? 368 : 80;
  if (kind === 'appendix' && opener) top = 358;
  const footer = clone('TTI-0', '3', dark); updateFooter(footer); footer.classList.add('footer');
  const content = document.createElement('div'); content.className = 'page-content';
  Object.assign(content.style, { top: `${top}px`, bottom: '64px' });
  el.replaceChildren(header, content, footer);
  if (kind === 'body') {
    const prefix = opener ? '0.0' : '0';
    at(header, prefix + '.1.0.0', section.letter); at(header, prefix + '.1.0.1', section.title);
    if (opener) {
      at(header, '0.1.0.0', section.letter); at(header, '0.1.0.1', section.title);
      localImage(header, section.headerImage || ['/assets/bg2.png', '/assets/bg1.png', '/assets/bg3.png', '/assets/bg4.png'][pages.filter(p => p.kind === 'body' && p.opener).length % 4]);
      el.id = section.id;
    }
  } else if (kind === 'appendix' && !opener) {
    at(header, '0.1.0.0', ''); at(header, '0.1.0.1', 'Appendix');
  }
  el.dataset.theme = dark ? 'dark' : 'light';
  const p = { el, content, footer, header, kind, section, opener, dark, notes: [] };
  document.body.append(el); pages.push(p); return p;
}

function buildCover() {
  const el = clone('OC9-0'); el.classList.add('page', 'cover'); el.dataset.kind = 'cover';
  localImage(el, doc.metadata.coverImage || '/assets/bg3.png');
  at(el, '1.1.0', doc.metadata.eyebrow || ''); at(el, '3.1.0', doc.metadata.title);
  at(el, '3.1.1', doc.metadata.subtitle || '');
  at(el, '3.0.0', ''); at(el, '4.0.0.0', '');
  at(el, '4.0.1.0.1', doc.metadata.version); at(el, '4.0.1.1.1', doc.metadata.date); at(el, '4.0.1.2.1', doc.metadata.author || '');
  if (!doc.metadata.author) find(el, '4.0.1.2').style.visibility = 'hidden';
  at(el, '4.1.1.0', doc.metadata.summary || ''); at(el, '4.2.1.0', doc.metadata.smallPrint || '');
  // Preserve the designed cover composition even when optional text is absent.
  find(el, '4').style.minHeight = '224px'; find(el, '4').style.flexShrink = '0';
  if (!doc.metadata.summary) find(el, '4.1').style.minHeight = '76px';
  if (!doc.metadata.smallPrint) find(el, '4.2').style.minHeight = '48px';
  document.body.append(el); pages.push({ el, kind: 'cover' });
}
function footnoteStrip(p) {
  p.el.querySelector('.footnotes-strip')?.remove();
  const keys = [...new Set([...p.content.querySelectorAll('[data-note]')].map(n => n.dataset.note))];
  for (const key of keys) if (!doc.footnotes[key]) throw new Error(`Missing footnote ${key}`);
  if (!keys.length) { p.content.style.bottom = '64px'; p.notes = []; return; }
  const columns = keys.length === 2 ? 2 : 3;
  const strip = clone(columns === 2 ? 'U4R-0' : 'U0I-0', '2.0', p.dark); strip.classList.add('footnotes-strip');
  const main = strip.lastElementChild, row = main.lastElementChild, sample = row.firstElementChild.cloneNode(true);
  row.replaceChildren(); row.style.flexWrap = 'wrap';
  keys.forEach(key => {
    const note = sample.cloneNode(true); flex(note, { flex: `0 0 calc((100% - ${(columns - 1) * 20}px) / ${columns})` });
    const leaves = textLeaves(note); leaves[0].textContent = key; leaves.at(-1).innerHTML = doc.footnotes[key];
    note.dataset.noteDefinition = key; row.append(note);
  });
  p.el.append(strip); const h = strip.getBoundingClientRect().height;
  p.content.style.bottom = `${64 + h}px`; p.notes = keys;
}
function fits(p) { footnoteStrip(p); return p.content.scrollHeight <= p.content.clientHeight + 0.5; }
function append(p, el, gap = 16) {
  el.style.marginTop = p.content.children.length ? `${gap}px` : '0'; p.content.append(el);
}

function splitFlow(el, limit) {
  // Split rich text at actual browser line positions, preserving inline links and emphasis.
  const head = el.cloneNode(true), tail = el.cloneNode(true); let headChars = 0, tailChars = 0;
  const fields = [...el.querySelectorAll('[data-flow]')];
  if (el.hasAttribute('data-flow')) fields.unshift(el);
  for (const field of fields) {
    const key = field.dataset.flow;
    const a = head.querySelector(`[data-flow="${key}"]`), b = tail.querySelector(`[data-flow="${key}"]`);
    if (!a || !b) continue;
    const walker = document.createTreeWalker(field, NodeFilter.SHOW_TEXT); let n; const nodes = []; let total = 0;
    while ((n = walker.nextNode())) { nodes.push({ node: n, start: total }); total += n.length; }
    const range = document.createRange(); let cut = 0;
    for (const { node, start } of nodes) {
      for (const match of node.textContent.matchAll(/\S+\s*|\s+/g)) {
        const end = match.index + match[0].length; range.setStart(node, match.index); range.setEnd(node, end);
        const rects = [...range.getClientRects()];
        if (rects.length && Math.max(...rects.map(r => r.bottom)) <= limit) cut = start + end;
        else break;
      }
    }
    function fragment(from, to) {
      if (from === to || !nodes.length) return document.createDocumentFragment();
      const r = document.createRange();
      const left = nodes.find(x => x.start + x.node.length >= from) || nodes.at(-1);
      const right = nodes.find(x => x.start + x.node.length >= to) || nodes.at(-1);
      r.setStart(left.node, from - left.start); r.setEnd(right.node, to - right.start); return r.cloneContents();
    }
    a.replaceChildren(fragment(0, cut)); b.replaceChildren(fragment(cut, total)); headChars += cut; tailChars += total - cut;
  }
  if (!headChars || !tailChars) return null;
  head.dataset.fragment = 'start'; tail.dataset.fragment = 'continuation';
  tail.querySelectorAll('[id]').forEach(n => n.removeAttribute('id')); tail.removeAttribute('id');
  return [head, tail];
}
function place(p, el, gap = 16) {
  append(p, el, gap);
  if (fits(p)) return p;
  const previous = [...p.content.children].slice(0, -1);
  // A source entry is one bibliographic unit. Keep it intact when it fits a fresh page.
  if (el.dataset.type === 'source' && previous.length && el.getBoundingClientRect().height <= 912) {
    el.remove(); footnoteStrip(p); return place(newPage(p.kind, p.section, false, p.dark), el);
  }
  const headAtEnd = previous.at(-1)?.dataset.type === 'heading';
  // Keep at least two body lines with a heading.
  const remaining = p.content.getBoundingClientRect().bottom - el.getBoundingClientRect().top;
  if (headAtEnd && remaining < 42) {
    const heading = previous.at(-1); heading.remove(); el.remove(); footnoteStrip(p);
    p = newPage(p.kind, p.section, false, p.dark); append(p, heading); return place(p, el, 16);
  }
  // Table rows continue with repeated headers. First try moving complete rows.
  const rows = [...el.querySelectorAll('[data-table-row]')].filter(n => n.dataset.tableRow !== 'head');
  if (rows.length > 1) {
    const tail = el.cloneNode(true); const tailRows = [...tail.querySelectorAll('[data-table-row]')].filter(n => n.dataset.tableRow !== 'head');
    let count = rows.length;
    while (count > 1 && !fits(p)) rows[--count].remove();
    if (fits(p)) {
      tailRows.slice(0, count).forEach(n => n.remove());
      return place(newPage(p.kind, p.section, false, p.dark), tail, 16);
    }
    // Restore before the generic splitter.
    el.replaceWith(tail); el = tail;
  }
  for (let inset = 4; remaining >= 42 && inset <= 76; inset += 18) {
    const split = splitFlow(el, p.content.getBoundingClientRect().bottom - inset);
    if (!split) break;
    el.replaceWith(split[0]);
    if (fits(p)) return place(newPage(p.kind, p.section, false, p.dark), split[1], 16);
    split[0].replaceWith(el);
  }
  el.remove(); footnoteStrip(p);
  if (previous.length || p.opener) {
    if (headAtEnd) previous.at(-1).remove();
    p = newPage(p.kind, p.section, false, p.dark);
    if (headAtEnd) append(p, previous.at(-1));
    return place(p, el, 16);
  }
  throw new Error(`Component ${el.dataset.block} (${el.dataset.type}) cannot fit a continuation page. Split the content into smaller supported components; font sizes were preserved.`);
}

function tocGroup(section, entries) {
  const row = clone('SHE-0', '2.0');
  at(row, '2.0.0.0', section.letter || ''); const title = at(row, '2.0.1.0.0', '');
  const link = document.createElement('a'); link.href = '#' + section.id; link.textContent = section.title; title.append(link);
  title.style.flexShrink = '1';
  const list = find(row, '2.0.1.1'); const sample = list.firstElementChild.cloneNode(true); list.replaceChildren();
  for (const entry of entries) {
    const r = sample.cloneNode(true); const label = r.firstElementChild; const number = r.lastElementChild;
    label.children[0].textContent = entry.number || ''; label.children[1].textContent = entry.text;
    label.children[1].style.flexShrink = '1'; label.children[1].style.minWidth = '0';
    label.style.flexShrink = '1'; label.style.minWidth = '0';
    const anchor = document.createElement('a'); anchor.href = '#' + entry.id; Object.assign(anchor.style, { display: 'flex', alignItems: 'start', gap: '4px', minWidth: '0' });
    const children = [...label.children]; label.replaceChildren(anchor); anchor.append(...children);
    number.textContent = entry.page; number.style.minWidth = '24px'; number.style.textAlign = 'right';
    r.dataset.tocEntry = entry.id; list.append(r);
  }
  row.style.flexShrink = '0'; return row;
}
function darkIndices(count) {
  if (count < 4) return [];
  let target = Math.round(count * 0.225);
  const low = Math.ceil(count * 0.2), high = Math.floor(count * 0.25);
  if (low <= high) target = Math.max(low, Math.min(high, target));
  return Array.from({ length: target }, (_, i) => Math.min(count - 1, Math.floor((i + 0.5) * count / target)));
}
function buildBody(darkSet = new Set()) {
  let bodyIndex = 0;
  for (const section of doc.sections) {
    let p = newPage('body', section, true, darkSet.has(bodyIndex++));
    for (const block of section.blocks) {
      const before = pages.length;
      const el = makeBlock(block, p.dark); if (block.type === 'heading') el.id = block.id;
      rememberFlows(el);
      p = place(p, el, block.type === 'heading' ? 32 : 16);
      bodyIndex += pages.length - before;
    }
  }
}
function applyDarkThemes() {
  const body = pages.filter(p => p.kind === 'body');
  const indices = new Set(doc.options.darkPages ? darkIndices(body.length) : []);
  // Apply exact per-node colors from the matching dark export. Geometry remains unchanged.
  for (let i = 0; i < body.length; i++) {
    const p = body[i]; if (!indices.has(i)) continue;
    p.dark = true; p.el.dataset.theme = 'dark'; p.el.style.backgroundColor = '#1B1814';
    const byPath = new Map();
    for (const [light, dark] of Object.entries(themePairs)) {
      const ln = templates.get(light), dn = templates.get(dark);
      for (const e of [ln, ...ln.querySelectorAll('[data-p]')]) {
        const d = find(dn, e.dataset.p); if (!d) continue;
        byPath.set(light + ':' + e.dataset.p, d);
      }
    }
    function recolorTree(tree, sourceId) {
      for (const e of [tree, ...tree.querySelectorAll('[data-p]')]) {
        const d = byPath.get((e.dataset.source || sourceId) + ':' + e.dataset.p); if (!d) continue;
        for (const property of ['color', 'backgroundColor', 'borderColor', 'borderLeftColor', 'borderBottomColor', 'outlineColor', 'textDecorationColor']) if (d.style[property]) e.style[property] = d.style[property];
        if (e.dataset.symbol) symbol(e, e.dataset.symbol, true);
        if (e.dataset.lucide) e.style.color = d.querySelector('[stroke]').getAttribute('stroke');
        if (e.hasAttribute('fill') && d.hasAttribute('fill')) e.setAttribute('fill', d.getAttribute('fill'));
        if (e.hasAttribute('stroke') && d.hasAttribute('stroke')) e.setAttribute('stroke', d.getAttribute('stroke'));
      }
    }
    recolorTree(p.header, p.opener ? 'TTI-0' : 'U9A-0'); recolorTree(p.footer, 'TTI-0');
    for (const b of p.content.children) {
      const type = b.dataset.type;
      const source = type === 'callout' ? 'TW7-0' : type === 'cards' ? (b.dataset.p.startsWith('1.0.2') || b.dataset.p.startsWith('1.0.4') || b.dataset.p.startsWith('1.0.6') || b.dataset.p.startsWith('1.0.8') ? 'UBS-0' : 'U4R-0') : type === 'table' || type === 'code' ? 'U0I-0' : type === 'image-column' || type === 'image' ? 'U9A-0' : type === 'image-band' ? 'TZ3-0' : 'TTI-0';
      recolorTree(b, source);
      // Nested content has its own template lineage.
      for (const n of b.querySelectorAll('[data-source]')) recolorTree(n, n.dataset.source);
    }
    footnoteStrip(p);
  }
  return [...indices];
}

async function start() {
  // Load all fonts before making any pagination decisions.
  await Promise.all(['200 80px "Crimson Pro"', '300 40px "Crimson Pro"', '400 24px "Crimson Pro"', '700 14px "Crimson Pro"', '400 12px "Inter"', '600 12px "Inter"', '400 10px "Fragment Mono"', 'italic 400 12px "Inter"'].map(f => document.fonts.load(f)));
  await document.fonts.ready;
  buildCover(); buildBody();
  if (doc.sources.length || doc.appendix.length) {
    let p = newPage('appendix', null, true); p.el.id = 'appendix';
    if (doc.sources.length) {
      const h = makeBlock({ type: 'heading', text: 'Sources', id: 'sources-heading' }); p = place(p, h);
      doc.sources.forEach((source, i) => { const el = makeBlock({ ...source, type: 'source', id: `source-${i + 1}`, index: i }); rememberFlows(el); p = place(p, el, 16); });
    }
    for (const b of doc.appendix) { const el = makeBlock(b); rememberFlows(el); p = place(p, el); }
  }
  const bodyPages = [...pages]; let tocPages = [], guess = 1;
  for (let pass = 0; pass < 8; pass++) {
    tocPages.forEach(p => p.el.remove()); pages.splice(0, pages.length, ...bodyPages);
    let p = newPage('toc', null, true); tocPages = [p];
    const groups = doc.sections.map(section => {
      const entries = section.blocks.filter(b => b.type === 'heading' && b.number).map(b => ({ text: b.text, number: b.number, id: b.id }));
      if (!entries.length) entries.push({ text: section.title, id: section.id, number: '' });
      return { section, entries };
    });
    if (doc.sources.length || doc.appendix.length) groups.push({ section: { title: 'Appendix', id: 'appendix', letter: '' }, entries: [{ text: 'Sources', id: 'appendix', number: '' }] });
    groups.forEach(({ section, entries }) => {
      entries.forEach(entry => {
        const node = document.getElementById(entry.id);
        const index = bodyPages.findIndex(p => p.el === node || p.el.contains(node));
        if (index < 0) throw new Error('Missing contents target ' + entry.id);
        entry.page = index + guess;
      });
      // Long sections can span contents pages without changing the two-column structure.
      for (let offset = 0; offset < entries.length;) {
        let count = entries.length - offset, row;
        do {
          row?.remove();
          const group = tocGroup(section, entries.slice(offset, offset + count));
          row = document.createElement('div'); row.style.flexShrink = '0';
          if (p.content.children.length) row.append(clone('SHE-0', '2.1.0'));
          row.append(group); append(p, row, 32);
          if (fits(p)) break; count--;
        } while (count > 0);
        if (count === 0) {
          row.remove(); if (!p.content.children.length) throw new Error('Contents title is too large for the template.');
          p = newPage('toc', null, true); tocPages.push(p); continue;
        }
        offset += count;
        if (offset < entries.length) { p = newPage('toc', null, true); tocPages.push(p); }
      }
    });
    if (tocPages.length === guess) break;
    guess = tocPages.length; if (pass === 7) throw new Error('Contents pagination did not converge.');
  }
  pages.splice(0, pages.length, bodyPages[0], ...tocPages, ...bodyPages.slice(1));
  pages.forEach(p => document.body.append(p.el));
  const dark = applyDarkThemes();
  pages.forEach((p, physical) => {
    if (p.kind !== 'cover') { p.el.dataset.page = String(physical); const counter = textLeaves(p.header)[0]; counter.textContent = physical; }
  });
  await Promise.all([...document.images].map(im => im.decode()));
  await document.fonts.ready;
  const issues = [];
  for (const row of document.querySelectorAll('[data-toc-entry]')) {
    const label = row.firstElementChild, number = row.lastElementChild;
    const range = document.createRange(); range.selectNodeContents(label);
    if ([...range.getClientRects()].some(r => r.right > number.getBoundingClientRect().left - 4)) issues.push(`Contents label overlaps page number: ${row.dataset.tocEntry}`);
  }
  const actualFlows = new Map();
  for (const field of document.querySelectorAll('[data-flow]')) actualFlows.set(field.dataset.flow, (actualFlows.get(field.dataset.flow) || '') + field.textContent);
  const normalized = s => s.replace(/\s+/g, ' ').trim();
  for (const [key, expected] of expectedFlows) {
    const actual = actualFlows.get(key) || '';
    if (literalFlows.has(key) ? actual !== expected : normalized(actual) !== normalized(expected)) issues.push(`Content changed during pagination: ${key}`);
  }
  for (const p of pages) {
    if (p.content && !fits(p)) issues.push(`Overflow on page ${p.el.dataset.page}`);
    if (p.content?.lastElementChild?.dataset.type === 'heading') issues.push(`Orphan heading on page ${p.el.dataset.page}`);
    const pageRect = p.el.getBoundingClientRect();
    const textWalker = document.createTreeWalker(p.el, NodeFilter.SHOW_TEXT);
    let textNode;
    while ((textNode = textWalker.nextNode())) {
      if (!textNode.textContent.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(textNode);
      if ([...range.getClientRects()].some(r => r.left < pageRect.left - 1 || r.right > pageRect.right + 1 || r.bottom > pageRect.bottom + 1)) issues.push(`Text exceeds page ${p.el.dataset.page || 'cover'}: ${textNode.textContent.slice(0, 60)}`);
    }
    for (const e of p.el.querySelectorAll('[data-flow], [data-heading]')) {
      const r = e.getBoundingClientRect(); if (r.right > pageRect.right + 1 || r.left < pageRect.left - 1) issues.push(`Horizontal overflow: ${e.dataset.flow || e.dataset.heading}`);
    }
  }
  const cover = pages[0].el;
  if (cover.scrollHeight > 1056 || find(cover, '3.1').getBoundingClientRect().bottom > find(cover, '4').getBoundingClientRect().top + 1) issues.push('Cover text exceeds the designed cover capacity. Shorten supplied cover text or use a shorter display title.');
  window.ROVN_RESULT = { version: 'report-v1', darkPagesEnabled: doc.options.darkPages, pageCount: pages.length, bodyPageCount: pages.filter(p => p.kind === 'body').length, darkBodyIndices: dark, preservedContentFields: expectedFlows.size, pages: pages.map((p, i) => ({ physical: i + 1, printed: i || null, kind: p.kind, theme: p.dark ? 'dark' : 'light', section: p.section?.letter, opener: p.opener || false, notes: p.notes || [] })), issues, warnings: doc.warnings };
  if (issues.length) throw new Error(issues.join('\n'));
  window.ROVN_DONE = true;
}
start().catch(error => { window.ROVN_ERROR = error.stack || String(error); });
