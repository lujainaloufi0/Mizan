/**
 * Android 11+ hides other apps unless the manifest declares them in <queries>.
 * Mizan opens the delivery apps listed in src/features/delivery-apps.json, so
 * this plugin declares exactly those packages (no broad package visibility).
 */
const { withAndroidManifest } = require('expo/config-plugins');
const apps = require('../src/features/delivery-apps.json');

module.exports = function withDeliveryAppQueries(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const wanted = apps.map((a) => a.package);
    manifest.queries = manifest.queries ?? [];
    const declared = new Set(manifest.queries.flatMap((q) => (q.package ?? []).map((p) => p.$['android:name'])));
    const missing = wanted.filter((p) => !declared.has(p));
    if (missing.length) manifest.queries.push({ package: missing.map((name) => ({ $: { 'android:name': name } })) });
    return cfg;
  });
};
