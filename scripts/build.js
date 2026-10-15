#!/usr/bin/env node
/**
 * scripts/build.js — the deploy build. Vercel runs it (vercel.json)
 * and serves only what it writes to dist/.
 *
 * Copies the public files (PUBLIC below) into dist/ with every comment
 * removed from HTML, SVG, CSS and JS, so the live site's sources carry no
 * maintainer notes. Nothing else changes: code, file names and the
 * spacing between tokens stay as written. The repo keeps its comments.
 * It also fills reviews.html with every review (scripts/render-reviews.js)
 * and writes dist/sitemap.xml, dating each page by its last commit.
 *
 * Each stripped JS file is parsed again and its syntax tree compared
 * with the original's; any difference fails the build.
 *
 *     npm run build
 *
 * Preview the result: cd dist && python3 ../scripts/dev-server.py 4178
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const { renderReviewList } = require('./render-reviews');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist');

// Everything the site serves. api/ is deployed separately as a
// serverless function, straight from the repo.
const PUBLIC = [
  'index.html',
  'about.html',
  'reviews.html',
  '404.html',
  'styles.css',
  'robots.txt',
  'llms.txt',
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

// HTML and SVG comments, leaving <script> contents untouched.
function stripMarkup(source) {
  const ranges = [];
  const re = /<script\b[\s\S]*?<\/script>|<!--[\s\S]*?-->/gi;
  for (const match of source.matchAll(re)) {
    if (match[0].startsWith('<!--')) {
      ranges.push([match.index, match.index + match[0].length]);
    }
  }
  return removeRanges(source, ranges);
}

const STRIPPERS = {
  '.js': stripJs,
  '.css': stripCss,
  '.html': stripMarkup,
  '.svg': stripMarkup,
};

// reviews.html marks where the reviews go; the marker's indentation
// is kept for every line put in its place.
const REVIEWS_MARKER = /^([ \t]*)<!-- reviews:list -->$/m;

function fillReviews(html, reviewList) {
  const match = html.match(REVIEWS_MARKER);
  if (!match) throw new Error('reviews.html: no <!-- reviews:list --> marker');
  const indented = reviewList
    .split('\n')
    .map((line) => (line ? match[1] + line : line))
    .join('\n');
  // A function, so "$" in the review text isn't read as a pattern.
  return html.replace(REVIEWS_MARKER, () => indented);
}

// Copies one public file or folder into dist/. fills maps a file to a
// function that completes its source before comments are stripped.
function build(relative, fills) {
  const from = path.join(ROOT, relative);
  const to = path.join(OUT, relative);
  if (fs.statSync(from).isDirectory()) {
    for (const entry of fs.readdirSync(from)) build(path.join(relative, entry), fills);
    return;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  const strip = STRIPPERS[path.extname(relative)];
  const fill = fills[relative];
  if (!strip) {
    fs.copyFileSync(from, to);
    return;
  }
  const source = fs.readFileSync(from, 'utf8');
  fs.writeFileSync(to, strip(fill ? fill(source) : source, relative));
}

// Pages in the sitemap, each with the files whose changes count as
// the page changing: its lastmod is the date of the latest commit
// that touched them.
const SITE = 'https://bushwick.shoro.space';
const PAGES = [
  { path: '/', sources: ['index.html', 'src/content'] },
  { path: '/about.html', sources: ['about.html'] },
  { path: '/reviews.html', sources: ['reviews.html', 'src/content'] },
];

function lastCommitDate(sources) {
  return execFileSync('git', ['log', '-1', '--format=%cs', '--', ...sources], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
}

function writeSitemap() {
  const urls = PAGES.map(({ path: page, sources }) => {
    const date = lastCommitDate(sources);
    // A checkout without the history leaves the date out rather
    // than claiming a wrong one.
    if (!date) console.warn(`sitemap: no commit date for ${page}`);
    const lastmod = date ? `<lastmod>${date}</lastmod>` : '';
    return `  <url><loc>${SITE}${page}</loc>${lastmod}</url>`;
  });
  fs.writeFileSync(
    path.join(OUT, 'sitemap.xml'),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls,
      '</urlset>',
      '',
    ].join('\n')
  );
}

async function main() {
  const reviewList = await renderReviewList(ROOT);
  const fills = { 'reviews.html': (html) => fillReviews(html, reviewList) };
  fs.rmSync(OUT, { recursive: true, force: true });
  for (const entry of PUBLIC) build(entry, fills);
  writeSitemap();
  console.log(`dist/: ${PUBLIC.join(', ')} (comments removed), sitemap.xml`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
