import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {loadInput, validateDocument, sectionLetter, cleanInline} from '../src/input.mjs';
import {localizeDocument} from '../src/runtime.mjs';
const document = blocks => ({schemaVersion:1,metadata:{title:'Test',author:'Example'},sections:[{title:'Start',blocks}]});
test('stable unique IDs survive preparation and inserted components', () => {
  const d=validateDocument(document([{type:'paragraph',id:'block-1',text:'One'},{type:'paragraph',text:'Two'},{type:'heading',text:'First'}]));
  assert.deepEqual(d.sections[0].blocks.map(b=>b.id),['block-1','block-2','block-3']);
  assert.equal(d.sections[0].blocks[2].number,'A1');
  assert.deepEqual(validateDocument(d), d);
  assert.throws(()=>validateDocument(document([{type:'paragraph',id:'same'},{type:'paragraph',id:'same'}])),/duplicate/);
  assert.equal(sectionLetter(25),'Z'); assert.equal(sectionLetter(26),'AA'); assert.equal(sectionLetter(701),'ZZ');
});
test('Markdown preserves structure, formatting, code, footnotes and explicit references', async () => {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rovn-input-'));
  try {
    const file=path.join(dir,'input.md');
    await fs.writeFile(file,'# Test\n\n## Alpha\n\n### Detail\n\nA **fact** with [a link](https://example.com) and a note.[^1]\n\n1. First\n   - Nested\n\n```js\n  const amount = 42;\n\n  return amount;\n```\n\n## References\n\n- A supplied source\n\n[^1]: Exact footnote.\n');
    const d=await loadInput(file), blocks=d.sections[0].blocks;
    assert.equal(d.metadata.title,'Test');assert.equal(d.sections.length,1);assert.equal(blocks[0].number,'A1');
    assert.match(blocks[1].html,/<strong>fact<\/strong>/);assert.match(blocks[1].html,/data-note="1"/);
    assert.equal(blocks.find(b=>b.type==='code').text,'  const amount = 42;\n\n  return amount;');
    assert.equal(blocks.filter(b=>b.type==='list-item')[1].depth,1);
    assert.match(d.footnotes['1'],/Exact footnote/);assert.equal(d.appendix.length,1);
  } finally { await fs.rm(dir,{recursive:true,force:true}); }
});
test('reject unsupported structures and unsafe source URLs', () => {
  assert.throws(()=>validateDocument(document([{type:'table',headers:['A'],rows:[['1','2']]}])),/column/);
  assert.throws(()=>validateDocument(document([{type:'equation',text:'x'}])),/Unsupported/);
  const d=document([]);d.sources=[{title:'Bad',url:'javascript:alert(1)'}];assert.throws(()=>validateDocument(d),/Source URLs/);
  assert.equal(cleanInline('<script>alert(1)</script><a href="javascript:alert(2)">Text</a>'),'<a>Text</a>');
});
test('local preparation embeds document-relative images and enforces amber headers', async () => {
  const d=validateDocument(document([{type:'image',src:'../../assets/bg1.png',caption:'A'}]));
  await localizeDocument(d,'tests/fixtures/test.md');assert.match(d.sections[0].blocks[0].src,/^data:image\/png;base64,/);
  const bad=validateDocument(document([]));bad.metadata.coverImage='assets/flower1.png';
  await assert.rejects(()=>localizeDocument(bad,'test.md'),/approved amber/);
});
test('DOCX imports title, section, emphasis and a table', async () => {
  const d=await loadInput('tests/fixtures/basic.docx');
  assert.equal(d.metadata.title,'DOCX example'); assert.equal(d.sections[0].title,'First section');
  assert.match(d.sections[0].blocks.find(b=>b.type==='paragraph').html,/<strong>42<\/strong>/);
  assert.deepEqual(d.sections[0].blocks.find(b=>b.type==='table').rows,[['Count','42']]);
});
test('Notion asides become callouts without changing their evidence or fenced HTML examples', async () => {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rovn-aside-'));
  try {
    const file=path.join(dir,'input.md');
    await fs.writeFile(file,'# Research\n\n<aside>\n🔎\n\n**Method limits.** No interviews were run. [Source](https://example.com)\n\n</aside>\n\n## Examples\n\n```html\n<aside>\nExample code\n</aside>\n```\n');
    const d=await loadInput(file);
    assert.equal(d.sections[0].blocks[0].type,'callout');
    assert.equal(d.sections[0].blocks[0].html,'<strong>Method limits.</strong> No interviews were run. <a href="https://example.com">Source</a>');
    assert.equal(d.sections[1].blocks[0].text,'<aside>\nExample code\n</aside>');
  } finally { await fs.rm(dir,{recursive:true,force:true}); }
});
test('callouts resolve contextual Lucide icons, explicit choices and icon-free variants', () => {
  const d=validateDocument(document([
    {type:'callout',variant:4,title:'Security',text:'Protect the medical history.'},
    {type:'callout',variant:2,icon:'graduation-cap',text:'Training.'},
    {type:'callout',variant:4,icon:'none',text:'Without icon.'},
    {type:'callout',variant:5,text:'A plain quote.'}
  ]));
  assert.equal(d.sections[0].blocks[0].icon,'shield-check');
  assert.equal(d.sections[0].blocks[1].icon,'graduation-cap');assert.equal(d.sections[0].blocks[1].variant,3);
  assert.equal(d.sections[0].blocks[2].icon,'none');assert.equal(d.sections[0].blocks[3].icon,undefined);
  assert.throws(()=>validateDocument(document([{type:'callout',icon:'../../secret'}])),/Unknown Lucide icon/);
  assert.throws(()=>validateDocument({...document([]),options:{darkPages:'false'}}),/must be true or false/);
});
test('Markdown dark-page preference survives preparation', async () => {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rovn-options-'));
  try {
    const file=path.join(dir,'input.md');await fs.writeFile(file,'---\ndarkPages: false\n---\n# Report\n\n## Start\n\nText.');
    const d=await loadInput(file);assert.equal(d.options.darkPages,false);assert.equal(validateDocument(d).options.darkPages,false);
  } finally { await fs.rm(dir,{recursive:true,force:true}); }
});
test('reviewed custom amber images remain portable through repeated preparation', async () => {
  const d=validateDocument(document([{type:'image-band',src:'assets/bg1.png',amberSrc:{src:'assets/bg2.png',mood:'amber'}}]));
  d.metadata.coverImage={src:'assets/bg1.png',mood:'amber',sourceUrl:'https://example.com/photo'};
  d.sections[0].headerImage={src:'assets/bg2.png',mood:'amber'};
  await localizeDocument(d,'report.md');
  assert.match(d.metadata.coverImage.src,/^data:image\/png;base64,/);
  assert.equal(d.metadata.coverImage.sourceUrl,'https://example.com/photo');
  const before=structuredClone(d);await localizeDocument(d,'another/location/report.json');assert.deepEqual(d,before);
  d.metadata.coverImage={src:'assets/bg1.png',mood:'blue'};
  await assert.rejects(()=>localizeDocument(d,'report.md'),/Custom cover\/header imagery/);
});
