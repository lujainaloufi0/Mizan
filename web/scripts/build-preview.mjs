// Builds preview-dist/mizan.html: one self-contained file (JS, CSS, fonts inlined).
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const out = join(root, 'preview-dist');
mkdirSync(out, { recursive: true });

// 1. CSS via the Tailwind CLI (same config as the Next app)
execFileSync('npx', ['tailwindcss', '-c', 'tailwind.config.js', '-i', 'src/app/globals.css', '-o', join(out, 'app.css'), '--minify'], { stdio: 'inherit' });
let css = readFileSync(join(out, 'app.css'), 'utf8');
css = css.replace(/url\(['"]?\/fonts\/([^'")]+)['"]?\)/g, (_, file) => {
  const b64 = readFileSync(join(root, 'public/fonts', file)).toString('base64');
  return `url(data:font/woff2;base64,${b64})`;
});

// 2. JS bundle
const result = await build({
  entryPoints: ['preview/main.tsx'],
  bundle: true,
  minify: true,
  write: false,
  format: 'iife',
  target: 'es2020',
  jsx: 'automatic',
  alias: { '@': './src' },
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'error',
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>مِيزان</title>
<meta name="theme-color" content="#121417" />
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script>${js}</script>
</body>
</html>`;
writeFileSync(join(out, 'mizan.html'), html);
// Body-only variant for hosts that supply their own document skeleton.
const fragment = `<title>مِيزان</title>
<style>${css}</style>
<div id="root" dir="rtl" lang="ar"></div>
<script>${js}</script>`;
writeFileSync(join(out, 'mizan-artifact.html'), fragment);
console.log(`preview-dist/mizan.html — ${(html.length / 1024).toFixed(0)} KB`);
