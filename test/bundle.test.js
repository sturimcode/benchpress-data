const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { buildBundle } = require('../scripts/build-bundle.js');

const root = path.join(__dirname, '..');

test('bundle contains schema version, tiers, and games keyed by slug', () => {
  const bundle = buildBundle(root);
  assert.strictEqual(bundle.schemaVersion, '1.0.0');
  assert.ok(bundle.tiers.gpuTiers['3070-class']);
  assert.ok(bundle.games['cyberpunk-2077']);
  assert.strictEqual(bundle.games['cyberpunk-2077'].identity.steamAppId, 1091500);
});

test('bundle game keys are sorted for deterministic output', () => {
  const bundle = buildBundle(root);
  const keys = Object.keys(bundle.games);
  assert.deepStrictEqual(keys, [...keys].sort());
});

test('bundle refuses to build from invalid data', () => {
  assert.throws(() => buildBundle(path.join(__dirname, 'fixtures', 'invalid-root')));
});
