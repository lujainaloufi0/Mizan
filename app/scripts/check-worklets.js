/**
 * Fails if any Reanimated worklet (useAnimatedStyle, useAnimatedProps, gesture
 * callbacks…) calls a plain JS function. Those calls work in the web preview
 * but crash instantly on a phone, because worklets run on the UI thread.
 *
 *   node scripts/check-worklets.js
 */
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// functions that are themselves worklets (safe to call from the UI thread)
const SAFE = new Set(['withTiming', 'withSpring', 'withSequence', 'withDelay', 'withRepeat', 'withDecay', 'interpolate', 'interpolateColor', 'clamp', 'scheduleOnRN', 'runOnJS', 'cancelAnimation']);

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(d, e.name)] : []));

let problems = 0;
let worklets = 0;
for (const file of walk(path.join(ROOT, 'src'))) {
  const { code } = babel.transformSync(fs.readFileSync(file, 'utf8'), {
    filename: file,
    cwd: ROOT,
    caller: { name: 'metro', platform: 'android', bundler: 'metro', isDev: true },
  });
  const re = /code:"function (\w+)\([^)]*\)\{const\{([^}]*)\}=this\.__closure;(.*?)",location/g;
  let m;
  while ((m = re.exec(code))) {
    worklets++;
    const captured = m[2].split(',').map((s) => s.trim()).filter((x) => x && !SAFE.has(x));
    const called = captured.filter((c) => new RegExp(`(^|[^.\\w])${c}\\(`).test(m[3]));
    if (called.length) {
      problems++;
      console.error(`✗ ${path.relative(ROOT, file)} (${m[1]}): calls ${called.join(', ')} on the UI thread — compute it outside the worklet`);
    }
  }
}
if (problems) process.exit(1);
console.log(`✓ ${worklets} worklets checked, none call a JS-thread function`);
