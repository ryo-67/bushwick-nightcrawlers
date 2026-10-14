#!/usr/bin/env node
/**
 * scripts/generate-modulepreload.js
 *
 * Rewrites the modulepreload block in index.html from src/main.js's
 * static import graph. Without it the browser discovers each level of
 * imports only after the level above has arrived, one round trip per
 * level, and the map waits on the slowest chain before main.js runs.
 * With every module listed up front, the browser fetches them all in
 * parallel.
 *
 * Run whenever an import is added or removed anywhere under src/:
 *
 *     node scripts/generate-modulepreload.js
 *
 * A stale list doesn't break anything (a missing module just loads
 * late, an extra one is fetched for nothing), but keep it current.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENTRY = 'src/main.js';
const HTML = path.join(ROOT, 'index.html');
const START = '<!-- modulepreload:start';
const END = '<!-- modulepreload:end -->';

// Relative specifiers in `import … from '…'`, `export … from '…'`
// and bare `import '…'`.
const IMPORT_RE = /(?:\bfrom\s+|\bimport\s+)['"](\.{1,2}\/[^'"]+)['"]/g;

function importGraph(entry) {
  const seen = new Set();
  const visit = (file) => {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const [, specifier] of source.matchAll(IMPORT_RE)) {
      const dep = path.posix.join(path.posix.dirname(file), specifier);
      if (seen.has(dep)) continue;
      seen.add(dep);
      visit(dep);
    }
  };
  visit(entry);
  seen.delete(entry);
  return [...seen].sort();
}

const modules = importGraph(ENTRY);
const html = fs.readFileSync(HTML, 'utf8');
const start = html.indexOf(START);
const end = html.indexOf(END);
if (start === -1 || end === -1) {
  console.error(`index.html needs a "${START} … -->" … "${END}" block.`);
  process.exit(1);
}

const indent = html.slice(html.lastIndexOf('\n', start) + 1, start);
const startComment = html.slice(start, html.indexOf('-->', start) + 3);
const links = modules.map((m) => `${indent}<link rel="modulepreload" href="${m}">`);
const block = [startComment, ...links, `${indent}${END}`].join('\n');

fs.writeFileSync(HTML, html.slice(0, start) + block + html.slice(end + END.length));
console.log(`index.html: ${modules.length} modules preloaded.`);
