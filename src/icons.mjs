import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const directory=path.join(path.dirname(require.resolve('lucide-static/package.json')),'icons');
export const iconNames=fs.readdirSync(directory).filter(n=>n.endsWith('.svg')).map(n=>n.slice(0,-4)).sort();
const names=new Set(iconNames);
export function chooseIcon(block) {
  const text=`${block.title || ''} ${block.html || block.text || ''}`.replace(/<[^>]*>/g,' ').toLowerCase();
  const choices=[
    [/\b(warning|caution|danger|risk|hazard|expired|lapse)\b/,'triangle-alert'],
    [/\b(privacy|secure|security|protect|confidential|medical history)\b/,'shield-check'],
    [/\b(method|research|evidence|sources?|inference|interview)\b/,'search'],
    [/\b(deadline|renewal|expires?|date|schedule|waiting)\b/,'calendar-clock'],
    [/\b(cost|budget|price|money|pay|fee)\b/,'circle-dollar-sign'],
    [/\b(decision|choose|choice|options?)\b/,'signpost'],
    [/\b(tip|idea|suggestion|learn)\b/,'lightbulb'],
    [/\b(checklist|requirements?|tasks?|complete)\b/,'clipboard-check'],
    [/\b(quote|said|words)\b/,'quote']
  ];
  return choices.find(([pattern])=>pattern.test(text))?.[1] || 'info';
}
export function normalizeCalloutIcon(block) {
  if(block.icon!=null && (typeof block.icon!=='string' || !['auto','none'].includes(block.icon) && !names.has(block.icon))) throw new Error(`Unknown Lucide icon: ${block.icon}. Run node scripts/list-icons.mjs SEARCH to find a valid name.`);
  // Iconless designs remain iconless unless an icon is requested explicitly.
  if(block.icon==null && ![3,4,6].includes(block.variant))return;
  if(block.icon==='none')return;
  if(block.icon==null || block.icon==='auto')block.icon=chooseIcon(block);
  block.variant=({1:6,2:3,5:6})[block.variant] || block.variant;
}
export function documentIcons(doc) {
  const result={};
  function visit(block) {
    if(block.type==='callout' && block.icon && block.icon!=='none') {
      if(!names.has(block.icon))throw new Error('Unknown Lucide icon: '+block.icon);
      result[block.icon]=fs.readFileSync(path.join(directory,block.icon+'.svg'),'utf8');
    }
    block.blocks?.forEach(visit);
  }
  doc.sections.forEach(s=>s.blocks.forEach(visit));doc.appendix.forEach(visit);
  return result;
}
