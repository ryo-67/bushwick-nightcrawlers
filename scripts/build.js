#!/usr/bin/env node
/**
 * scripts/build.js — the deploy build. Vercel runs it (vercel.json)
 * and serves only what it writes to dist/.
 *
 * Copies the public files (PUBLIC below) into dist/ with every comment
 * removed from HTML, CSS and JS, so the live site's sources carry no
 * maintainer notes. Nothing else changes: code, file names and the
 * spacing between tokens stay as written. The repo keeps its comments.
 *
 * Each stripped JS file is parsed again and its syntax tree compared
 * with the original's; any difference fails the build.
 *
 *     npm run build
 *
 * Preview the result: cd dist && python3 ../scripts/dev-server.py 4178
 */

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist');

// Everything the site serves. api/ is deployed separately as a
// serverless function, straight from the repo.
const PUBLIC = [
  'index.html',
  'about.html',
  '404.html',
  'styles.css',
  'robots.txt',
  'sitemap.xml',
  'assets',
  'src',
];

// Removes the [start, end) ranges from text. A comment alone on its
// lines takes those lines with it; an inline one takes the spaces
// before it, and leaves a line break behind if it spanned one (in JS
// a line break can end a statement).
function removeRanges(text, ranges) {
  let out = '';
  let pos = 0;
  for (const [start, end] of ranges) {
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const nextBreak = text.indexOf('\n', end);
    const lineEnd = nextBreak === -1 ? text.length : nextBreak;
    const before = text.slice(lineStart, start);
    const after = text.slice(end, lineEnd);

    if (lineStart >= pos && !before.trim() && !after.trim()) {
      out += text.slice(pos, lineStart);
      pos = Math.min(lineEnd + 1, text.length);
      continue;
    }
    out += text.slice(pos, start).replace(/[ \t]+$/, '');
    if (/[\n\r\u2028\u2029]/.test(text.slice(start, end))) out += '\n';
    else if (before.trim() && after.trim()) out += ' ';
    pos = end;
  }
  return out + text.slice(pos);
}

// Returns the syntax tree and the comments' ranges. Every file under
// src/ parses as a module (framed.js, a classic script, included).
function parseJs(source, file) {
  const comments = [];
  try {
    const ast = acorn.parse(source, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      onComment: (block, text, start, end) => comments.push([start, end]),
    });
    return { ast, comments };
  } catch (e) {
    throw new Error(`${file}: ${e.message}`);
  }
}

// The syntax tree without source positions, for comparing two texts.
function shape(ast) {
  return JSON.stringify(ast, (key, value) =>
    key === 'start' || key === 'end' ? undefined : value
  );
}

function stripJs(source, file) {
  const { ast, comments } = parseJs(source, file);
  const stripped = removeRanges(source, comments);
  if (shape(parseJs(stripped, file).ast) !== shape(ast)) {
    throw new Error(`${file}: stripping comments changed the code`);
  }
  return stripped;
}

// CSS comments, skipping over quoted strings.
function stripCss(source) {
  const ranges = [];
  for (let i = 0; i < source.length; i += 1) {
    const c = source[i];
    if (c === '"' || c === "'") {
      for (i += 1; i < source.length && source[i] !== c; i += 1) {
        if (source[i] === '\\') i += 1;
      }
    } else if (c === '/' && source[i + 1] === '*') {
      const close = source.indexOf('*/', i + 2);
      const end = close === -1 ? source.length : close + 2;
      ranges.push([i, end]);
      i = end - 1;
    }
  }
  return removeRanges(source, ranges);
}

// HTML comments, leaving <script> contents untouched.
function stripHtml(source) {
  const ranges = [];
  const re = /<script\b[\s\S]*?<\/script>|<!--[\s\S]*?-->/gi;
  for (const match of source.matchAll(re)) {
    if (match[0].startsWith('<!--')) {
      ranges.push([match.index, match.index + match[0].length]);
    }
  }
  return removeRanges(source, ranges);
}

const STRIPPERS = { '.js': stripJs, '.css': stripCss, '.html': stripHtml };

function build(relative) {
  const from = path.join(ROOT, relative);
  const to = path.join(OUT, relative);
  if (fs.statSync(from).isDirectory()) {
    for (const entry of fs.readdirSync(from)) build(path.join(relative, entry));
    return;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  const strip = STRIPPERS[path.extname(relative)];
  if (strip) fs.writeFileSync(to, strip(fs.readFileSync(from, 'utf8'), relative));
  else fs.copyFileSync(from, to);
}

fs.rmSync(OUT, { recursive: true, force: true });
for (const entry of PUBLIC) build(entry);
console.log(`dist/: ${PUBLIC.join(', ')} (comments removed)`);
