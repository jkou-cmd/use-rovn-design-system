#!/usr/bin/env node
import {iconNames} from '../src/icons.mjs';
const term=(process.argv[2]||'').toLowerCase();
console.log(iconNames.filter(n=>n.includes(term)).join('\n'));
