// Paper's two symbol glyphs are captured assets: no platform-dependent fallback font.
export function symbol(el, glyph, dark = false) {
  if (!['⚬', '∙'].includes(glyph)) return;
  const circle = glyph === '⚬';
  el.textContent = ''; el.dataset.symbol = glyph; el.setAttribute('aria-label', glyph);
  Object.assign(el.style, {
    width: circle ? '24px' : '6px', height: circle ? '18px' : '9px',
    backgroundImage: `url("/assets/paper/${circle ? 'list-circle' : 'footer-dot'}-${dark ? 'dark' : 'light'}.png")`,
    backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat'
  });
}
export function normalizeTemplate(node, id) {
  const dark = ['P5W-0','QDS-0','PVO-0','RO3-0','S28-0','SEW-0','QRC-0'].includes(id);
  for (const el of [node, ...node.querySelectorAll('*')]) {
    if (el.style.fontFamily.includes('Crimson Pro')) el.style.fontFamily = '"Crimson Pro"';
    else if (el.style.fontFamily.includes('Inter')) el.style.fontFamily = '"Inter"';
    else if (el.style.fontFamily.includes('Fragment Mono')) el.style.fontFamily = '"Fragment Mono"';
    if (el.style.fontSize.endsWith('px') && el.style.lineHeight.endsWith('%')) el.style.lineHeight = Math.ceil(parseFloat(el.style.fontSize) * parseFloat(el.style.lineHeight) / 100) + 'px';
    if (!el.children.length) symbol(el, el.textContent.trim(), dark);
  }
}
